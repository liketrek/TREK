/**
 * Instance-wide plugin settings (#plugins): the admin-owned counterpart of the
 * per-user settings form. Proves: the field list serves ONLY `scope:'instance'`
 * declarations (in declared order, with the metadata the form renders from), the
 * admin list carries a count so the UI can gate its menu item without a fetch,
 * saving through the controller re-spawns an ACTIVE plugin (config is handed to
 * the child once, in its init envelope), and an inactive plugin is left alone.
 */
import { db as testDb } from '../../../src/db/database';
import { PluginActions } from '../../../src/db/entities/PluginActions.entity';
import { PluginCapabilityAudit } from '../../../src/db/entities/PluginCapabilityAudit.entity';
import { PluginEgressHosts } from '../../../src/db/entities/PluginEgressHosts.entity';
import { PluginErrorLog } from '../../../src/db/entities/PluginErrorLog.entity';
import { PluginSettingsFields } from '../../../src/db/entities/PluginSettingsFields.entity';
import { PluginUserConfig } from '../../../src/db/entities/PluginUserConfig.entity';
import { Plugins } from '../../../src/db/entities/Plugins.entity';
import type { PluginActionsRepository } from '../../../src/db/repositories/PluginActions.repository';
import type { PluginCapabilityAuditRepository } from '../../../src/db/repositories/PluginCapabilityAudit.repository';
import type { PluginEgressHostsRepository } from '../../../src/db/repositories/PluginEgressHosts.repository';
import type { PluginErrorLogRepository } from '../../../src/db/repositories/PluginErrorLog.repository';
import type { PluginSettingsFieldsRepository } from '../../../src/db/repositories/PluginSettingsFields.repository';
import type { PluginUserConfigRepository } from '../../../src/db/repositories/PluginUserConfig.repository';
import type { PluginsRepository } from '../../../src/db/repositories/Plugins.repository';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import type { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { discoverPlugins } from '../../../src/nest/plugins/install/discovery';
import { PluginConsentRequired, type PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';
import { PluginsController } from '../../../src/nest/plugins/plugins.controller';
import { PluginsService } from '../../../src/nest/plugins/plugins.service';
import type { PluginRegistryService } from '../../../src/nest/plugins/registry/registry.service';
import { deleteRows, findRow, insertRow, updateRows, upsertRow } from '../../helpers/factories/rows';
import { createPluginRuntime } from '../../helpers/plugin-host';
import { createTestAddonsService } from '../../helpers/test-addons';
import type { TestOrm } from '../../helpers/test-orm';
import { sharedTestOrm, createTestUnitOfWork } from '../../helpers/test-uow';
import { HttpException } from '@nestjs/common';

import type { Request } from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  return { db, closeDb: () => {}, reinitialize: () => {}, canAccessTrip: async () => null };
});

let orm: TestOrm;

/** Plugins the test has switched to active, read by the stubbed runtime's synchronous isActive. */
const activeIds = new Set<string>();

/** Flips the installed plugin to active and enabled, the way an activation leaves the row. */
async function markActive(id: string) {
  await updateRows(orm, Plugins, { id }, { status: 'active', enabled: 1 });
  activeIds.add(id);
}

async function install(id: string) {
  await upsertRow(orm, Plugins, {
    id,
    name: id,
    status: 'inactive',
    enabled: 0,
    version: '1.0.0',
    permissions: '[]',
    granted_permissions: '[]',
    capabilities: '{}',
    config: '{}',
  });
  activeIds.delete(id);
}

async function declareField(
  pluginId: string,
  key: string,
  scope: 'instance' | 'user',
  opts: { secret?: boolean; required?: boolean; sortOrder?: number; options?: string } = {},
) {
  await insertRow(orm, PluginSettingsFields, {
    plugin_id: pluginId,
    field_key: key,
    label: key,
    input_type: 'text',
    placeholder: null,
    hint: null,
    required: opts.required ? 1 : 0,
    secret: opts.secret ? 1 : 0,
    scope,
    options: opts.options ?? null,
    sort_order: opts.sortOrder ?? 0,
  });
}

