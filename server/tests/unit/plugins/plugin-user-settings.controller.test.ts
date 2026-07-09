/**
 * PluginUserSettingsController (#plugins): a user's own scope:'user' settings. Thin —
 * PluginsService holds the storage/masking logic (separately tested); here we prove the
 * gates (runtime off / no user / inactive plugin) and the delegation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { pluginsEnabled, getMock } = vi.hoisted(() => ({
  pluginsEnabled: vi.fn(() => true),
  getMock: vi.fn(() => ({ 1: 1 })), // active by default
}));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));
vi.mock('../../../src/db/database', () => ({ db: { prepare: () => ({ get: getMock }) } }));

import { PluginUserSettingsController } from '../../../src/nest/plugins/plugin-user-settings.controller';
import type { PluginsService } from '../../../src/nest/plugins/plugins.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (id?: number) => ({ user: id === undefined ? undefined : { id } }) as any;
function ctrl() {
  const svc = {
    userSettingsFields: vi.fn(() => [{ key: 'apiKey', secret: true }]),
    getUserConfig: vi.fn(() => ({ apiKey: '••••••••' })),
    updateUserConfig: vi.fn((_id: string, _uid: number, patch: Record<string, unknown>) => ({ ...patch, apiKey: '••••••••' })),
  } as unknown as PluginsService;
  return { c: new PluginUserSettingsController(svc), svc };
}

describe('PluginUserSettingsController', () => {
  beforeEach(() => { pluginsEnabled.mockReturnValue(true); getMock.mockReturnValue({ 1: 1 }); });

  it('GET returns fields + masked config for a bound user; empty when gated', () => {
    const { c } = ctrl();
    expect(c.get('p', req(5))).toEqual({ fields: [{ key: 'apiKey', secret: true }], config: { apiKey: '••••••••' } });
    pluginsEnabled.mockReturnValue(false);
    expect(c.get('p', req(5))).toEqual({ fields: [], config: {} });
    pluginsEnabled.mockReturnValue(true);
    expect(c.get('p', req(undefined))).toEqual({ fields: [], config: {} });
    getMock.mockReturnValue(undefined as never);
    expect(c.get('p', req(5))).toEqual({ fields: [], config: {} });
  });

  it('POST delegates the patch for a bound user; empty when gated', () => {
    const { c, svc } = ctrl();
    expect(c.update('p', { config: { units: 'metric' } }, req(5))).toEqual({ config: { units: 'metric', apiKey: '••••••••' } });
    expect(svc.updateUserConfig).toHaveBeenCalledWith('p', 5, { units: 'metric' });
    // a non-object body → empty patch (no throw)
    c.update('p', {}, req(5));
    expect(svc.updateUserConfig).toHaveBeenCalledWith('p', 5, {});
    getMock.mockReturnValue(undefined as never);
    expect(c.update('p', { config: { units: 'metric' } }, req(5))).toEqual({ config: {} });
  });
});
