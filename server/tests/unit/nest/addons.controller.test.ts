import { describe, it, expect, vi } from 'vitest';
import { AddonsController } from '../../../src/nest/addons/addons.controller';
import type { AddonsService } from '../../../src/nest/addons/addons.service';

function makeService(overrides: Partial<AddonsService> = {}): AddonsService {
  return {
    list: vi.fn().mockReturnValue({ collabFeatures: {}, bagTracking: false, addons: [] }),
    ...overrides,
  } as unknown as AddonsService;
}

describe('AddonsController (parity with the legacy GET /api/addons route)', () => {
  it('GET / delegates straight to the service and returns its feed', () => {
    const feed = {
      collabFeatures: { comments: true },
      bagTracking: true,
      addons: [{ id: 'atlas', name: 'Atlas', type: 'page', icon: 'globe', enabled: true }],
    };
    const list = vi.fn().mockReturnValue(feed);
    const svc = makeService({ list } as Partial<AddonsService>);

    expect(new AddonsController(svc).list()).toBe(feed);
    expect(list).toHaveBeenCalledTimes(1);
    expect(list).toHaveBeenCalledWith();
  });
});
