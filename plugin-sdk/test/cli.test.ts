import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateManifest } from '../src/index.js';
import { scaffold } from '../src/cli/create.js';
import { PERMISSION_CATALOG, PERMISSION_FAMILIES, KNOWN_PERMISSIONS, isInteractive, missingArgs } from '../src/cli/ui.js';
// The authoritative set — what the HOST accepts at activation. The picker must match it.
import { KNOWN_PERMISSIONS as MANIFEST_PERMISSIONS } from '../src/manifest.js';
import { resolveMenuChoice, PRIMARY_MENU, ADVANCED_MENU } from '../src/cli/menu.js';

describe('scaffold egress (http:outbound)', () => {
  let tmp: string;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'egress-')); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('writes egress so an http:outbound plugin validates', () => {
    scaffold('net-plug', 'integration', tmp, { permissions: ['http:outbound'], egress: ['api.example.com'] });
    const m = JSON.parse(fs.readFileSync(path.join(tmp, 'net-plug', 'trek-plugin.json'), 'utf8'));
    expect(m.egress).toEqual(['api.example.com']);
    expect(validateManifest(m).ok).toBe(true);
  });

  it('without egress it scaffolds an operatorEgress plugin (the admin names the hosts)', () => {
    // The author of a plugin for an always-self-hosted service has no host to write down.
    // The scaffold must NOT invent a placeholder — it declares operatorEgress instead, which
    // is the one way an empty egress[] is a valid manifest.
    scaffold('net-plug', 'integration', tmp, { permissions: ['http:outbound'] });
    const m = JSON.parse(fs.readFileSync(path.join(tmp, 'net-plug', 'trek-plugin.json'), 'utf8'));
    expect(m.egress).toBeUndefined();
    expect(m.operatorEgress).toBe(true);
    expect(validateManifest(m).ok).toBe(true);
  });

  it('omits egress entirely when none is given (no empty array noise)', () => {
    scaffold('plain-plug', 'integration', tmp, { permissions: ['db:own'] });
    const m = JSON.parse(fs.readFileSync(path.join(tmp, 'plain-plug', 'trek-plugin.json'), 'utf8'));
    expect('egress' in m).toBe(false);
  });
});

describe('permission catalog', () => {
  // This test used to PIN an 18-item list and call it "exactly the known permission ids".
  // It was wrong: the real set is ~58, so `create` could not offer jobs:run,
  // events:subscribe or 7 of the 12 hooks, and the assertion guaranteed nobody noticed.
  // It now asserts COVERAGE against the manifest validator's list, which is the only
  // list the host actually honours — so a new TREK permission fails here until `create`
  // can offer it.
  it('offers every permission the host accepts — no more, no less', () => {
    expect([...KNOWN_PERMISSIONS].sort()).toEqual([...MANIFEST_PERMISSIONS].sort());
  });

  it('describes every permission, and files it in exactly one family', () => {
    for (const p of PERMISSION_CATALOG) {
      expect(p.hint.length, `${p.value} has no hint`).toBeGreaterThan(0);
      expect(PERMISSION_FAMILIES.filter((f) => f.permissions.some((x) => x.value === p.value)))
        .toHaveLength(1);
    }
    // No duplicates across families — a permission listed twice would render twice.
    expect(new Set(KNOWN_PERMISSIONS).size).toBe(KNOWN_PERMISSIONS.length);
  });

  it('every family is non-empty and described (an empty one is a dead prompt entry)', () => {
    for (const f of PERMISSION_FAMILIES) {
      expect(f.permissions.length, `family ${f.id} is empty`).toBeGreaterThan(0);
      expect(f.label.length).toBeGreaterThan(0);
      expect(f.hint.length).toBeGreaterThan(0);
    }
  });
});

describe('resolveMenuChoice', () => {
  it('maps every menu value (commands + control entries) to itself', () => {
    for (const item of [...PRIMARY_MENU, ...ADVANCED_MENU]) {
      expect(resolveMenuChoice(item.value)).toBe(item.value);
    }
  });
  it('returns undefined for anything not in the menu', () => {
    expect(resolveMenuChoice('nope')).toBeUndefined();
    expect(resolveMenuChoice('')).toBeUndefined();
  });
});