function declareActionRow(pluginId: string, key: string, label: string, scope: 'user' | 'instance') {
  return insertRow(orm, PluginActions, {
    plugin_id: pluginId,
    action_key: key,
    label,
    hint: null,
    danger: 0,
    scope,
    sort_order: 0,
  });
}

let addonsService: AddonsService;
// Plan 3j Task 2 — PluginsService's own six repositories, resolved ONCE in `beforeAll`
// (the file's `testDb` is fixed for the whole suite) so `svc()` below can stay a plain
// synchronous factory — every one of its ~20 call sites below chains straight off it.
let pluginsRepo: PluginsRepository;
let pluginEgressHostsRepo: PluginEgressHostsRepository;
let pluginSettingsFieldsRepo: PluginSettingsFieldsRepository;
let pluginActionsRepo: PluginActionsRepository;
let pluginUserConfigRepo: PluginUserConfigRepository;
let pluginErrorLogRepo: PluginErrorLogRepository;
let pluginCapabilityAuditRepo: PluginCapabilityAuditRepository;
const svc = () =>
  new PluginsService(
    addonsService,
    pluginsRepo,
    pluginEgressHostsRepo,
    pluginSettingsFieldsRepo,
    pluginActionsRepo,
    pluginUserConfigRepo,
    pluginErrorLogRepo,
    pluginCapabilityAuditRepo,
  );

/**
 * Installs a real plugin through the manifest -> discovery pipeline (not a direct
 * `declareField` row), so `default`-handling tests exercise `parseSettings`/
 * `parseSettingDefault` in manifest.ts, not just the settingsFields() read path.
 */
let codeRoot: string;
async function installFixturePlugin(opts: { settings: Array<Record<string, unknown>> }) {
  const dir = path.join(codeRoot, 'fixture-id', 'server');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(codeRoot, 'fixture-id', 'trek-plugin.json'),
    JSON.stringify({
      id: 'fixture-id',
      name: 'Fixture',
      version: '1.0.0',
      type: 'integration',
      trek: '>=4.0.0 <5.0.0',
      settings: opts.settings,
    }),
  );
  fs.writeFileSync(path.join(dir, 'index.js'), 'module.exports={}');
  // Plan 3j Task 3: `discoverPlugins` takes a `DiscoveryRepos` bundle now, not a raw
  // connection — the same repositories this file already resolves via `sharedTestOrm`.
  // Plan 4 Task 4: `uow` is no longer optional in that bundle.
  await discoverPlugins({
    plugins: pluginsRepo,
    actions: pluginActionsRepo,
    settingsFields: pluginSettingsFieldsRepo,
    errorLog: pluginErrorLogRepo,
    uow: await createTestUnitOfWork(testDb),
  });
}

beforeAll(async () => {
  addonsService = await createTestAddonsService(testDb);
  orm = await sharedTestOrm(testDb);
  pluginsRepo = orm.repo(Plugins);
  pluginEgressHostsRepo = orm.repo(PluginEgressHosts);
  pluginSettingsFieldsRepo = orm.repo(PluginSettingsFields);
  pluginActionsRepo = orm.repo(PluginActions);
  pluginUserConfigRepo = orm.repo(PluginUserConfig);
  pluginErrorLogRepo = orm.repo(PluginErrorLog);
  pluginCapabilityAuditRepo = orm.repo(PluginCapabilityAudit);
});
beforeEach(async () => {
  await deleteRows(orm, Plugins);
  await deleteRows(orm, PluginSettingsFields);
  activeIds.clear();
  process.env.TREK_PLUGINS_ENABLED = 'true';
  codeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ins-settings-'));
  process.env.TREK_PLUGINS_DIR = codeRoot;
});
afterEach(() => {
  delete process.env.TREK_PLUGINS_DIR;
  fs.rmSync(codeRoot, { recursive: true, force: true });
});

