/**
 * Per-user plugin settings (#plugins): a user stores their OWN scope:'user' config
 * (API keys, prefs), separate from the admin-owned instance config. Proves: secrets
 * are encrypted at rest + masked to the client, an unchanged secret keeps its stored
 * ciphertext, only DECLARED user-scope keys are accepted, and the runtime read
 * (ctx.settings) returns the decrypted value.
 */
import { PluginActions } from '../../../src/db/entities/PluginActions.entity';
import { PluginCapabilityAudit } from '../../../src/db/entities/PluginCapabilityAudit.entity';
import { PluginEgressHosts } from '../../../src/db/entities/PluginEgressHosts.entity';
import { PluginErrorLog } from '../../../src/db/entities/PluginErrorLog.entity';
import { PluginSettingsFields } from '../../../src/db/entities/PluginSettingsFields.entity';
import { PluginUserConfig } from '../../../src/db/entities/PluginUserConfig.entity';
import { Plugins } from '../../../src/db/entities/Plugins.entity';
import { PluginUserSettingsService } from '../../../src/nest/plugins/plugin-user-settings.service';
import { PluginsService } from '../../../src/nest/plugins/plugins.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createTestAddonsService } from '../../helpers/test-addons';
import { sharedTestOrm } from '../../helpers/test-uow';

import Database from 'better-sqlite3';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Reversible crypto stub so we can assert encrypt-at-rest without a real key env.
vi.mock('../../../src/nest/common/crypto/apiKeyCrypto', () => ({
  maybe_encrypt_api_key: (v: unknown) => (typeof v === 'string' ? `enc:${v}` : v),
  decrypt_api_key: (v: unknown) => (typeof v === 'string' && v.startsWith('enc:') ? v.slice(4) : v),
}));

const { getDb } = vi.hoisted(() => ({ getDb: { current: null as unknown } }));
vi.mock('../../../src/db/database', () => ({
  get db() {
    return getDb.current;
  },
}));

/** Plan 3j Task 2 — PluginsService's own six repositories, over whichever fresh `getDb.current` the caller just set. */
async function makePluginsService(): Promise<PluginsService> {
  const orm = await sharedTestOrm(getDb.current as Database.Database);
  return new PluginsService(
    await createTestAddonsService(getDb.current as Database.Database),
    orm.repo(Plugins),
    orm.repo(PluginEgressHosts),
    orm.repo(PluginSettingsFields),
    orm.repo(PluginActions),
    orm.repo(PluginUserConfig),
    orm.repo(PluginErrorLog),
    orm.repo(PluginCapabilityAudit),
  );
}
/**
 * The host-side settings reads, over the same connection the test seeded — a fresh
 * `orm` per test (`sharedTestOrm` is memoized per db HANDLE, and `beforeEach` swaps
 * `getDb.current` to a brand-new `:memory:` db every time, same as `makePluginsService`).
 */
async function userSettings(): Promise<PluginUserSettingsService> {
  const orm = await sharedTestOrm(getDb.current as Database.Database);
  return new PluginUserSettingsService(orm.repo(PluginSettingsFields), orm.repo(PluginUserConfig));
}

function freshDb() {
  const d = createSnapshotTestDb();
  // p: a user-scope api key (secret) + a user-scope pref (not secret) + an INSTANCE field.
  const ins = d.prepare(
    'INSERT INTO plugin_settings_fields (plugin_id, field_key, input_type, required, secret, scope, sort_order) VALUES (?,?,?,?,?,?,?)',
  );
  ins.run('p', 'apiKey', 'text', 1, 1, 'user', 0);
  ins.run('p', 'units', 'select', 0, 0, 'user', 1);
  ins.run('p', 'adminOnly', 'text', 0, 1, 'instance', 2);
  return d;
}

describe('per-user plugin settings', () => {
  let svc: PluginsService;
  // AddonsService only feeds PluginsService.list(), which no case here calls, but it is a
  // real collaborator on the same connection rather than a stand-in.
  beforeEach(async () => {
    getDb.current = freshDb();
    svc = await makePluginsService();
  });

  it('lists only the user-scope fields, in order', async () => {
    const fields = await svc.userSettingsFields('p');
    expect(fields.map((f) => f.key)).toEqual(['apiKey', 'units']); // not the instance field
    expect(fields[0]).toMatchObject({ secret: true, required: true });
  });

  it('encrypts a secret at rest, masks it to the client, stores a plain field verbatim', async () => {
    const masked = await svc.updateUserConfig('p', 42, { apiKey: 'sk-123', units: 'metric' });
    expect(masked.apiKey).toBe('••••••••'); // never echoed
    expect(masked.units).toBe('metric');
    // decrypted runtime read returns the real value; the stored form is ciphertext
    expect(await (await userSettings()).readOne('p', 42, 'apiKey')).toBe('sk-123');
    expect((await svc.getUserConfig('p', 42)).apiKey).toBe('••••••••');
  });

  it('an unchanged secret (the mask) keeps the stored ciphertext', async () => {
    await svc.updateUserConfig('p', 42, { apiKey: 'sk-123' });
    await svc.updateUserConfig('p', 42, { apiKey: '••••••••', units: 'imperial' }); // mask = untouched
    expect(await (await userSettings()).readOne('p', 42, 'apiKey')).toBe('sk-123'); // still the original
    expect((await svc.getUserConfig('p', 42)).units).toBe('imperial');
  });

  it('ignores keys that are not declared user-scope fields', async () => {
    // apiKey is required — filled here so the save isn't refused; the assertion is
    // about adminOnly/bogus being dropped, not about required enforcement.
    await svc.updateUserConfig('p', 42, { apiKey: 'sk-123', adminOnly: 'nope', bogus: 'x', units: 'metric' } as Record<
      string,
      unknown
    >);
    const cfg = await svc.getUserConfig('p', 42);
    expect(cfg.adminOnly).toBeUndefined(); // instance field — not accepted here
    expect(cfg.bogus).toBeUndefined();
    expect(cfg.units).toBe('metric');
  });

  it("is per-user — one user cannot see another's value", async () => {
    // apiKey is required — filled here so the save isn't refused; the point of this
    // test is that user 99 sees none of user 42's values.
    await svc.updateUserConfig('p', 42, { apiKey: 'sk-123', units: 'metric' });
    expect((await svc.getUserConfig('p', 99)).units).toBeUndefined();
    expect(await (await userSettings()).readOne('p', 99, 'apiKey')).toBeUndefined();
  });
});