describe('missingArgs', () => {
  it('reports the absent required flags, in order', () => {
    expect(missingArgs({}, ['repo', 'tag'])).toEqual(['repo', 'tag']);
    expect(missingArgs({ repo: 'a/b' }, ['repo', 'tag'])).toEqual(['tag']);
    expect(missingArgs({ repo: 'a/b', tag: 'v1.0.0' }, ['repo', 'tag'])).toEqual([]);
  });
});

describe('isInteractive', () => {
  it('is false when stdin/stdout are not TTYs (CI / pipes — the parity path)', () => {
    const inTTY = process.stdin.isTTY;
    const outTTY = process.stdout.isTTY;
    try {
      (process.stdin as { isTTY?: boolean }).isTTY = undefined;
      (process.stdout as { isTTY?: boolean }).isTTY = undefined;
      expect(isInteractive()).toBe(false);
      (process.stdin as { isTTY?: boolean }).isTTY = true;
      (process.stdout as { isTTY?: boolean }).isTTY = true;
      expect(isInteractive()).toBe(true);
    } finally {
      (process.stdin as { isTTY?: boolean }).isTTY = inTTY;
      (process.stdout as { isTTY?: boolean }).isTTY = outTTY;
    }
  });
});

describe('scaffold + validate dependencies', () => {
  let tmp: string;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deps-')); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('scaffolds empty dependency arrays that validate', () => {
    scaffold('dep-plug', 'integration', tmp, { permissions: ['db:own'] });
    const m = JSON.parse(fs.readFileSync(path.join(tmp, 'dep-plug', 'trek-plugin.json'), 'utf8'));
    expect(m.requiredAddons).toEqual([]);
    expect(m.pluginDependencies).toEqual([]);
    expect(validateManifest(m).ok).toBe(true);
  });

  it('scaffolds requiredAddons passed as an option', () => {
    scaffold('addon-plug', 'integration', tmp, { permissions: ['db:own'], requiredAddons: ['budget'] });
    const m = JSON.parse(fs.readFileSync(path.join(tmp, 'addon-plug', 'trek-plugin.json'), 'utf8'));
    expect(m.requiredAddons).toEqual(['budget']);
    expect(validateManifest(m).ok).toBe(true);
  });
});

describe('validateManifest dependency rules', () => {
  const base = { id: 'my-plug', name: 'My Plug', version: '1.0.0', type: 'integration', permissions: ['db:own'], trek: '>=3.2.0 <4.0.0' };
  it('accepts valid requiredAddons + pluginDependencies', () => {
    const r = validateManifest({ ...base, requiredAddons: ['budget', 'journey'], pluginDependencies: [{ id: 'koffi', version: '>=1.0.0 <2.0.0' }] });
    expect(r.ok).toBe(true);
    expect(r.manifest?.requiredAddons).toEqual(['budget', 'journey']);
    expect(r.manifest?.pluginDependencies).toEqual([{ id: 'koffi', version: '>=1.0.0 <2.0.0' }]);
  });
  it('rejects a bad addon id, bad dep range, self-dependency, and duplicates', () => {
    expect(validateManifest({ ...base, requiredAddons: ['Nope!'] }).ok).toBe(false);
    expect(validateManifest({ ...base, pluginDependencies: [{ id: 'koffi', version: 'nope' }] }).ok).toBe(false);
    expect(validateManifest({ ...base, pluginDependencies: [{ id: 'my-plug', version: '*' }] }).ok).toBe(false);
    expect(validateManifest({ ...base, pluginDependencies: [{ id: 'koffi', version: '*' }, { id: 'koffi', version: '^1' }] }).ok).toBe(false);
  });
});

