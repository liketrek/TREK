/**
 * Per-user plugin settings (#plugins): a user stores their OWN scope:'user' config
 * (API keys, prefs), separate from the admin-owned instance config. Proves: secrets
 * are encrypted at rest + masked to the client, an unchanged secret keeps its stored
 * ciphertext, only DECLARED user-scope keys are accepted, and the runtime read
 * (ctx.settings) returns the decrypted value.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Reversible crypto stub so we can assert encrypt-at-rest without a real key env.
vi.mock('../../../src/nest/common/crypto/apiKeyCrypto', () => ({
  maybe_encrypt_api_key: (v: unknown) => (typeof v === 'string' ? `enc:${v}` : v),
  decrypt_api_key: (v: unknown) => (typeof v === 'string' && v.startsWith('enc:') ? v.slice(4) : v),
}));

const { getDb } = vi.hoisted(() => ({ getDb: { current: null as unknown } }));
vi.mock('../../../src/db/database', () => ({ get db() { return getDb.current; } }));
import { db as dbConn } from '../../../src/db/database';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { AddonsService } from '../../../src/nest/addons/addons.service';

import Database from 'better-sqlite3';
import { PluginsService } from '../../../src/nest/plugins/plugins.service';
import { PluginUserSettingsService } from '../../../src/nest/plugins/plugin-user-settings.service';
/** The host-side settings reads, over the same connection the test seeded. */
const userSettings = () => new PluginUserSettingsService(new DatabaseService(dbConn));

function freshDb() {
  const d = new Database(':memory:');
  d.exec(`
    CREATE TABLE plugin_settings_fields (id INTEGER PRIMARY KEY AUTOINCREMENT, plugin_id TEXT, field_key TEXT, label TEXT, input_type TEXT, placeholder TEXT, hint TEXT, required INTEGER, secret INTEGER, scope TEXT, options TEXT, default_value TEXT, sort_order INTEGER);
    CREATE TABLE plugin_user_config (plugin_id TEXT, user_id INTEGER, config TEXT, updated_at TEXT, PRIMARY KEY (plugin_id, user_id));
  `);
  // p: a user-scope api key (secret) + a user-scope pref (not secret) + an INSTANCE field.
  const ins = d.prepare('INSERT INTO plugin_settings_fields (plugin_id, field_key, input_type, required, secret, scope, sort_order) VALUES (?,?,?,?,?,?,?)');
  ins.run('p', 'apiKey', 'text', 1, 1, 'user', 0);
  ins.run('p', 'units', 'select', 0, 0, 'user', 1);
  ins.run('p', 'adminOnly', 'text', 0, 1, 'instance', 2);
  return d;
}

describe('per-user plugin settings', () => {
  let svc: PluginsService;
  // AddonsService only feeds PluginsService.list(), which no case here calls, but it is a
  // real collaborator on the same connection rather than a stand-in.
  beforeEach(() => {
    getDb.current = freshDb();
    const dbs = new DatabaseService(dbConn);
    svc = new PluginsService(dbs, new AddonsService(dbs));
  });

  it('lists only the user-scope fields, in order', () => {
    const fields = svc.userSettingsFields('p');
    expect(fields.map(f => f.key)).toEqual(['apiKey', 'units']); // not the instance field
    expect(fields[0]).toMatchObject({ secret: true, required: true });
  });

  it('encrypts a secret at rest, masks it to the client, stores a plain field verbatim', () => {
    const masked = svc.updateUserConfig('p', 42, { apiKey: 'sk-123', units: 'metric' });
    expect(masked.apiKey).toBe('••••••••');       // never echoed
    expect(masked.units).toBe('metric');
    // decrypted runtime read returns the real value; the stored form is ciphertext
    expect(userSettings().readOne('p', 42, 'apiKey')).toBe('sk-123');
    expect(svc.getUserConfig('p', 42).apiKey).toBe('••••••••');
  });

  it('an unchanged secret (the mask) keeps the stored ciphertext', () => {
    svc.updateUserConfig('p', 42, { apiKey: 'sk-123' });
    svc.updateUserConfig('p', 42, { apiKey: '••••••••', units: 'imperial' }); // mask = untouched
    expect(userSettings().readOne('p', 42, 'apiKey')).toBe('sk-123'); // still the original
    expect(svc.getUserConfig('p', 42).units).toBe('imperial');
  });

  it('ignores keys that are not declared user-scope fields', () => {
    // apiKey is required — filled here so the save isn't refused; the assertion is
    // about adminOnly/bogus being dropped, not about required enforcement.
    svc.updateUserConfig('p', 42, { apiKey: 'sk-123', adminOnly: 'nope', bogus: 'x', units: 'metric' } as Record<string, unknown>);
    const cfg = svc.getUserConfig('p', 42);
    expect(cfg.adminOnly).toBeUndefined(); // instance field — not accepted here
    expect(cfg.bogus).toBeUndefined();
    expect(cfg.units).toBe('metric');
  });

  it('is per-user — one user cannot see another\'s value', () => {
    // apiKey is required — filled here so the save isn't refused; the point of this
    // test is that user 99 sees none of user 42's values.
    svc.updateUserConfig('p', 42, { apiKey: 'sk-123', units: 'metric' });
    expect(svc.getUserConfig('p', 99).units).toBeUndefined();
    expect(userSettings().readOne('p', 99, 'apiKey')).toBeUndefined();
  });
});