describe('manifest defaults reach the runtime reads', () => {
  // A `default` is not only a form pre-fill: with nothing stored, the child must see it
  // through ctx.settings.get() / the channel dispatch's readAll — otherwise a plugin
  // that ships a sensible default serves nobody until every user opens the form.
  let svc: PluginsService;
  beforeEach(async () => {
    getDb.current = freshDb();
    svc = await makePluginsService();
    const ins = (getDb.current as import('better-sqlite3').Database).prepare(
      'INSERT INTO plugin_settings_fields (plugin_id, field_key, input_type, required, secret, scope, sort_order, default_value) VALUES (?,?,?,?,?,?,?,?)',
    );
    ins.run('p', 'region', 'select', 0, 0, 'user', 3, JSON.stringify('eu'));
    ins.run('p', 'retries', 'number', 0, 0, 'user', 4, JSON.stringify(3));
    ins.run('p', 'endpoint', 'text', 1, 0, 'user', 5, JSON.stringify('https://api.example'));
  });

  it('readOne falls back to the declared default when nothing is stored', async () => {
    expect(await (await userSettings()).readOne('p', 42, 'region')).toBe('eu');
    expect(await (await userSettings()).readOne('p', 42, 'retries')).toBe(3); // JSON round-trip keeps the type
    expect(await (await userSettings()).readOne('p', 42, 'apiKey')).toBeUndefined(); // no default declared
  });

  it('a stored value wins over the default', async () => {
    await svc.updateUserConfig('p', 42, { apiKey: 'sk-123', region: 'us' });
    expect(await (await userSettings()).readOne('p', 42, 'region')).toBe('us');
    expect(await (await userSettings()).readOne('p', 99, 'region')).toBe('eu'); // another user still gets the default
  });

  it('readAll folds defaults in for the fields the user left unset', async () => {
    await svc.updateUserConfig('p', 42, { apiKey: 'sk-123', region: 'us' });
    expect(await (await userSettings()).readAll('p', 42)).toMatchObject({
      apiKey: 'sk-123',
      region: 'us',
      retries: 3,
      endpoint: 'https://api.example',
    });
  });

  it('hasRequired treats a required field with a default as filled', async () => {
    // apiKey is required with no default → not configured until stored.
    expect(await (await userSettings()).hasRequired('p', 42)).toBe(false);
    await svc.updateUserConfig('p', 42, { apiKey: 'sk-123' });
    // endpoint is required too, but its default satisfies it.
    expect(await (await userSettings()).hasRequired('p', 42)).toBe(true);
  });
});

describe('hasRequired applies the same "filled" rule as the save gate', () => {
  // notifications.service reads hasRequired() to decide who a channel dispatches to; if
  // it disagreed with assertRequiredFilled() a save the form accepted could still leave
  // the user "not configured" (or the reverse).
  let svc: PluginsService;
  beforeEach(async () => {
    getDb.current = freshDb();
    svc = await makePluginsService();
    (getDb.current as import('better-sqlite3').Database)
      .prepare(
        'INSERT INTO plugin_settings_fields (plugin_id, field_key, input_type, required, secret, scope, sort_order) VALUES (?,?,?,?,?,?,?)',
      )
      .run('p', 'consent', 'checkbox', 1, 0, 'user', 9);
  });

  it('exempts a required checkbox (consent, not a settings field)', async () => {
    await svc.updateUserConfig('p', 42, { apiKey: 'sk-123' }); // consent never set
    expect(await (await userSettings()).hasRequired('p', 42)).toBe(true);
  });

  it('treats a whitespace-only value as empty', async () => {
    (getDb.current as import('better-sqlite3').Database)
      .prepare("INSERT INTO plugin_user_config (plugin_id, user_id, config, updated_at) VALUES ('p', 42, ?, '')")
      .run(JSON.stringify({ apiKey: '   ', consent: true }));
    expect(await (await userSettings()).hasRequired('p', 42)).toBe(false);
  });
});