describe('notification-channel template', () => {
  let tmp: string;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chan-')); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  function make(over: Parameters<typeof scaffold>[3] = {}) {
    scaffold('my-gotify', 'integration', tmp, { template: 'notification-channel', ...over });
    return JSON.parse(fs.readFileSync(path.join(tmp, 'my-gotify', 'trek-plugin.json'), 'utf8'));
  }

  it('scaffolds a valid manifest with the hook grant, matching egress, and the capability', () => {
    const m = make({ egress: ['gotify.example.com'] });
    expect(m.type).toBe('integration'); // a channel is NOT a new plugin type
    expect(m.permissions).toContain('hook:notification-channel');
    expect(m.permissions).toContain('http:outbound:gotify.example.com');
    expect(m.egress).toEqual(['gotify.example.com']);
    expect(m.capabilities.notificationChannel.title).toBe('My Gotify');
    expect(validateManifest(m).ok).toBe(true);
  });

  it('names no host when the author names none — bare http:outbound + operatorEgress', () => {
    // The common case: a Gotify/ntfy channel targets the USER's own server. Inventing a
    // `gotify.example.com` placeholder would ship a host nobody actually calls in the
    // published manifest, and grant an outbound host the plugin never needs.
    const m = make();
    expect(m.permissions).toContain('hook:notification-channel');
    expect(m.permissions).toContain('http:outbound');
    expect(m.permissions.some((p: string) => p.startsWith('http:outbound:'))).toBe(false);
    expect('egress' in m).toBe(false);
    expect(m.operatorEgress).toBe(true);
    expect(validateManifest(m).ok).toBe(true);
  });

  it('declares the per-user credential as a secret, required, user-scoped field', () => {
    const m = make();
    const token = m.settings.find((s: { key: string }) => s.key === 'appToken');
    // These three flags are exactly what makes the host hand it to the hook as `config`.
    expect(token.scope).toBe('user');
    expect(token.secret).toBe(true);
    expect(token.required).toBe(true);
  });

  it('generates a server entry that implements the hook', () => {
    make();
    const js = fs.readFileSync(path.join(tmp, 'my-gotify', 'server', 'index.js'), 'utf8');
    expect(js).toContain('notificationChannel');
    expect(js).toContain('async send(msg, config, ctx)');
    expect(js).toContain('config.appToken');

    // The invariant is about WHERE ctx.settings.get() may be used, not whether:
    //  - the HOOK is userless, so it must read credentials from its `config` argument;
    //  - an ACTION is user-initiated, so it SHOULD read them via ctx.settings.get().
    const hookBody = js.slice(js.indexOf('notificationChannel:'));
    expect(hookBody).not.toContain('ctx.settings.get');
    const actionBody = js.slice(js.indexOf('actions:'), js.indexOf('hooks:'));
    expect(actionBody).toContain('await ctx.settings.get');
  });

  it('scaffolds a Test connection action so the user can verify credentials', () => {
    const m = make();
    expect(m.actions).toEqual([{ key: 'testConnection', label: 'Test connection' }]);
    expect(validateManifest(m).ok).toBe(true);
  });

  it('rejects a malformed action key', () => {
    const m = make();
    expect(validateManifest({ ...m, actions: [{ key: '__proto__', label: 'x' }] }).ok).toBe(false);
    expect(validateManifest({ ...m, actions: [{ key: 'a', label: 'x' }, { key: 'a', label: 'y' }] }).ok).toBe(false);
  });

  it('is server-only: no client/ dir, and a UI type is refused', () => {
    make();
    expect(fs.existsSync(path.join(tmp, 'my-gotify', 'client'))).toBe(false);
    expect(() => scaffold('my-widget', 'widget', tmp, { template: 'notification-channel' })).toThrow(/requires type "integration"/);
  });
});

describe('capabilities.notificationChannel validation', () => {
  const base = {
    id: 'chan', name: 'Chan', version: '1.0.0', apiVersion: 1, type: 'integration',
    nativeModules: false, permissions: ['hook:notification-channel'], trek: '>=3.2.0 <4.0.0',
  };

  it('accepts a narrowed event list', () => {
    const r = validateManifest({ ...base, capabilities: { notificationChannel: { events: ['trip_invite', 'booking_change'] } } });
    expect(r.ok).toBe(true);
  });

  it('rejects an event a plugin channel can never carry', () => {
    // version_available is admin-scoped — it goes out over the admin's own credentials.
    const r = validateManifest({ ...base, capabilities: { notificationChannel: { events: ['version_available'] } } });
    expect(r.ok).toBe(false);
    expect(r.errors!.join(' ')).toMatch(/not a plugin-deliverable event/);
  });

  it('rejects the capability without the matching grant', () => {
    const r = validateManifest({ ...base, permissions: ['db:own'], capabilities: { notificationChannel: { title: 'X' } } });
    expect(r.ok).toBe(false);
    expect(r.errors!.join(' ')).toMatch(/requires the "hook:notification-channel" permission/);
  });
});