describe('instance settings fields', () => {
  it('INS-001 — lists only the instance-scope fields, in declared order, with form metadata', async () => {
    await install('p');
    await declareField('p', 'apiUrl', 'instance', { required: true, sortOrder: 1 });
    await declareField('p', 'apiKey', 'instance', { secret: true, sortOrder: 0 });
    await declareField('p', 'units', 'user', { sortOrder: 2 }); // must never leak into the admin form

    const fields = await svc().instanceSettingsFields('p');
    expect(fields.map((f) => f.key)).toEqual(['apiKey', 'apiUrl']);
    expect(fields[0]).toMatchObject({ secret: true, required: false, input_type: 'text' });
    expect(fields[1]).toMatchObject({ secret: false, required: true });
  });

  it('INS-002 — parses select options like the user form does', async () => {
    await install('p');
    await declareField('p', 'mode', 'instance', { options: '["fast","slow"]' });
    expect((await svc().instanceSettingsFields('p'))[0].options).toEqual(['fast', 'slow']);
  });

  it('INS-003 — the admin list carries the instance-field count (gates the menu item)', async () => {
    await install('with-fields');
    await install('plain');
    await declareField('with-fields', 'apiKey', 'instance', { secret: true });
    await declareField('with-fields', 'apiUrl', 'instance');
    await declareField('with-fields', 'units', 'user'); // user fields must not count

    const plugins = (await svc().list()).plugins;
    expect(plugins.find((p) => p.id === 'with-fields')).toMatchObject({ instanceSettingsCount: 2 });
    expect(plugins.find((p) => p.id === 'plain')).toMatchObject({ instanceSettingsCount: 0 });
  });

  it('INS-004 — the admin list carries the instance-action count (gates the menu item even with no settings fields)', async () => {
    await install('with-action');
    await install('plain');
    await declareActionRow('with-action', 'purge', 'Purge', 'instance');
    await declareActionRow('with-action', 'notify', 'Notify', 'user'); // user-scope actions must not count

    const plugins = (await svc().list()).plugins;
    expect(plugins.find((p) => p.id === 'with-action')).toMatchObject({
      instanceSettingsCount: 0,
      instanceActionsCount: 1,
    });
    expect(plugins.find((p) => p.id === 'plain')).toMatchObject({ instanceSettingsCount: 0, instanceActionsCount: 0 });
    await deleteRows(orm, PluginActions, { plugin_id: 'with-action' });
  });

  it('INS-010 — persists a settings-field default and serves it on the fields list', async () => {
    await installFixturePlugin({
      settings: [{ key: 'oauth_authorize_url', required: true, default: 'https://auth.openbnb.org/authorize' }],
    });
    const fields = await svc().instanceSettingsFields('fixture-id');
    expect(fields[0].default).toBe('https://auth.openbnb.org/authorize');
  });

  it('INS-013 — drops a default the field cannot take: non-boolean on a checkbox, or not one of the select options', async () => {
    await installFixturePlugin({
      settings: [
        { key: 'on', input_type: 'checkbox', default: 'true' },
        { key: 'mode', input_type: 'select', options: ['fast', 'slow'], default: 'warp' },
        { key: 'mode_ok', input_type: 'select', options: [{ value: 'a', label: 'A' }], default: 'a' },
        { key: 'on_ok', input_type: 'checkbox', default: true },
      ],
    });
    const byKey = Object.fromEntries((await svc().instanceSettingsFields('fixture-id')).map((f) => [f.key, f.default]));
    expect(byKey).toEqual({ on: undefined, mode: undefined, mode_ok: 'a', on_ok: true });
  });

  it('INS-011 — drops a default on a secret field at parse time', async () => {
    await installFixturePlugin({ settings: [{ key: 'token', secret: true, default: 'leak' }] });
    expect((await svc().instanceSettingsFields('fixture-id'))[0].default).toBeUndefined();
  });
});