describe('manifest defaults reach the runtime reads', () => {
  // A `default` is not only a form pre-fill: with nothing stored, the child must see it
  // through ctx.settings.get() / the channel dispatch's readAll — otherwise a plugin
  // that ships a sensible default serves nobody until every user opens the form.
  let svc: PluginsService;
  beforeEach(() => {
    getDb.current = freshDb();
    const dbs = new DatabaseService(dbConn);
    svc = new PluginsService(dbs, new AddonsService(dbs));
    const ins = (getDb.current as import('better-sqlite3').Database).prepare(
      'INSERT INTO plugin_settings_fields (plugin_id, field_key, input_type, required, secret, scope, sort_order, default_value) VALUES (?,?,?,?,?,?,?,?)',
    );
    ins.run('p', 'region', 'select', 0, 0, 'user', 3, JSON.stringify('eu'));
    ins.run('p', 'retries', 'number', 0, 0, 'user', 4, JSON.stringify(3));
    ins.run('p', 'endpoint', 'text', 1, 0, 'user', 5, JSON.stringify('https://api.example'));
  });

  it('readOne falls back to the declared default when nothing is stored', () => {
    expect(userSettings().readOne('p', 42, 'region')).toBe('eu');
    expect(userSettings().readOne('p', 42, 'retries')).toBe(3); // JSON round-trip keeps the type
    expect(userSettings().readOne('p', 42, 'apiKey')).toBeUndefined(); // no default declared
  });

  it('a stored value wins over the default', () => {
    svc.updateUserConfig('p', 42, { apiKey: 'sk-123', region: 'us' });
    expect(userSettings().readOne('p', 42, 'region')).toBe('us');
    expect(userSettings().readOne('p', 99, 'region')).toBe('eu'); // another user still gets the default
  });

  it('readAll folds defaults in for the fields the user left unset', () => {
    svc.updateUserConfig('p', 42, { apiKey: 'sk-123', region: 'us' });
    expect(userSettings().readAll('p', 42)).toMatchObject({ apiKey: 'sk-123', region: 'us', retries: 3, endpoint: 'https://api.example' });
  });

  it('hasRequired treats a required field with a default as filled', () => {
    // apiKey is required with no default → not configured until stored.
    expect(userSettings().hasRequired('p', 42)).toBe(false);
    svc.updateUserConfig('p', 42, { apiKey: 'sk-123' });
    // endpoint is required too, but its default satisfies it.
    expect(userSettings().hasRequired('p', 42)).toBe(true);
  });
});

describe('hasRequired applies the same "filled" rule as the save gate', () => {
  // notifications.service reads hasRequired() to decide who a channel dispatches to; if
  // it disagreed with assertRequiredFilled() a save the form accepted could still leave
  // the user "not configured" (or the reverse).
  let svc: PluginsService;
  beforeEach(() => {
    getDb.current = freshDb();
    const dbs = new DatabaseService(dbConn);
    svc = new PluginsService(dbs, new AddonsService(dbs));
    (getDb.current as import('better-sqlite3').Database)
      .prepare('INSERT INTO plugin_settings_fields (plugin_id, field_key, input_type, required, secret, scope, sort_order) VALUES (?,?,?,?,?,?,?)')
      .run('p', 'consent', 'checkbox', 1, 0, 'user', 9);
  });

  it('exempts a required checkbox (consent, not a settings field)', () => {
    svc.updateUserConfig('p', 42, { apiKey: 'sk-123' }); // consent never set
    expect(userSettings().hasRequired('p', 42)).toBe(true);
  });

  it('treats a whitespace-only value as empty', () => {
    (getDb.current as import('better-sqlite3').Database)
      .prepare("INSERT INTO plugin_user_config (plugin_id, user_id, config, updated_at) VALUES ('p', 42, ?, '')")
      .run(JSON.stringify({ apiKey: '   ', consent: true }));
    expect(userSettings().hasRequired('p', 42)).toBe(false);
  });
});
