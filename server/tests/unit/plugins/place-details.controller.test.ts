import { describe, it, expect, vi, beforeEach } from 'vitest';

const { canAccessTrip, placeTrip, pluginsEnabled } = vi.hoisted(() => ({
  canAccessTrip: vi.fn((tripId: number, userId: number) => (tripId === 1 && userId === 5 ? { id: 1 } : undefined)),
  placeTrip: vi.fn((placeId: number) => (placeId === 7 ? { trip_id: 1 } : undefined)),
  pluginsEnabled: vi.fn(() => true),
}));
vi.mock('../../../src/db/database', () => ({
  db: { prepare: () => ({ get: (placeId: number) => placeTrip(placeId) }) },
  canAccessTrip,
}));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

import { PlaceDetailsController } from '../../../src/nest/plugins/place-details.controller';
import type { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (id?: number) => ({ user: id === undefined ? undefined : { id } }) as any;
function controller(over: Partial<PluginRuntimeService> = {}) {
  const runtime = {
    providersOf: vi.fn(() => ['p1', 'p2']),
    invokeHook: vi.fn(async (id: string) => (id === 'p2' ? [{ label: 'Rating', value: '4.5' }] : [{ label: 'Reviews', value: '12', url: 'https://x' }])),
    ...over,
  } as unknown as PluginRuntimeService;
  return { c: new PlaceDetailsController(runtime), runtime };
}

describe('PlaceDetailsController', () => {
  beforeEach(() => { pluginsEnabled.mockReturnValue(true); canAccessTrip.mockReturnValue({ id: 1 } as never); });

  it('returns [] when the runtime is disabled (no plugin calls)', async () => {
    pluginsEnabled.mockReturnValue(false);
    const { c, runtime } = controller();
    expect(await c.get('7', req(5))).toEqual({ providers: [] });
    expect(runtime.providersOf).not.toHaveBeenCalled();
  });

  it('returns [] for an unknown place or a place the caller cannot access', async () => {
    const { c } = controller();
    expect(await c.get('999', req(5))).toEqual({ providers: [] }); // place not found
    canAccessTrip.mockReturnValue(undefined as never);
    expect(await c.get('7', req(5))).toEqual({ providers: [] }); // no access
  });

  it('returns [] without an authenticated user', async () => {
    const { c } = controller();
    expect(await c.get('7', req(undefined))).toEqual({ providers: [] });
  });

  it('merges every provider that returns items and skips one that throws (graceful)', async () => {
    const { c, runtime } = controller({
      invokeHook: vi.fn(async (id: string) => {
        if (id === 'p2') throw new Error('slow provider');
        return [{ label: 'Reviews', value: '12' }];
      }) as unknown as PluginRuntimeService['invokeHook'],
    });
    const res = await c.get('7', req(5));
    expect(res.providers).toEqual([{ pluginId: 'p1', items: [{ label: 'Reviews', value: '12' }] }]);
    expect(runtime.invokeHook).toHaveBeenCalledWith('p1', 'placeDetailProvider', 'getDetails', [7], 5, 5000);
  });
});