describe('required settings are enforced on save', () => {
  it('refuses a save that leaves a required instance field empty', async () => {
    await installFixturePlugin({ settings: [{ key: 'client_id', required: true }] });
    await expect(svc().updateInstanceConfig('fixture-id', { client_id: '   ' })).rejects.toThrow(
      /Missing required setting "client_id"/,
    );
  });

  it('accepts a partial patch when the required field is already stored', async () => {
    await installFixturePlugin({
      settings: [
        { key: 'client_id', required: true },
        { key: 'note', required: false },
      ],
    });
    const s = svc();
    await s.updateInstanceConfig('fixture-id', { client_id: 'abc' });
    await expect(s.updateInstanceConfig('fixture-id', { note: 'hi' })).resolves.toBeDefined();
  });

  it('accepts a user-scope partial patch when the required user field is already stored', async () => {
    await installFixturePlugin({
      settings: [
        { key: 'api_key', scope: 'user', required: true },
        { key: 'units', scope: 'user' },
      ],
    });
    const s = svc();
    await s.updateUserConfig('fixture-id', 1, { api_key: 'sk-1' });
    await expect(s.updateUserConfig('fixture-id', 1, { units: 'metric' })).resolves.toBeDefined();
  });

  it('refuses a user-settings save that leaves a required user field empty', async () => {
    await installFixturePlugin({ settings: [{ key: 'api_key', scope: 'user', required: true }] });
    await expect(svc().updateUserConfig('fixture-id', 1, { api_key: '' })).rejects.toThrow(
      /Missing required setting "api_key"/,
    );
  });

  it('exempts checkbox fields from required enforcement (consent, not a settings field)', async () => {
    await installFixturePlugin({
      settings: [
        { key: 'accept_terms', input_type: 'checkbox', required: true },
        { key: 'note', required: false },
      ],
    });
    // accept_terms is left entirely unset (never patched, nothing stored) — a
    // non-checkbox required field in this state would throw.
    await expect(svc().updateInstanceConfig('fixture-id', { note: 'hi' })).resolves.toBeDefined();
  });

  it('a required field with a manifest default is satisfied by the default', async () => {
    await installFixturePlugin({
      settings: [
        { key: 'region', required: true, default: 'eu' },
        { key: 'note', required: false },
      ],
    });
    // region is never patched and nothing is stored — the runtime will see the default,
    // so refusing the save here would contradict what the child actually gets.
    await expect(svc().updateInstanceConfig('fixture-id', { note: 'hi' })).resolves.toBeDefined();
  });

  it('a stored secret (non-empty ciphertext) counts as filled on a later partial patch', async () => {
    await installFixturePlugin({
      settings: [
        { key: 'api_key', secret: true, required: true },
        { key: 'note', required: false },
      ],
    });
    const s = svc();
    await s.updateInstanceConfig('fixture-id', { api_key: 'sk-real' });
    await expect(s.updateInstanceConfig('fixture-id', { api_key: '••••••••', note: 'hi' })).resolves.toBeDefined();
  });
});

describe('respawn on save (runtime)', () => {
  it('INS-004 — an inactive plugin is left alone (no respawn, reports false)', async () => {
    await install('p');
    const rt = await createPluginRuntime(testDb);
    await expect(rt.respawnIfActive('p')).resolves.toBe(false);
  });

  it('INS-005 — an active plugin is stopped and re-activated so the child re-reads config', async () => {
    await install('p');
    const rt = await createPluginRuntime(testDb);
    const calls: string[] = [];
    vi.spyOn(rt, 'isActive').mockReturnValue(true);
    vi.spyOn(rt, 'activate').mockImplementation(async () => {
      calls.push('activate');
    });
    const sup = (rt as unknown as { supervisor: { disable: (id: string) => Promise<void> } }).supervisor;
    vi.spyOn(sup, 'disable').mockImplementation(async () => {
      calls.push('disable');
    });

    await expect(rt.respawnIfActive('p')).resolves.toBe(true);
    expect(calls).toEqual(['disable', 'activate']); // stop first, then bring back up
  });
});

