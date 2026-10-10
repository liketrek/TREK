/**
 * The read-side plugin service + controller (#plugins, M0). Lists installed
 * plugins and reports whether the runtime is enabled (TREK_PLUGINS_ENABLED).
 */
import { db as testDb } from '../../../src/db/database';
import { PluginActions } from '../../../src/db/entities/PluginActions.entity';
import { PluginCapabilityAudit } from '../../../src/db/entities/PluginCapabilityAudit.entity';
import { PluginEgressHosts } from '../../../src/db/entities/PluginEgressHosts.entity';
import { PluginErrorLog } from '../../../src/db/entities/PluginErrorLog.entity';
import { PluginSettingsFields } from '../../../src/db/entities/PluginSettingsFields.entity';
import { PluginUserConfig } from '../../../src/db/entities/PluginUserConfig.entity';
import { Plugins } from '../../../src/db/entities/Plugins.entity';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import type { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { PluginsFeedController } from '../../../src/nest/plugins/plugins-feed.controller';
import { PluginsController } from '../../../src/nest/plugins/plugins.controller';
import { PluginsService } from '../../../src/nest/plugins/plugins.service';
import { deleteRows, findRow, insertRow, updateRows } from '../../helpers/factories/rows';
import { createTestAddonsService } from '../../helpers/test-addons';
import type { TestOrm } from '../../helpers/test-orm';
import { sharedTestOrm } from '../../helpers/test-uow';

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  return { db };
});

// AddonsService only feeds PluginsService.list()'s required-addon-dependency
// resolution; none of the fixtures below declare any, so it is built once
// (over the same connection) rather than reconstructed at every call site.
let addonsService: AddonsService;
let orm: TestOrm;
beforeAll(async () => {
  addonsService = await createTestAddonsService(testDb);
  orm = await sharedTestOrm(testDb);
});

/** The plugin's stored instance config, parsed. */
async function storedConfig(id: string): Promise<Record<string, unknown>> {
  return JSON.parse((await findRow(orm, Plugins, { id }))!.config ?? '');
}

/**
 * Plan 3j Task 2 — PluginsService's own repository-backed constructor. One
 * factory, reused by every call site below (`sharedTestOrm` memoises the ORM
 * per connection, so this is cheap): the six PS1-PS13 repositories, resolved
 * over the SAME `testDb` handle every raw-SQL fixture line above writes to.
 */
