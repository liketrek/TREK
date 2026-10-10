/**
 * Plugin discovery (#plugins, M4, install-from-disk): scans the volume, upserts
 * rows as inactive, refreshes settings fields, keeps an existing plugin's status,
 * and skips invalid or native-carrying plugins (logging the reason).
 *
 * Plan 3j Task 3 — converted onto `PluginsRepository`/`PluginActionsRepository`/
 * `PluginSettingsFieldsRepository`/`PluginErrorLogRepository` (a `DiscoveryRepos`
 * bundle), via a real MikroORM over the full migrated schema (`createSnapshotTestDb`
 * + `createTestOrm`) rather than a hand-rolled `:memory:` table set.
 */
import { PluginActions } from '../../../src/db/entities/PluginActions.entity';
import { PluginErrorLog } from '../../../src/db/entities/PluginErrorLog.entity';
import { PluginSettingsFields } from '../../../src/db/entities/PluginSettingsFields.entity';
import { Plugins } from '../../../src/db/entities/Plugins.entity';
import { UnitOfWork } from '../../../src/nest/database/unit-of-work';
import { discoverPlugins, type DiscoveryRepos } from '../../../src/nest/plugins/install/discovery';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { countRows, findRow, findRows, insertRow } from '../../helpers/factories/rows';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repos: DiscoveryRepos;
let codeRoot: string;

