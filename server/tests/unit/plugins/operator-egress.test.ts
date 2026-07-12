/**
 * Operator-supplied egress hosts.
 *
 * A plugin's egress allow-list is fixed in its manifest at publish time, but a plugin that
 * talks to a SELF-HOSTED service (Gotify, ntfy, …) cannot know the operator's hostname —
 * so a community plugin would serve nobody. An ADMIN adds the hosts post-install and the
 * runtime unions them into the child's allow-list at spawn.
 *
 * The invariants that keep this from becoming an egress bypass:
 *   - only a plugin that DECLARED operatorEgress may have hosts (install-time consent);
 *   - hosts are validated like manifest egress (no bare `*`, no scheme, no whole-TLD);
 *   - it is always the ADMIN, never an end user, who widens it;
 *   - changing the set RE-SPAWNS the plugin, because the child's guard is install-once.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  return { testDb: db, dbMock: { db, closeDb: () => {}, reinitialize: () => {}, canAccessTrip: () => null } };
});
vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({ JWT_SECRET: 'x'.repeat(40), ENCRYPTION_KEY: 'a'.repeat(64), updateJwtSecret: () => {} }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';
import { parseManifest, ManifestError } from '../../../src/nest/plugins/install/manifest';
import { makeHostAllow } from '../../../src/nest/plugins/runtime/egress-policy';

function install(id: string, operatorEgress: boolean, perms: string[] = ['http:outbound:gotify.net']) {
  testDb.prepare(
    `INSERT OR REPLACE INTO plugins (id, name, status, enabled, version, permissions, granted_permissions, capabilities, config, operator_egress)
     VALUES (?, ?, 'inactive', 0, '1.0.0', ?, ?, '{}', '{}', ?)`,
  ).run(id, id, JSON.stringify(perms), JSON.stringify(perms), operatorEgress ? 1 : 0);
}

let rt: PluginRuntimeService;

beforeAll(() => { createTables(testDb); runMigrations(testDb); });
beforeEach(() => {
  testDb.prepare('DELETE FROM plugins').run();
  testDb.prepare('DELETE FROM plugin_egress_hosts').run();
  testDb.prepare('DELETE FROM plugin_actions').run();
  rt = new PluginRuntimeService();
});

describe('operator-supplied egress hosts', () => {
  it('OEG-001 — an admin can add hosts to a plugin that declared operatorEgress', async () => {
    install('gotify', true);
    expect(rt.wantsOperatorEgress('gotify')).toBe(true);
    expect(await rt.setOperatorEgressHosts('gotify', ['gotify.mydomain.com'])).toEqual(['gotify.mydomain.com']);
    expect(rt.operatorEgressHosts('gotify')).toEqual(['gotify.mydomain.com']);
  });

  it('OEG-002 — a plugin that did NOT declare it can never have hosts added', async () => {
    install('sneaky', false);
    expect(rt.wantsOperatorEgress('sneaky')).toBe(false);
    // This is the load-bearing check: without it an admin could silently widen egress for
    // ANY plugin, and the install-time consent would stop bounding what's possible.
    await expect(rt.setOperatorEgressHosts('sneaky', ['evil.example.com'])).rejects.toThrow(/did not declare operatorEgress/);
    expect(rt.operatorEgressHosts('sneaky')).toEqual([]);
  });

  it('OEG-003 — hosts are validated exactly like manifest egress', async () => {
    install('gotify', true);
    for (const bad of ['*', '*.com', 'https://gotify.example.com', 'has space', 'a/b']) {
      await expect(rt.setOperatorEgressHosts('gotify', [bad])).rejects.toThrow(/invalid host/);
    }
    // A legitimate wildcard with a real multi-label suffix is fine.
    expect(await rt.setOperatorEgressHosts('gotify', ['*.mydomain.com'])).toEqual(['*.mydomain.com']);
  });

  it('OEG-004 — hosts are normalized and de-duplicated', async () => {
    install('gotify', true);
    expect(await rt.setOperatorEgressHosts('gotify', ['Gotify.MyDomain.com', 'gotify.mydomain.com.', ' ', ''])).toEqual([
      'gotify.mydomain.com',
    ]);
  });

  it('OEG-005 — setting the list replaces it (a removed host is really gone)', async () => {
    install('gotify', true);
    await rt.setOperatorEgressHosts('gotify', ['a.example.com', 'b.example.com']);
    await rt.setOperatorEgressHosts('gotify', ['b.example.com']);
    expect(rt.operatorEgressHosts('gotify')).toEqual(['b.example.com']);
  });

  it('OEG-006 — the manifest rejects operatorEgress without an outbound permission', () => {
    const base = { id: 'chan', name: 'Chan', version: '1.0.0', apiVersion: 1, type: 'integration', nativeModules: false };
    expect(() => parseManifest({ ...base, permissions: ['db:own'], operatorEgress: true })).toThrow(/requires an http:outbound/);
    expect(() => parseManifest({ ...base, permissions: [], operatorEgress: 'yes' })).toThrow(ManifestError);
    // …and accepts the real thing.
    const m = parseManifest({ ...base, permissions: ['http:outbound:gotify.net'], egress: ['gotify.net'], operatorEgress: true });
    expect(m.operatorEgress).toBe(true);
  });

  it('OEG-009 — an operatorEgress plugin may ship an EMPTY egress[]; anyone else may not', () => {
    const base = { id: 'chan', name: 'Chan', version: '1.0.0', apiVersion: 1, type: 'integration', nativeModules: false };
    // A self-hosted target (Gotify, ntfy) has no host the author can name at publish time.
    const m = parseManifest({ ...base, permissions: ['http:outbound'], operatorEgress: true });
    expect(m.egress).toEqual([]);
    expect(m.operatorEgress).toBe(true);
    // Without the flag an empty egress[] is still refused — this is what stops a plugin
    // from asking for outbound while declaring no reach at all.
    expect(() => parseManifest({ ...base, permissions: ['http:outbound'] })).toThrow(/egress\[\] is empty/);
  });

  it('OEG-010 — an operatorEgress plugin with no configured hosts still reaches nothing', async () => {
    // It ACTIVATES (it may have useful offline features), but the child's allow-list is the
    // union of its http:outbound:<host> grants and the admin's hosts — both empty here.
    install('gotify', true, ['http:outbound']);
    expect(rt.operatorEgressHosts('gotify')).toEqual([]);
    expect(makeHostAllow([])('gotify.mydomain.com')).toBe(false);
  });

  it('OEG-007 — uninstalling drops the admin’s host consent with the plugin', async () => {
    install('gotify', true);
    await rt.setOperatorEgressHosts('gotify', ['gotify.mydomain.com']);
    await rt.uninstall('gotify', false);
    // A LATER plugin reusing this id must not silently inherit hosts approved for another.
    expect(rt.operatorEgressHosts('gotify')).toEqual([]);
  });
});

describe('settings-page actions (runtime)', () => {
  function declareAction(id: string, key: string) {
    testDb.prepare('INSERT OR REPLACE INTO plugin_actions (plugin_id, action_key, label, hint, danger, sort_order) VALUES (?, ?, ?, NULL, 0, 0)')
      .run(id, key, key);
  }

  it('ACT-001 — actionsOf returns the declared descriptors', () => {
    install('p', false);
    declareAction('p', 'testConnection');
    expect(rt.actionsOf('p')).toEqual([{ key: 'testConnection', label: 'testConnection', hint: undefined, danger: false }]);
  });

  it('ACT-002 — invoking an action the plugin never declared is REFUSED', async () => {
    install('p', false);
    declareAction('p', 'testConnection');
    // The key is caller-supplied (it comes off the URL), so the host must check it
    // against the manifest rather than forwarding whatever it is handed to the child.
    await expect(rt.invokeAction('p', 'somethingElse', 1)).rejects.toThrow(/did not declare action/);
    await expect(rt.invokeAction('p', '__proto__', 1)).rejects.toThrow(/did not declare action/);
  });

  it('ACT-003 — a plugin with no actions can never be invoked', async () => {
    install('p', false);
    await expect(rt.invokeAction('p', 'testConnection', 1)).rejects.toThrow(/did not declare action/);
  });
});

describe('the admin list surfaces operator egress (so the chip can be shown)', () => {
  it('OEG-008 — reports operatorEgress + the host count', async () => {
    const { PluginsService } = await import('../../../src/nest/plugins/plugins.service');
    process.env.TREK_PLUGINS_ENABLED = 'true';
    install('gotify', true);
    install('plain', false);

    const before = new PluginsService().list().plugins;
    expect(before.find(p => p.id === 'gotify')).toMatchObject({ operatorEgress: true, egressHostCount: 0 });
    // A plugin that never asked for it must never invite the admin to add hosts.
    expect(before.find(p => p.id === 'plain')).toMatchObject({ operatorEgress: false, egressHostCount: 0 });

    await rt.setOperatorEgressHosts('gotify', ['a.example.com', 'b.example.com']);
    const after = new PluginsService().list().plugins;
    expect(after.find(p => p.id === 'gotify')!.egressHostCount).toBe(2);
    delete process.env.TREK_PLUGINS_ENABLED;
  });
});
