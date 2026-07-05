import { describe, it, expect, vi, beforeEach } from 'vitest';

const { canAccessTrip, pluginsEnabled } = vi.hoisted(() => ({
  canAccessTrip: vi.fn((tripId: number, userId: number) => (tripId === 1 && userId === 5 ? { id: 1 } : undefined)),
  pluginsEnabled: vi.fn(() => true),
}));
vi.mock('../../../src/db/database', () => ({ db: {}, canAccessTrip }));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

import { TripWarningsController } from '../../../src/nest/plugins/trip-warnings.controller';
import type { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (id?: number) => ({ user: id === undefined ? undefined : { id } }) as any;
function controller(over: Partial<PluginRuntimeService> = {}) {
  const runtime = {
    providersOf: vi.fn(() => ['p1', 'p2']),
    invokeHook: vi.fn(async (id: string) =>
      id === 'p2' ? [{ level: 'error', message: 'Day 3 is overpacked', dayId: 3 }] : [{ level: 'warning', message: 'Museum closed Mon', placeId: 7 }]),
    ...over,
  } as unknown as PluginRuntimeService;
  return { c: new TripWarningsController(runtime), runtime };
}

describe('TripWarningsController', () => {
  beforeEach(() => { pluginsEnabled.mockReturnValue(true); canAccessTrip.mockReturnValue({ id: 1 } as never); });

  it('returns [] when disabled / no user / no access', async () => {
    pluginsEnabled.mockReturnValue(false);
    expect(await controller().c.get('1', req(5))).toEqual({ warnings: [] });
    pluginsEnabled.mockReturnValue(true);
    expect(await controller().c.get('1', req(undefined))).toEqual({ warnings: [] });
    canAccessTrip.mockReturnValue(undefined as never);
    expect(await controller().c.get('1', req(5))).toEqual({ warnings: [] });
  });

  it('merges provider warnings, tags each with the plugin id, defaults an odd level to warning', async () => {
    const { c } = controller({
      invokeHook: vi.fn(async (id: string) =>
        id === 'p1' ? [{ level: 'bogus', message: 'Check timings' }, { message: '' }] : [{ level: 'info', message: 'Rainy week' }]) as unknown as PluginRuntimeService['invokeHook'],
    });
    const res = await c.get('1', req(5));
    expect(res.warnings).toEqual([
      { pluginId: 'p1', level: 'warning', message: 'Check timings', dayId: undefined, placeId: undefined }, // unknown level → warning; empty-message row dropped
      { pluginId: 'p2', level: 'info', message: 'Rainy week', dayId: undefined, placeId: undefined },
    ]);
  });

  it('skips a provider that throws (graceful) and calls the hook with the trip + acting user', async () => {
    const { c, runtime } = controller({
      invokeHook: vi.fn(async (id: string) => { if (id === 'p2') throw new Error('slow'); return [{ level: 'warning', message: 'ok' }]; }) as unknown as PluginRuntimeService['invokeHook'],
    });
    const res = await c.get('1', req(5));
    expect(res.warnings).toEqual([{ pluginId: 'p1', level: 'warning', message: 'ok', dayId: undefined, placeId: undefined }]);
    expect(runtime.invokeHook).toHaveBeenCalledWith('p1', 'warningProvider', 'getWarnings', [1], 5, 5000);
  });
});