async function makeService(): Promise<PluginsService> {
  const orm = await sharedTestOrm(testDb);
  return new PluginsService(
    addonsService,
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
 * PFC1 (Plan 3j Task 5) — PluginsFeedController's own feed read, now
 * Plugins.repository.ts#findActiveFeedRows, resolved over the SAME `testDb`
 * handle every raw-SQL fixture line above writes to (same `sharedTestOrm`
 * reasoning as `makeService` above).
 */
async function makeFeedController(): Promise<PluginsFeedController> {
  const orm = await sharedTestOrm(testDb);
  return new PluginsFeedController(orm.repo(Plugins));
}

beforeEach(async () => {
  await deleteRows(orm, Plugins);
  await deleteRows(orm, PluginSettingsFields);
  delete process.env.TREK_PLUGINS_ENABLED;
});
afterEach(() => {
  delete process.env.TREK_PLUGINS_ENABLED;
});

describe('PluginsService.list', () => {
  it('returns the installed plugins and the runtime-enabled flag', async () => {
    await insertRow(orm, Plugins, {
      id: 'flight',
      name: 'Flight',
      description: 'desc',
      type: 'widget',
      status: 'inactive',
      version: '1.0.0',
    });
    process.env.TREK_PLUGINS_ENABLED = 'true';

    const out = await (await makeService()).list();
    expect(out.enabled).toBe(true);
    expect(out.plugins).toHaveLength(1);
    expect(out.plugins[0]).toMatchObject({ id: 'flight', name: 'Flight', status: 'inactive' });
  });

  describe('TREK-range bypass', () => {
    const APP_VERSION = process.env.APP_VERSION;
    afterEach(() => {
      delete process.env.TREK_PLUGINS_IGNORE_TREK_RANGE;
      if (APP_VERSION === undefined) delete process.env.APP_VERSION;
      else process.env.APP_VERSION = APP_VERSION;
    });
    const seed = () =>
      insertRow(orm, Plugins, {
        id: 'old',
        name: 'Old',
        type: 'widget',
        status: 'inactive',
        version: '1.0.0',
        trek_range: '>=3.0.0 <4.0.0',
      });

    it('reports the switch off and an outgrown plugin as hostIncompatible by default', async () => {
      process.env.APP_VERSION = '4.1.0';
      await seed();
      const out = await (await makeService()).list();
      expect(out.ignoreTrekRange).toBe(false);
      expect(out.plugins[0]).toMatchObject({ dependencyStatus: 'hostIncompatible', trekRangeBypassed: null });
    });

    it('with the switch on, the plugin may activate but the row still says it is outside its range', async () => {
      process.env.APP_VERSION = '4.1.0';
      process.env.TREK_PLUGINS_IGNORE_TREK_RANGE = '1';
      await seed();
      const out = await (await makeService()).list();
      expect(out.ignoreTrekRange).toBe(true);
      expect(out.plugins[0]).toMatchObject({
        dependencyStatus: 'ok',
        trekRangeBypassed: { trekRange: '>=3.0.0 <4.0.0', hostVersion: '4.1.0' },
      });
    });

    it('a plugin inside its range carries no marker even with the switch on', async () => {
      process.env.APP_VERSION = '3.5.0';
      process.env.TREK_PLUGINS_IGNORE_TREK_RANGE = '1';
      await seed();
      const out = await (await makeService()).list();
      expect(out.plugins[0]).toMatchObject({ dependencyStatus: 'ok', trekRangeBypassed: null });
    });
  });

  it('surfaces updateHold as a boolean (held plugins leave the update banner)', async () => {
    await insertRow(orm, Plugins, {
      id: 'held',
      name: 'Held',
      type: 'widget',
      status: 'inactive',
      version: '1.0.0',
      update_hold: 1,
    });
    await insertRow(orm, Plugins, { id: 'free', name: 'Free', type: 'widget', status: 'inactive', version: '1.0.0' });

    const out = await (await makeService()).list();
    expect(out.plugins.find((p) => p.id === 'held')).toMatchObject({ updateHold: true });
    expect(out.plugins.find((p) => p.id === 'free')).toMatchObject({ updateHold: false });
  });

  it('resumeUpdates clears the hold and reports whether the plugin existed', async () => {
    await insertRow(orm, Plugins, {
      id: 'held',
      name: 'Held',
      type: 'widget',
      status: 'inactive',
      version: '1.0.0',
      update_hold: 1,
    });
    const svc = await makeService();

    expect(await svc.resumeUpdates('held')).toBe(true);
    expect(await findRow(orm, Plugins, { id: 'held' })).toMatchObject({ update_hold: 0 });
    expect(await svc.resumeUpdates('ghost')).toBe(false);
  });

  it('reports enabled by default (no kill switch set)', async () => {
    await insertRow(orm, Plugins, {
      id: 'flight',
      name: 'Flight',
      description: 'desc',
      type: 'widget',
      status: 'inactive',
      version: '1.0.0',
    });

    const out = await (await makeService()).list();
    expect(out.enabled).toBe(true);
    expect(out.plugins).toHaveLength(1);
  });

  it('reports disabled when the kill switch is off (TREK_PLUGINS_ENABLED=false)', async () => {
    process.env.TREK_PLUGINS_ENABLED = 'false';
    const out = await (await makeService()).list();
    expect(out.enabled).toBe(false);
    expect(out.plugins).toEqual([]);
  });

  // The four trust states an admin can be in. `signed` derives from the TOFU-pinned
  // author key; sideloaded/dev-linked derive from source_repo — so they are NOT
  // mutually exclusive in the data, and a sideloaded plugin legitimately reports
  // signed:false. The UI's precedence rule (source badge wins) depends on that being
  // reported honestly rather than papered over here.
  describe('signature status', () => {
    const insert = (id: string, sourceRepo: string | null, pubkey: string | null) =>
      insertRow(orm, Plugins, {
        id,
        name: id,
        type: 'widget',
        status: 'inactive',
        version: '1.0.0',
        source_repo: sourceRepo,
        author_pubkey: pubkey,
      });

    it('reports signed + a display fingerprint for a registry plugin with a pinned key', async () => {
      const key = 'RWTvBn0aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789abcd';
      await insert('signed-one', 'acme/signed-one', key);

      const p = (await (await makeService()).list()).plugins[0];
      expect(p.signed).toBe(true);
      // Short head…tail, for eyeballing against what the author reads out over the
      // phone. NOT a confidentiality measure — the key is public, and the re-trust
      // round-trip deliberately carries it in full.
      expect(p.keyFingerprint).toBe(`${key.slice(0, 8)}…${key.slice(-8)}`);
    });

    it('reports unsigned for a registry plugin with no pinned key', async () => {
      await insert('plain', 'acme/plain', null);
      const p = (await (await makeService()).list()).plugins[0];
      expect(p.signed).toBe(false);
      expect(p.keyFingerprint).toBeNull();
    });

    it('reports unsigned for a sideloaded and a dev-linked plugin (they carry no key)', async () => {
      await insert('uploaded', 'local:upload', null);
      await insert('linked', 'local:link', null);
      const plugins = (await (await makeService()).list()).plugins;
      expect(plugins.map((p) => [p.id, p.signed, p.source_repo])).toEqual([
        ['linked', false, 'local:link'],
        ['uploaded', false, 'local:upload'],
      ]);
    });

    it('surfaces a recorded update block, and reports none when there is none', async () => {
      await insert('blocked', 'acme/blocked', 'RWTvBn0aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789abcd');
      await insert('fine', 'acme/fine', null);
      await updateRows(
        orm,
        Plugins,
        { id: 'blocked' },
        {
          update_block_code: 'SIGNATURE_KEY_CHANGED',
          update_block_detail: 'the key changed',
          update_block_version: '2.0.0',
        },
      );

      const byId = Object.fromEntries((await (await makeService()).list()).plugins.map((p) => [p.id, p]));
      expect(byId.blocked.updateBlock).toEqual({
        code: 'SIGNATURE_KEY_CHANGED',
        detail: 'the key changed',
        version: '2.0.0',
      });
      expect(byId.fine.updateBlock).toBeNull();
    });

    it('never leaks the raw pinned key into the list response (only the fingerprint)', async () => {
      await insert('signed-one', 'acme/signed-one', 'RWTvBn0aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789abcd');
      // PluginListItem is an interface, so it has no implicit index signature and cannot
      // be narrowed to a record directly. Widening through unknown is what lets this case
      // probe for a key the contract deliberately does not declare.
      const p = (await (await makeService()).list()).plugins[0] as unknown as Record<string, unknown>;
      expect(p.author_pubkey).toBeUndefined();
    });
  });

  it('controller delegates to the service', async () => {
    const svc = { list: vi.fn(async () => ({ enabled: false, plugins: [] })) } as unknown as PluginsService;
    const runtime = {} as unknown as import('../../../src/nest/plugins/plugin-runtime.service').PluginRuntimeService;
    const res = await new PluginsController(
      svc,
      runtime,
      {} as never,
      { isManaged: () => false } as unknown as RuntimeEnvService,
    ).list();
    expect(svc.list).toHaveBeenCalled();
    expect(res).toEqual({ enabled: false, plugins: [] });
  });
});

describe('PluginsFeedController (client feed)', () => {
  it('returns active plugins when enabled, nothing when disabled', async () => {
    await insertRow(orm, Plugins, { id: 'w', name: 'W', type: 'widget', icon: 'Box', status: 'active' });
    await insertRow(orm, Plugins, { id: 'i', name: 'I', type: 'integration', icon: 'Plug', status: 'inactive' });
    const feed = await makeFeedController();

    process.env.TREK_PLUGINS_ENABLED = 'true';
    const active = await feed.list();
    expect(active.plugins).toEqual([{ id: 'w', name: 'W', type: 'widget', icon: 'Box', slot: 'sidebar' }]);

    process.env.TREK_PLUGINS_ENABLED = 'false';
    expect((await feed.list()).plugins).toEqual([]);
  });

  it('exposes the widget slot from capabilities (hero) and defaults on bad JSON', async () => {
    await insertRow(orm, Plugins, {
      id: 'h',
      name: 'H',
      type: 'widget',
      icon: 'Box',
      status: 'active',
      capabilities: '{"widget":{"slot":"hero"}}',
    });
    await insertRow(orm, Plugins, {
      id: 'b',
      name: 'B',
      type: 'widget',
      icon: 'Box',
      status: 'active',
      capabilities: 'not-json',
    });
    process.env.TREK_PLUGINS_ENABLED = 'true';
    const out = await (await makeFeedController()).list();
    expect(out.plugins.find((p) => p.id === 'h')?.slot).toBe('hero');
    expect(out.plugins.find((p) => p.id === 'b')?.slot).toBe('sidebar');
  });

  it('exposes the day-detail slot (a day-panel widget must not fall back to the dashboard)', async () => {
    await insertRow(orm, Plugins, {
      id: 'd',
      name: 'D',
      type: 'widget',
      icon: 'Box',
      status: 'active',
      capabilities: '{"widget":{"slot":"day-detail"}}',
    });
    process.env.TREK_PLUGINS_ENABLED = 'true';
    expect((await (await makeFeedController()).list()).plugins.find((p) => p.id === 'd')?.slot).toBe('day-detail');
  });

  it('exposes settingsUi only when the capability is exactly true', async () => {
    await insertRow(orm, Plugins, {
      id: 'su',
      name: 'S',
      type: 'widget',
      icon: 'Box',
      status: 'active',
      capabilities: '{"settingsUi":true}',
    });
    await insertRow(orm, Plugins, {
      id: 'no',
      name: 'N',
      type: 'widget',
      icon: 'Box',
      status: 'active',
      capabilities: '{"settingsUi":"yes"}',
    });
    process.env.TREK_PLUGINS_ENABLED = 'true';
    const out = await (await makeFeedController()).list();
    expect(out.plugins.find((p) => p.id === 'su')?.settingsUi).toBe(true);
    expect(out.plugins.find((p) => p.id === 'no')?.settingsUi).toBeUndefined();
  });

  it('exposes the reservation-detail slot (a booking-card widget must not fall back to the dashboard)', async () => {
    await insertRow(orm, Plugins, {
      id: 'r',
      name: 'R',
      type: 'widget',
      icon: 'Box',
      status: 'active',
      capabilities: '{"widget":{"slot":"reservation-detail"}}',
    });
    process.env.TREK_PLUGINS_ENABLED = 'true';
    expect((await (await makeFeedController()).list()).plugins.find((p) => p.id === 'r')?.slot).toBe(
      'reservation-detail',
    );
  });

  it('exposes tripPage for trip-page plugins, re-validated against the replaceable-tab whitelist', async () => {
    await insertRow(orm, Plugins, {
      id: 't',
      name: 'T',
      type: 'trip-page',
      icon: 'Box',
      status: 'active',
      capabilities: '{"tripPage":{"replaces":["transports","buchungen"],"position":1}}',
    });
    // a hand-edited row trying to hide 'plan' (or junk) is filtered here, not just at install
    await insertRow(orm, Plugins, {
      id: 'evil',
      name: 'E',
      type: 'trip-page',
      icon: 'Box',
      status: 'active',
      capabilities: '{"tripPage":{"replaces":["plan","nope"],"position":-3}}',
    });
    // the capability is meaningless off a trip-page and must not leak onto widgets
    await insertRow(orm, Plugins, {
      id: 'w2',
      name: 'W2',
      type: 'widget',
      icon: 'Box',
      status: 'active',
      capabilities: '{"tripPage":{"replaces":["transports"]}}',
    });
    process.env.TREK_PLUGINS_ENABLED = 'true';
    const out = await (await makeFeedController()).list();
    expect(out.plugins.find((p) => p.id === 't')?.tripPage).toEqual({
      replaces: ['transports', 'buchungen'],
      position: 1,
    });
    expect(out.plugins.find((p) => p.id === 'evil')?.tripPage).toBeUndefined();
    expect(out.plugins.find((p) => p.id === 'w2')?.tripPage).toBeUndefined();
  });
});

describe('PluginsController M2 endpoints', () => {
  const svc = {
    getInstanceConfig: vi.fn(async () => ({ a: 1 })),
    instanceSettingsFields: vi.fn(async () => [{ key: 'a' }]),
    updateInstanceConfig: vi.fn(async () => ({ a: 2 })),
  } as unknown as PluginsService;
  // None of the endpoints below carry the marker, so the ordinary install is the
  // whole story here; the refusals have their own tests.
  const envStub = { isManaged: () => false } as unknown as RuntimeEnvService;

  beforeEach(() => {
    (svc.getInstanceConfig as ReturnType<typeof vi.fn>).mockClear();
    (svc.updateInstanceConfig as ReturnType<typeof vi.fn>).mockClear();
    process.env.TREK_PLUGINS_ENABLED = 'true';
  });

  it('get/update config delegate to the service (get carries the form fields, update the restart)', async () => {
    const rt = {
      activate: vi.fn(),
      deactivate: vi.fn(),
      isActive: vi.fn(),
      respawnIfActive: vi.fn(async () => false),
      actionsOf: vi.fn(async () => []),
    } as never;
    const c = new PluginsController(svc, rt, {} as never, envStub);
    expect(await c.getConfig('x')).toEqual({ fields: [{ key: 'a' }], config: { a: 1 }, actions: [] });
    expect(await c.updateConfig('x', { a: 2 })).toEqual({ config: { a: 2 }, restarted: false });
  });

  it('activate spawns via the runtime when enabled', async () => {
    const rt = { activate: vi.fn(async () => {}), isActive: vi.fn(() => true) } as never;
    const out = await new PluginsController(svc, rt, {} as never, envStub).activate('x', {});
    expect(out).toEqual({ status: 'active' });
  });

  it('activate is 503 when the runtime is disabled', async () => {
    process.env.TREK_PLUGINS_ENABLED = 'false';
    const rt = { activate: vi.fn(), isActive: vi.fn() } as never;
    await expect(new PluginsController(svc, rt, {} as never, envStub).activate('x', {})).rejects.toMatchObject({
      status: 503,
    });
  });

  it('activate surfaces an activation error as 400', async () => {
    const rt = {
      activate: vi.fn(async () => {
        throw new Error('bad code');
      }),
      isActive: vi.fn(() => false),
    } as never;
    await expect(new PluginsController(svc, rt, {} as never, envStub).activate('x', {})).rejects.toMatchObject({
      status: 400,
    });
  });

  it('deactivate stops the plugin (and cascades to dependents)', async () => {
    const deactivateWithDependents = vi.fn(async () => ['x']);
    const rt = { deactivateWithDependents } as never;
    expect(await new PluginsController(svc, rt, {} as never, envStub).deactivate('x')).toEqual({ status: 'inactive' });
    expect(deactivateWithDependents).toHaveBeenCalledWith('x');
  });
});

describe('PluginsService instance config', () => {
  it('encrypts secret fields on write and masks them on read; keeps plaintext for non-secrets', async () => {
    await insertRow(orm, Plugins, { id: 'x', name: 'X', status: 'inactive', config: '{}' });
    await insertRow(orm, PluginSettingsFields, { plugin_id: 'x', field_key: 'api_key', scope: 'instance', secret: 1 });
    await insertRow(orm, PluginSettingsFields, { plugin_id: 'x', field_key: 'server', scope: 'instance', secret: 0 });

    const svc = await makeService();
    const masked = await svc.updateInstanceConfig('x', { api_key: 'super-secret', server: 'https://h' });
    // client gets the masked view
    expect(masked.api_key).toBe('••••••••');
    expect(masked.server).toBe('https://h');

    // stored value is encrypted, not plaintext
    const stored = await storedConfig('x');
    expect(stored.api_key).not.toBe('super-secret');
    expect(String(stored.api_key)).toMatch(/^enc:/);
    expect(stored.server).toBe('https://h');

    // an unchanged mask does not overwrite the stored secret
    await svc.updateInstanceConfig('x', { api_key: '••••••••' });
    const still = await storedConfig('x');
    expect(still.api_key).toBe(stored.api_key);

    expect((await svc.getInstanceConfig('x')).api_key).toBe('••••••••');
  });

  it('drops a key the plugin never declared, like the user-scope sibling does', async () => {
    await insertRow(orm, Plugins, { id: 'y', name: 'Y', status: 'inactive', config: '{}' });
    await insertRow(orm, PluginSettingsFields, { plugin_id: 'y', field_key: 'server', scope: 'instance', secret: 0 });

    const svc = await makeService();
    const masked = await svc.updateInstanceConfig('y', { server: 'https://h', smuggled: 'nope' });

    expect(masked.server).toBe('https://h');
    expect(masked.smuggled).toBeUndefined();
    const stored = await storedConfig('y');
    expect(stored).toEqual({ server: 'https://h' });
  });

  it('throws for an unknown plugin', async () => {
    await expect((await makeService()).updateInstanceConfig('nope', {})).rejects.toThrow(/not found/);
    await expect((await makeService()).getInstanceConfig('nope')).rejects.toThrow(/not found/);
  });
});

describe('PluginsService error log', () => {
  beforeEach(async () => {
    await deleteRows(orm, PluginErrorLog);
  });
  it('lists and clears a plugin error log', async () => {
    await insertRow(orm, PluginErrorLog, { plugin_id: 'p', level: 'error', message: 'boom', ts: '2026-01-01' });
    const svc = await makeService();
    expect(await svc.errors('p')).toEqual([{ ts: '2026-01-01', level: 'error', message: 'boom' }]);
    await svc.clearErrors('p');
    expect(await svc.errors('p')).toEqual([]);
  });
});