describe('admin config endpoints (controller)', () => {
  const controllerWith = (runtime: Partial<PluginRuntimeService>) =>
    new PluginsController(
      svc(),
      runtime as PluginRuntimeService,
      {} as PluginRegistryService,
      { isManaged: () => false } as unknown as RuntimeEnvService,
    );

  it('INS-006 — GET :id/config returns the fields alongside the (masked) values', async () => {
    await install('p');
    await declareField('p', 'apiUrl', 'instance');
    await updateRows(orm, Plugins, { id: 'p' }, { config: '{"apiUrl":"https://x.example"}' });

    const out = await controllerWith({ actionsOf: async () => [] }).getConfig('p');
    expect(out.config).toEqual({ apiUrl: 'https://x.example' });
    expect(out.fields.map((f: Record<string, unknown>) => f.key)).toEqual(['apiUrl']);
  });

  it('INS-007 — PUT :id/config saves, respawns an active plugin, and reports it', async () => {
    await install('p');
    await declareField('p', 'apiUrl', 'instance');
    const respawnIfActive = vi.fn(async () => true);

    const out = await controllerWith({ respawnIfActive }).updateConfig('p', { apiUrl: 'https://y.example' });
    expect(out.config).toEqual({ apiUrl: 'https://y.example' });
    expect(out.restarted).toBe(true);
    expect(respawnIfActive).toHaveBeenCalledWith('p');
  });

  it('INS-008 — PUT :id/config on an inactive plugin saves without a restart', async () => {
    await install('p');
    await declareField('p', 'apiUrl', 'instance');
    const respawnIfActive = vi.fn(async () => false);

    const out = await controllerWith({ respawnIfActive }).updateConfig('p', { apiUrl: 'https://y.example' });
    expect(out.restarted).toBe(false);
  });

  it('INS-009 — PUT :id/config with no body is an empty patch, not a crash', async () => {
    await install('p');
    await declareField('p', 'apiUrl', 'instance');
    const respawnIfActive = vi.fn(async () => false);

    const out = await controllerWith({ respawnIfActive }).updateConfig('p', undefined as never);
    expect(out.config).toEqual({});
    expect(out.restarted).toBe(false);
  });

  it('INS-010: with the kill switch off the save is refused before anything is written', async () => {
    await install('p');
    await declareField('p', 'apiUrl', 'instance');
    process.env.TREK_PLUGINS_ENABLED = 'false';
    const respawnIfActive = vi.fn(async () => false);

    const failed = await controllerWith({ respawnIfActive })
      .updateConfig('p', { apiUrl: 'https://y.example' })
      .then(
        () => null,
        (e: unknown) => e as HttpException,
      );

    expect(failed?.getStatus()).toBe(503);
    // The respawn is a spawn: it must not run while the whole plugin system is off.
    expect(respawnIfActive).not.toHaveBeenCalled();
    expect(await svc().getInstanceConfig('p')).toEqual({});
  });

  it('INS-011: a respawn that fails reports the save that DID happen, and stops claiming the plugin runs', async () => {
    await install('p');
    await declareField('p', 'apiUrl', 'instance');
    const deactivate = vi.fn(async () => {});
    const respawnIfActive = vi.fn(async () => {
      throw new PluginConsentRequired('plugin p requires consent for db:read:trips', ['db:read:trips']);
    });

    const failed = await controllerWith({ respawnIfActive, deactivate })
      .updateConfig('p', { apiUrl: 'https://y.example' })
      .then(
        () => null,
        (e: unknown) => e as HttpException,
      );

    expect(failed?.getStatus()).toBe(409);
    // The envelope carries the saved config and names the restart as the part that broke:
    // the message must not read as "your settings were lost", because they were not.
    expect(failed?.getResponse()).toMatchObject({
      code: 'RESTART_FAILED',
      config: { apiUrl: 'https://y.example' },
      error: expect.stringMatching(/Settings saved.*db:read:trips/),
    });
    expect(await svc().getInstanceConfig('p')).toEqual({ apiUrl: 'https://y.example' });
    // disable() leaves the row enabled, so the admin list would keep showing a plugin
    // that no longer has a child. The enable toggle is where the reason is offered.
    expect(deactivate).toHaveBeenCalledWith('p');
  });
});

