import { describe, it, expect, vi, beforeEach } from 'vitest';

// The wrapper delegates to legacy helpers; mock them so no real DB is loaded.
const { canAccessTrip } = vi.hoisted(() => ({ canAccessTrip: vi.fn() }));
vi.mock('../../../src/db/database', () => ({ canAccessTrip, closeDb: () => {}, reinitialize: () => {} }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn() }));
vi.mock('../../../src/services/permissions', () => ({ checkPermission }));

const { share } = vi.hoisted(() => ({
  share: {
    createOrUpdateShareLink: vi.fn(),
    getShareLink: vi.fn(),
    deleteShareLink: vi.fn(),
    getSharedTripData: vi.fn(),
    getSharedPlacePhotoPath: vi.fn(),
  },
}));
vi.mock('../../../src/services/shareService', () => share);

import { ShareService } from '../../../src/nest/share/share.service';
import type { User } from '../../../src/types';

function svc() {
  return new ShareService();
}

beforeEach(() => vi.clearAllMocks());

describe('ShareService', () => {
  it('verifyTripAccess delegates to canAccessTrip', () => {
    canAccessTrip.mockReturnValue({ id: 5, user_id: 2 });
    expect(svc().verifyTripAccess('5', 2)).toEqual({ id: 5, user_id: 2 });
    expect(canAccessTrip).toHaveBeenCalledWith('5', 2);
  });

  it('canManage forwards the ownership flag when the user owns the trip', () => {
    checkPermission.mockReturnValue(true);
    const trip = { user_id: 1 } as never;
    const user = { id: 1, role: 'user' } as User;
    expect(svc().canManage(trip, user)).toBe(true);
    expect(checkPermission).toHaveBeenCalledWith('share_manage', 'user', 1, 1, false);
  });

  it('canManage marks the user as a guest when they do not own the trip', () => {
    checkPermission.mockReturnValue(false);
    const trip = { user_id: 2 } as never;
    const user = { id: 1, role: 'user' } as User;
    expect(svc().canManage(trip, user)).toBe(false);
    expect(checkPermission).toHaveBeenCalledWith('share_manage', 'user', 2, 1, true);
  });

  it('createOrUpdate delegates to the legacy share service', () => {
    share.createOrUpdateShareLink.mockReturnValue({ token: 't', created: true });
    const perms = { share_map: true };
    expect(svc().createOrUpdate('5', 2, perms)).toEqual({ token: 't', created: true });
    expect(share.createOrUpdateShareLink).toHaveBeenCalledWith('5', 2, perms);
  });

  it('get / remove / getSharedTripData / getSharedPlacePhotoPath delegate', () => {
    share.getShareLink.mockReturnValue({ token: 't' });
    expect(svc().get('5')).toEqual({ token: 't' });
    expect(share.getShareLink).toHaveBeenCalledWith('5');

    svc().remove('5');
    expect(share.deleteShareLink).toHaveBeenCalledWith('5');

    share.getSharedTripData.mockReturnValue({ trip: { id: 9 } });
    expect(svc().getSharedTripData('tok')).toEqual({ trip: { id: 9 } });
    expect(share.getSharedTripData).toHaveBeenCalledWith('tok');

    share.getSharedPlacePhotoPath.mockReturnValue('/cache/p1.jpg');
    expect(svc().getSharedPlacePhotoPath('tok', 'p1')).toBe('/cache/p1.jpg');
    expect(share.getSharedPlacePhotoPath).toHaveBeenCalledWith('tok', 'p1');
  });
});