function writePlugin(id: string, manifest: Record<string, unknown>, extra?: () => void) {
  const dir = path.join(codeRoot, id, 'server');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(codeRoot, id, 'trek-plugin.json'),
    JSON.stringify({ id, name: id, version: '1.0.0', type: 'integration', ...manifest }),
  );
  fs.writeFileSync(path.join(dir, 'index.js'), 'module.exports={}');
  extra?.();
}

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repos = {
    plugins: t.repo(Plugins),
    actions: t.repo(PluginActions),
    settingsFields: t.repo(PluginSettingsFields),
    errorLog: t.repo(PluginErrorLog),
    uow: new UnitOfWork(t.em),
  };
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
  codeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'disc-'));
  process.env.TREK_PLUGINS_DIR = codeRoot;
});
afterEach(() => {
  delete process.env.TREK_PLUGINS_DIR;
  fs.rmSync(codeRoot, { recursive: true, force: true });
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('discoverPlugins', () => {
  it('registers a new plugin inactive with its settings fields', async () => {
    writePlugin('flight-tracker', {
      name: 'Flight',
      type: 'widget',
      permissions: ['db:own'],
      settings: [
        { key: 'api_key', input_type: 'password', scope: 'instance', secret: true },
        { key: 'units', input_type: 'select', scope: 'user', options: [{ value: 'm', label: 'Metric' }] },
        { key: 'oauth', input_type: 'oauth', scope: 'user', oauth: { initPath: '/o/start', callbackPath: '/o/cb' } },
      ],
    });
    const res = await discoverPlugins(repos);
    expect(res.discovered).toEqual(['flight-tracker']);

    const row = await findRow(t, Plugins, { id: 'flight-tracker' });
    expect(row?.status).toBe('inactive');
    expect(row?.type).toBe('widget');
    expect(JSON.parse(String(row?.permissions))).toEqual(['db:own']);

    const field = await findRow(t, PluginSettingsFields, { plugin_id: 'flight-tracker' });
    expect(field).toMatchObject({ field_key: 'api_key', secret: 1 });
  });

  it('persists each action with its scope', async () => {
    writePlugin('acts', {
      name: 'Acts',
      type: 'integration',
      permissions: [],
      actions: [
        { key: 'ping', label: 'Ping' },
        { key: 'purge', label: 'Purge', scope: 'instance', danger: true },
      ],
    });
    await discoverPlugins(repos);
    const rows = (await findRows(t, PluginActions, { plugin_id: 'acts' }, { sort_order: 'asc' })).map((r) => ({
      action_key: r.action_key,
      scope: r.scope,
      danger: r.danger,
    }));
    expect(rows).toEqual([
      { action_key: 'ping', scope: 'user', danger: 0 },
      { action_key: 'purge', scope: 'instance', danger: 1 },
    ]);
  });

  it('keeps an existing plugin status + granted permissions on re-discovery', async () => {
    await insertRow(t, Plugins, {
      id: 'keep',
      name: 'Keep',
      type: 'page',
      status: 'active',
      granted_permissions: '["db:own"]',
    });
    writePlugin('keep', { name: 'Keep v2', type: 'page', version: '2.0.0' });
    await discoverPlugins(repos);
    const row = await findRow(t, Plugins, { id: 'keep' });
    expect(row?.status).toBe('active'); // not downgraded
    expect(row?.version).toBe('2.0.0'); // metadata refreshed
    expect(JSON.parse(String(row?.granted_permissions))).toEqual(['db:own']); // grants preserved
  });

  it('tolerates a UTF-8 BOM in trek-plugin.json (Windows-authored plugins)', async () => {
    writePlugin('bom-plug', { type: 'integration' });
    const mp = path.join(codeRoot, 'bom-plug', 'trek-plugin.json');
    fs.writeFileSync(mp, '﻿' + fs.readFileSync(mp, 'utf8'));
    expect((await discoverPlugins(repos)).discovered).toEqual(['bom-plug']);
  });

  it('skips an invalid manifest and logs the reason', async () => {
    writePlugin('bad', { type: 'not-a-type' });
    const res = await discoverPlugins(repos);
    expect(res.skipped).toEqual(['bad']);
    expect(await countRows(t, Plugins, { id: 'bad' })).toBe(0);
    expect((await findRow(t, PluginErrorLog, { plugin_id: 'bad' }))?.message).toContain('discovery');
  });

  it('skips a plugin that ships native binaries', async () => {
    writePlugin('native', { type: 'integration' }, () => {
      fs.writeFileSync(path.join(codeRoot, 'native', 'server', 'addon.node'), '\0');
    });
    expect((await discoverPlugins(repos)).skipped).toEqual(['native']);
  });

  it('follows a symlinked dev-link plugin only when dev-link mode is on', async () => {
    const srcRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'disc-src-'));
    const prev = process.env.TREK_PLUGINS_DEV_LINK;
    try {
      const src = path.join(srcRoot, 'linked');
      fs.mkdirSync(path.join(src, 'server'), { recursive: true });
      fs.writeFileSync(
        path.join(src, 'trek-plugin.json'),
        JSON.stringify({
          id: 'linked',
          name: 'Linked',
          version: '1.0.0',
          type: 'integration',
          permissions: ['db:own'],
        }),
      );
      fs.writeFileSync(path.join(src, 'server', 'index.js'), 'module.exports={}');
      fs.symlinkSync(src, path.join(codeRoot, 'linked'), 'junction'); // junction on Windows, symlink on POSIX

      // Off (default): a stale dev-link symlink is not discovered or registered.
      delete process.env.TREK_PLUGINS_DEV_LINK;
      expect((await discoverPlugins(repos)).discovered).toEqual([]);
      expect(await findRow(t, Plugins, { id: 'linked' })).toBeNull();

      // On: the dev-link is followed and registered inactive.
      process.env.TREK_PLUGINS_DEV_LINK = '1';
      expect((await discoverPlugins(repos)).discovered).toEqual(['linked']);
      expect(await findRow(t, Plugins, { id: 'linked' })).toMatchObject({ status: 'inactive' });
    } finally {
      if (prev === undefined) delete process.env.TREK_PLUGINS_DEV_LINK;
      else process.env.TREK_PLUGINS_DEV_LINK = prev;
      fs.rmSync(srcRoot, { recursive: true, force: true });
    }
  });

  it('is a no-op when the plugins dir is absent', async () => {
    process.env.TREK_PLUGINS_DIR = path.join(codeRoot, 'does-not-exist');
    expect(await discoverPlugins(repos)).toEqual({ discovered: [], skipped: [] });
  });

  describe('the TREK range', () => {
    it('persists the range and its lower bound', async () => {
      writePlugin('ranged', { trek: '>=3.2.0 <4.0.0' });
      await discoverPlugins(repos);
      expect(await findRow(t, Plugins, { id: 'ranged' })).toMatchObject({
        trek_range: '>=3.2.0 <4.0.0',
        min_trek_version: '3.2.0',
      });
    });

    it('still registers a plugin that declares NO range — it must not vanish', async () => {
      // Discovery is a reconciler, not a gate: it only logs and skips on a throw and never
      // touches the plugins row, so refusing here would leave an existing plugin's stale
      // enabled=1 row to be spawned by the next boot — invisible AND running. The row is
      // registered with a null range and the activation gate refuses it (TREK_VERSION_UNKNOWN).
      writePlugin('rangeless', {});
      expect((await discoverPlugins(repos)).discovered).toEqual(['rangeless']);
      expect(await findRow(t, Plugins, { id: 'rangeless' })).toMatchObject({ trek_range: null });
    });

    it('refreshes the range on re-discovery, so a plugin that narrowed its support is caught', async () => {
      writePlugin('shrink', { trek: '>=3.0.0' });
      await discoverPlugins(repos);
      writePlugin('shrink', { trek: '>=3.0.0 <3.1.0' });
      await discoverPlugins(repos);
      expect(await findRow(t, Plugins, { id: 'shrink' })).toMatchObject({ trek_range: '>=3.0.0 <3.1.0' });
    });
  });
});
