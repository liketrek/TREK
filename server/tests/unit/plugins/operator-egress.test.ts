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
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  return { db, closeDb: () => {}, reinitialize: () => {}, canAccessTrip: async () => null };
});
import { db as testDb } from '../../../src/db/database';

import { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';
import { createPluginRuntime } from '../../helpers/plugin-host';
import { parseManifest, ManifestError } from '../../../src/nest/plugins/install/manifest';
import { makeHostAllow } from '../../../src/nest/plugins/runtime/egress-policy';
import { createTestAddonsService } from '../../helpers/test-addons';
import { sharedTestOrm } from '../../helpers/test-uow';
import { deleteRows, upsertRow } from '../../helpers/factories/rows';
import { Plugins } from '../../../src/db/entities/Plugins.entity';
import { PluginErrorLog } from '../../../src/db/entities/PluginErrorLog.entity';
import { PluginEgressHosts } from '../../../src/db/entities/PluginEgressHosts.entity';
import { PluginSettingsFields } from '../../../src/db/entities/PluginSettingsFields.entity';
import { PluginActions } from '../../../src/db/entities/PluginActions.entity';
import { PluginUserConfig } from '../../../src/db/entities/PluginUserConfig.entity';
import { PluginCapabilityAudit } from '../../../src/db/entities/PluginCapabilityAudit.entity';

async function install(id: string, operatorEgress: boolean, perms: string[] = ['http:outbound:gotify.net']) {
  await upsertRow(await sharedTestOrm(testDb), Plugins, {
    id,
    name: id,
    status: 'inactive',
    enabled: 0,
    version: '1.0.0',
    permissions: JSON.stringify(perms),
    granted_permissions: JSON.stringify(perms),
    capabilities: '{}',
    config: '{}',
    operator_egress: operatorEgress ? 1 : 0,
  });
}

let rt: PluginRuntimeService;

beforeEach(async () => {
  const orm = await sharedTestOrm(testDb);
  await deleteRows(orm, Plugins);
  await deleteRows(orm, PluginEgressHosts);
  await deleteRows(orm, PluginActions);
  rt = await createPluginRuntime(testDb);
});

describe('operator-supplied egress hosts', () => {
  it('OEG-001 — an admin can add hosts to a plugin that declared operatorEgress', async () => {
    await install('gotify', true);
    expect(await rt.wantsOperatorEgress('gotify')).toBe(true);
    expect(await rt.setOperatorEgressHosts('gotify', ['gotify.mydomain.com'])).toEqual(['gotify.mydomain.com']);
    expect(await rt.operatorEgressHosts('gotify')).toEqual(['gotify.mydomain.com']);
  });

  it('OEG-002 — a plugin that did NOT declare it can never have hosts added', async () => {
    await install('sneaky', false);
    expect(await rt.wantsOperatorEgress('sneaky')).toBe(false);
    // This is the load-bearing check: without it an admin could silently widen egress for
    // ANY plugin, and the install-time consent would stop bounding what's possible.
    await expect(rt.setOperatorEgressHosts('sneaky', ['evil.example.com'])).rejects.toThrow(/did not declare operatorEgress/);
    expect(await rt.operatorEgressHosts('sneaky')).toEqual([]);
  });

  it('OEG-003 — hosts are validated exactly like manifest egress', async () => {
    await install('gotify', true);
    for (const bad of ['*', '*.com', 'https://gotify.example.com', 'has space', 'a/b']) {
      await expect(rt.setOperatorEgressHosts('gotify', [bad])).rejects.toThrow(/invalid host/);
    }
    // A legitimate wildcard with a real multi-label suffix is fine.
    expect(await rt.setOperatorEgressHosts('gotify', ['*.mydomain.com'])).toEqual(['*.mydomain.com']);
  });

  it('OEG-004 — hosts are normalized and de-duplicated', async () => {
    await install('gotify', true);
    expect(await rt.setOperatorEgressHosts('gotify', ['Gotify.MyDomain.com', 'gotify.mydomain.com.', ' ', ''])).toEqual([
      'gotify.mydomain.com',
    ]);
  });

  it('OEG-005 — setting the list replaces it (a removed host is really gone)', async () => {
    await install('gotify', true);
    await rt.setOperatorEgressHosts('gotify', ['a.example.com', 'b.example.com']);
    await rt.setOperatorEgressHosts('gotify', ['b.example.com']);
    expect(await rt.operatorEgressHosts('gotify')).toEqual(['b.example.com']);
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
    await install('gotify', true, ['http:outbound']);
    expect(await rt.operatorEgressHosts('gotify')).toEqual([]);
    expect(makeHostAllow([])('gotify.mydomain.com')).toBe(false);
  });

  it('OEG-007 — uninstalling drops the admin’s host consent with the plugin', async () => {
    await install('gotify', true);
    await rt.setOperatorEgressHosts('gotify', ['gotify.mydomain.com']);
    await rt.uninstall('gotify', false);
    // A LATER plugin reusing this id must not silently inherit hosts approved for another.
    expect(await rt.operatorEgressHosts('gotify')).toEqual([]);
  });
});

describe('settings-page actions (runtime)', () => {
  async function declareAction(id: string, key: string, scope: 'user' | 'instance' = 'user') {
    await upsertRow(await sharedTestOrm(testDb), PluginActions, {
      plugin_id: id, action_key: key, label: key, hint: null, danger: 0, scope, sort_order: 0,
    });
  }

  it('ACT-001 — actionsOf returns the declared descriptors of ONE scope', async () => {
    await install('p', false);
    await declareAction('p', 'testConnection');
    await declareAction('p', 'purge', 'instance');
    expect(await rt.actionsOf('p', 'user')).toEqual([{ key: 'testConnection', label: 'testConnection', hint: undefined, danger: false, scope: 'user' }]);
    expect(await rt.actionsOf('p', 'instance')).toEqual([{ key: 'purge', label: 'purge', hint: undefined, danger: false, scope: 'instance' }]);
  });

  it('ACT-002 — invoking an action the plugin never declared is REFUSED', async () => {
    await install('p', false);
    await declareAction('p', 'testConnection');
    // The key is caller-supplied (it comes off the URL), so the host must check it
    // against the manifest rather than forwarding whatever it is handed to the child.
    await expect(rt.invokeAction('p', 'somethingElse', 1, 'user')).rejects.toThrow(/did not declare action/);
    await expect(rt.invokeAction('p', '__proto__', 1, 'user')).rejects.toThrow(/did not declare action/);
  });

  it('ACT-003 — a plugin with no actions can never be invoked', async () => {
    await install('p', false);
    await expect(rt.invokeAction('p', 'testConnection', 1, 'user')).rejects.toThrow(/did not declare action/);
  });

  it('ACT-004 — a key declared in the OTHER scope is refused (the user route cannot fire an admin button)', async () => {
    await install('p', false);
    await declareAction('p', 'purge', 'instance');
    await declareAction('p', 'testConnection', 'user');
    await expect(rt.invokeAction('p', 'purge', 1, 'user')).rejects.toThrow(/did not declare action "purge" in scope user/);
    await expect(rt.invokeAction('p', 'testConnection', 1, 'instance')).rejects.toThrow(/did not declare action "testConnection" in scope instance/);
  });
});

describe('the admin list surfaces operator egress (so the chip can be shown)', () => {
  it('OEG-008 — reports operatorEgress + the host count', async () => {
    const { PluginsService } = await import('../../../src/nest/plugins/plugins.service');
    process.env.TREK_PLUGINS_ENABLED = 'true';
    await install('gotify', true);
    await install('plain', false);

    // list() resolves required-addon dependencies through AddonsService, so it gets a real
    // one over the same DB. These fixtures declare no dependencies, so it is never consulted.
    const listPlugins = async () => {
      const orm = await sharedTestOrm(testDb);
      const service = new PluginsService(
        await createTestAddonsService(testDb),
        orm.repo(Plugins),
        orm.repo(PluginEgressHosts),
        orm.repo(PluginSettingsFields),
        orm.repo(PluginActions),
        orm.repo(PluginUserConfig),
        orm.repo(PluginErrorLog),
        orm.repo(PluginCapabilityAudit),
      );
      return (await service.list()).plugins;
    };

    const before = await listPlugins();
    expect(before.find(p => p.id === 'gotify')).toMatchObject({ operatorEgress: true, egressHostCount: 0 });
    // A plugin that never asked for it must never invite the admin to add hosts.
    expect(before.find(p => p.id === 'plain')).toMatchObject({ operatorEgress: false, egressHostCount: 0 });

    await rt.setOperatorEgressHosts('gotify', ['a.example.com', 'b.example.com']);
    const after = await listPlugins();
    expect(after.find(p => p.id === 'gotify')!.egressHostCount).toBe(2);
    delete process.env.TREK_PLUGINS_ENABLED;
  });
});