describe('defaults reach the child at spawn', () => {
  it('INS-012 — an unset instance field is handed to the child as its manifest default; a stored value wins', async () => {
    await installFixturePlugin({
      settings: [
        { key: 'api_url', default: 'https://api.example' },
        { key: 'retries', input_type: 'number', default: 3 },
        { key: 'note' },
      ],
    });
    const s = svc();
    await s.updateInstanceConfig('fixture-id', { api_url: 'https://mine.example' });

    const rt = await createPluginRuntime(testDb);
    const sup = (rt as unknown as { supervisor: { activate: (...a: unknown[]) => Promise<void> } }).supervisor;
    const activate = vi.spyOn(sup, 'activate').mockResolvedValue(undefined);

    await rt.activate('fixture-id');

    expect(activate).toHaveBeenCalledTimes(1);
    const config = activate.mock.calls[0][2] as Record<string, unknown>;
    expect(config).toEqual({ api_url: 'https://mine.example', retries: 3 }); // note: no default, no value → absent
  });
});

describe('plugin_actions.scope migration', () => {
  it('MIG-ACT-001 — the column exists on a migrated DB and defaults to user', async () => {
    // test-sql-allow: the column list comes from PRAGMA table_info, which no entity or repository maps.
    const cols = testDb.prepare("SELECT name FROM pragma_table_info('plugin_actions')").all() as Array<{
      name: string;
    }>;
    expect(cols.some((c) => c.name === 'scope')).toBe(true);
    await insertRow(orm, PluginActions, {
      plugin_id: 'm',
      action_key: 'k',
      label: 'K',
      hint: null,
      danger: 0,
      sort_order: 0,
    });
    expect((await findRow(orm, PluginActions, { plugin_id: 'm' }))!.scope).toBe('user');
    await deleteRows(orm, PluginActions, { plugin_id: 'm' });
  });
});

describe('instance-scope actions (admin)', () => {
  function declareAction(pluginId: string, key: string, scope: 'user' | 'instance') {
    return declareActionRow(pluginId, key, key, scope);
  }
  const adminReq = { user: { id: 42 } } as unknown as Request;
  async function controller(invoke = vi.fn(async () => ({ ok: true, message: 'pong' }))) {
    const rt = await createPluginRuntime(testDb);
    // isActive normally reflects the supervisor's live child map, which nothing here
    // spawns — so it's stubbed to follow the status the test itself flips
    // (markActive), mirroring what an actually-activated plugin would report.
    const isActive = (id: string) => activeIds.has(id);
    const runtime = Object.assign(rt, { invokeAction: invoke, isActive }) as unknown as PluginRuntimeService;
    const c = new PluginsController(
      svc(),
      runtime,
      {} as unknown as PluginRegistryService,
      { isManaged: () => false } as unknown as RuntimeEnvService,
    );
    return { c, invoke };
  }

  beforeEach(async () => {
    await deleteRows(orm, PluginActions);
  });

  it('ACT-ADM-001 — GET config lists the instance actions and none of the user ones', async () => {
    await install('p');
    await declareAction('p', 'purge', 'instance');
    await declareAction('p', 'testConnection', 'user');
    const { c } = await controller();
    expect((await c.getConfig('p')).actions).toEqual([
      { key: 'purge', label: 'purge', hint: undefined, danger: false, scope: 'instance' },
    ]);
  });

  it('ACT-ADM-002 — POST runs the action as the clicking admin in the instance scope', async () => {
    await install('p');
    await markActive('p');
    const { c, invoke } = await controller();
    expect(await c.runAction('p', 'purge', adminReq)).toEqual({ ok: true, message: 'pong' });
    expect(invoke).toHaveBeenCalledWith('p', 'purge', 42, 'instance');
  });

  it('ACT-ADM-003 — an inactive plugin answers 404 like the user route', async () => {
    await install('p');
    const { c, invoke } = await controller();
    await expect(c.runAction('p', 'purge', adminReq)).rejects.toMatchObject({
      status: 404,
      response: { error: 'Plugin is not active' },
    });
    expect(invoke).not.toHaveBeenCalled();
  });

  it('ACT-ADM-004 — a refused key is a failed RESULT, not a server error', async () => {
    await install('p');
    await markActive('p');
    const { c } = await controller(
      vi.fn(async () => {
        throw new Error('plugin p did not declare action "x" in scope instance');
      }),
    );
    expect(await c.runAction('p', 'x', adminReq)).toEqual({
      ok: false,
      message: 'plugin p did not declare action "x" in scope instance',
    });
  });
});
