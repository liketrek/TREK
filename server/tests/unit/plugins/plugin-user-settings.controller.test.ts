/**
 * PluginUserSettingsController (#plugins): a user's own scope:'user' settings. Thin —
 * PluginsService holds the storage/masking logic (separately tested); here we prove the
 * gates (runtime off / no user / inactive plugin) and the delegation.
 */
import type { PluginsRepository } from '../../../src/db/repositories/Plugins.repository';
import type { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';
import { PluginUserSettingsController } from '../../../src/nest/plugins/plugin-user-settings.controller';
import type { PluginsService } from '../../../src/nest/plugins/plugins.service';

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { pluginsEnabled, getMock } = vi.hoisted(() => ({
  pluginsEnabled: vi.fn(() => true),
  getMock: vi.fn(() => ({ 1: 1 })), // active by default
}));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (id?: number) => ({ user: id === undefined ? undefined : { id } }) as any;
function ctrl() {
  const svc = {
    userSettingsFields: vi.fn(async () => [{ key: 'apiKey', secret: true }]),
    getUserConfig: vi.fn(async () => ({ apiKey: '••••••••' })),
    updateUserConfig: vi.fn(async (_id: string, _uid: number, patch: Record<string, unknown>) => ({
      ...patch,
      apiKey: '••••••••',
    })),
  } as unknown as PluginsService;
  // The controller now also takes the runtime (for settings-page actions).
  const runtime = {
    actionsOf: vi.fn(async () => []),
    invokeAction: vi.fn(async () => ({ ok: true })),
  } as unknown as PluginRuntimeService;
  // PUC1 (Plan 3j Task 5) — the active-plugin guard is now Plugins.repository.ts#existsActive.
  const plugins = { existsActive: vi.fn(async () => !!getMock()) } as unknown as PluginsRepository;
  return { c: new PluginUserSettingsController(svc, runtime, plugins), svc, runtime };
}

describe('PluginUserSettingsController', () => {
  beforeEach(() => {
    pluginsEnabled.mockReturnValue(true);
    getMock.mockReturnValue({ 1: 1 });
  });

  it('GET returns fields + masked config for a bound user; empty when gated', async () => {
    const { c } = ctrl();
    expect(await c.get('p', req(5))).toEqual({
      fields: [{ key: 'apiKey', secret: true }],
      config: { apiKey: '••••••••' },
      actions: [],
    });
    pluginsEnabled.mockReturnValue(false);
    expect(await c.get('p', req(5))).toEqual({ fields: [], config: {}, actions: [] });
    pluginsEnabled.mockReturnValue(true);
    expect(await c.get('p', req(undefined))).toEqual({ fields: [], config: {}, actions: [] });
    getMock.mockReturnValue(undefined as never);
    expect(await c.get('p', req(5))).toEqual({ fields: [], config: {}, actions: [] });
  });

  it('POST delegates the patch for a bound user; empty when gated', async () => {
    const { c, svc } = ctrl();
    expect(await c.update('p', { config: { units: 'metric' } }, req(5))).toEqual({
      config: { units: 'metric', apiKey: '••••••••' },
    });
    expect(svc.updateUserConfig).toHaveBeenCalledWith('p', 5, { units: 'metric' });
    // a non-object body → empty patch (no throw)
    await c.update('p', {}, req(5));
    expect(svc.updateUserConfig).toHaveBeenCalledWith('p', 5, {});
    getMock.mockReturnValue(undefined as never);
    expect(await c.update('p', { config: { units: 'metric' } }, req(5))).toEqual({ config: {} });
  });

  it('GET lists USER-scope actions only, and POST runs one as the caller in the user scope', async () => {
    const { c, runtime } = ctrl();
    await c.get('p', req(5));
    expect(runtime.actionsOf).toHaveBeenCalledWith('p', 'user');
    expect(await c.runAction('p', 'sync', req(5))).toEqual({ ok: true });
    expect(runtime.invokeAction).toHaveBeenCalledWith('p', 'sync', 5, 'user');
  });
});
