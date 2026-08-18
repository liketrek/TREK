import { describe, it, expect, vi, beforeEach } from 'vitest';

// The wrapper delegates to legacy helpers; mock them so no real DB is loaded.
const { canAccessTrip, dbMock } = vi.hoisted(() => {
  const getMock = vi.fn();
  return {
    canAccessTrip: vi.fn(),
    dbMock: {
      prepare: vi.fn().mockReturnValue({ get: getMock }),
    },
  };
});
vi.mock('../../../src/db/database', () => ({ db: dbMock, canAccessTrip, closeDb: () => {}, reinitialize: () => {} }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn() }));
vi.mock('../../../src/services/permissions', () => ({ checkPermission }));

const { broadcast } = vi.hoisted(() => ({ broadcast: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast }));

const { collabSvc } = vi.hoisted(() => ({
  collabSvc: {
    createNote: vi.fn(),
    addNoteFile: vi.fn(),
    getFormattedNoteById: vi.fn(),
  },
}));
vi.mock('../../../src/services/collabService', () => collabSvc);

const { share } = vi.hoisted(() => ({
  share: {
    createOrUpdateShareLink: vi.fn(),
    getShareLink: vi.fn(),
    deleteShareLink: vi.fn(),
    getSharedTripData: vi.fn(),
    getSharedPlacePhotoPath: vi.fn(),
    getValidShareToken: vi.fn(),
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

    share.getValidShareToken.mockReturnValue({ trip_id: 5, allow_guest_notes: 1 });
    expect(svc().getValidShareToken('tok')).toEqual({ trip_id: 5, allow_guest_notes: 1 });
    expect(share.getValidShareToken).toHaveBeenCalledWith('tok');
  });

  describe('createGuestNote', () => {
    it('creates note, broadcasts collab:note:created, and returns formatted note', () => {
      const created = { id: 42, title: 'Note 42' };
      const formatted = { id: 42, title: 'Note 42', guest_name: 'Guest User', attachments: [] };
      collabSvc.createNote.mockReturnValue(created);
      collabSvc.getFormattedNoteById.mockReturnValue(formatted);

      const service = svc();
      const res = service.createGuestNote('5', 1, {
        title: 'Note 42',
        content: 'Some details',
        category: 'Food',
        guest_name: 'Guest User',
      });

      expect(collabSvc.createNote).toHaveBeenCalledWith('5', 1, {
        title: 'Note 42',
        content: 'Some details',
        category: 'Food',
        guest_name: 'Guest User',
      });
      expect(collabSvc.addNoteFile).not.toHaveBeenCalled();
      expect(collabSvc.getFormattedNoteById).toHaveBeenCalledWith(42);
      expect(broadcast).toHaveBeenCalledWith('5', 'collab:note:created', { note: formatted });
      expect(res).toEqual(formatted);
    });

    it('attaches uploaded file when provided', () => {
      const created = { id: 43, title: 'With File' };
      const formatted = { id: 43, title: 'With File', guest_name: 'Guest User', attachments: [{ id: 1 }] };
      const fakeFile = { filename: 'f1.png', originalname: 'orig.png', size: 123, mimetype: 'image/png' } as Express.Multer.File;
      collabSvc.createNote.mockReturnValue(created);
      collabSvc.getFormattedNoteById.mockReturnValue(formatted);

      const service = svc();
      const res = service.createGuestNote('5', 1, {
        title: 'With File',
        guest_name: 'Guest User',
      }, fakeFile);

      expect(collabSvc.addNoteFile).toHaveBeenCalledWith('5', 43, fakeFile);
      expect(collabSvc.getFormattedNoteById).toHaveBeenCalledWith(43);
      expect(broadcast).toHaveBeenCalledWith('5', 'collab:note:created', { note: formatted });
      expect(res).toEqual(formatted);
    });
  });
});
