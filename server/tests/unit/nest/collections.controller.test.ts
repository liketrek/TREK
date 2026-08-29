import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { CollectionsController } from '../../../src/nest/collections/collections.controller';
import type { CollectionsService } from '../../../src/nest/collections/collections.service';
import type { StorageService } from '../../../src/nest/storage/storage.service';
import type { User } from '../../../src/types';
import { HttpException } from '@nestjs/common';

import { describe, it, expect, vi, afterEach } from 'vitest';

const storageStub = { put: vi.fn().mockResolvedValue(undefined) } as unknown as StorageService;

const user = { id: 1, username: 'owner', role: 'user', email: 'u@example.test' } as User;

/** Service mock — access granted + owner by default; each method a spy. */
function makeService(overrides: Partial<Record<keyof CollectionsService, unknown>> = {}): CollectionsService {
  return {
    listCollections: vi.fn().mockReturnValue({ collections: [], incomingInvites: [] }),
    getCollection: vi.fn().mockReturnValue({ collection: { id: 3 }, places: [] }),
    createCollection: vi.fn().mockReturnValue({ id: 7 }),
    updateCollection: vi.fn().mockReturnValue({ id: 3 }),
    setCollectionCover: vi.fn().mockReturnValue({ id: 3 }),
    deleteCollection: vi.fn(),
    reorderCollections: vi.fn(),
    savePlace: vi.fn().mockReturnValue({ place: { id: 9 } }),
    saveFromTripPlace: vi.fn().mockReturnValue({ place: { id: 9 } }),
    updatePlace: vi.fn().mockReturnValue({ id: 9 }),
    setStatus: vi.fn().mockReturnValue({ id: 9 }),
    deletePlace: vi.fn(),
    deletePlacesMany: vi.fn().mockReturnValue([1, 2]),
    copyToTrip: vi.fn().mockReturnValue({ copied: 1, skipped: [] }),
    findMembership: vi.fn().mockReturnValue({ inLists: [] }),
    assertAccess: vi.fn(),
    isOwner: vi.fn().mockReturnValue(true),
    sendInvite: vi.fn().mockReturnValue({ success: true }),
    acceptInvite: vi.fn().mockReturnValue({ success: true }),
    declineInvite: vi.fn(),
    cancelInvite: vi.fn(),
    leaveCollection: vi.fn(),
    removeMember: vi.fn(),
    availableUsers: vi.fn().mockReturnValue([{ id: 2 }]),
    createLabel: vi.fn().mockReturnValue({ id: 5, collection_id: 3, name: 'Berlin' }),
    updateLabel: vi.fn().mockReturnValue({ id: 5, collection_id: 3, name: 'Hamburg' }),
    deleteLabel: vi.fn(),
    assignLabels: vi.fn().mockReturnValue({ changed: 2 }),
    ...overrides,
  } as unknown as CollectionsService;
}

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected the handler to throw');
}

async function thrownAsync(fn: () => Promise<unknown>): Promise<{ status: number; body: unknown }> {
  try {
    await fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected the handler to throw');
}

describe('CollectionsController', () => {
  afterEach(() => {
    delete process.env.DEMO_MODE;
  });

  it('lists / creates / reads / deletes lists (pass-throughs)', () => {
    const svc = makeService();
    const c = new CollectionsController(svc, new RuntimeEnvService(), storageStub);
    expect(c.list(user)).toEqual({ collections: [], incomingInvites: [] });
    expect(c.create(user, { name: 'Italy' } as never)).toEqual({ id: 7 });
    expect(c.get(user, '3')).toEqual({ collection: { id: 3 }, places: [] });
    expect(c.update(user, '3', { name: 'x' } as never, 'sock')).toEqual({ id: 3 });
    expect(svc.updateCollection).toHaveBeenCalledWith(1, 3, { name: 'x' }, 'sock');
    expect(c.remove(user, '3')).toEqual({ success: true });
    expect(svc.deleteCollection).toHaveBeenCalledWith(1, 3);
  });

  describe('reorder', () => {
    // The legacy 'orderedIds must be an array of numbers' 400 is gone:
    // collectionReorderRequestSchema types the array, so the pipe rejects a
    // bad payload before the handler runs.
    it('reorders a valid array', () => {
      const svc = makeService();
      expect(
        new CollectionsController(svc, new RuntimeEnvService(), storageStub).reorder(user, {
          orderedIds: [3, 1, 2],
        } as never),
      ).toEqual({ success: true });
      expect(svc.reorderCollections).toHaveBeenCalledWith(1, [3, 1, 2]);
    });
  });

  describe('places', () => {
    it('savePlace / updatePlace / setStatus / deletePlace forward the socket id', async () => {
      const svc = makeService();
      const c = new CollectionsController(svc, new RuntimeEnvService(), storageStub);
      c.savePlace(user, { collection_id: 3, name: 'A' } as never, 'sid');
      expect(svc.savePlace).toHaveBeenCalledWith(1, { collection_id: 3, name: 'A' }, 'sid');
      c.updatePlace(user, '9', { name: 'B' } as never, 'sid');
      expect(svc.updatePlace).toHaveBeenCalledWith(1, 9, { name: 'B' }, 'sid');
      c.setStatus(user, '9', { status: 'want' } as never, 'sid');
      expect(svc.setStatus).toHaveBeenCalledWith(1, 9, 'want', 'sid');
      expect(await c.deletePlace(user, '9', 'sid')).toEqual({ success: true });
      expect(svc.deletePlace).toHaveBeenCalledWith(1, 9, 'sid');
      c.saveFromTrip(user, { collection_id: 3, source_trip_id: 5, source_place_id: 8 } as never, 'sid');
      expect(svc.saveFromTripPlace).toHaveBeenCalledWith(1, 3, 5, 8, undefined, 'sid');
      expect(c.copyToTrip(user, { trip_id: 5, place_ids: [9] } as never)).toEqual({ copied: 1, skipped: [] });
    });

    // The legacy 'ids must be an array of numbers' 400 is gone:
    // collectionDeleteManyRequestSchema types the array, so the pipe rejects a
    // bad payload before the handler runs.
    it('deleteMany deletes a valid list', async () => {
      const svc = makeService();
      expect(
        await new CollectionsController(svc, new RuntimeEnvService(), storageStub).deleteMany(
          user,
          { ids: [1, 2] } as never,
          'sid',
        ),
      ).toEqual({ deleted: [1, 2] });
      expect(svc.deletePlacesMany).toHaveBeenCalledWith(1, [1, 2], 'sid');
    });
  });

  describe('membership lookup', () => {
    it('parses lat/lng when present', () => {
      const svc = makeService();
      new CollectionsController(svc, new RuntimeEnvService(), storageStub).membership(
        user,
        'gpid',
        undefined,
        'Rome',
        '41.9',
        '12.5',
      );
      expect(svc.findMembership).toHaveBeenCalledWith(1, {
        google_place_id: 'gpid',
        google_ftid: undefined,
        name: 'Rome',
        lat: 41.9,
        lng: 12.5,
      });
    });
    it('leaves lat/lng undefined when absent', () => {
      const svc = makeService();
      new CollectionsController(svc, new RuntimeEnvService(), storageStub).membership(user);
      expect(svc.findMembership).toHaveBeenCalledWith(1, {
        google_place_id: undefined,
        google_ftid: undefined,
        name: undefined,
        lat: undefined,
        lng: undefined,
      });
    });
  });

  describe('invites (owner-gated)', () => {
    it('403 when a non-owner invites', () => {
      const svc = makeService({ isOwner: vi.fn().mockReturnValue(false) });
      expect(
        thrown(() =>
          new CollectionsController(svc, new RuntimeEnvService(), storageStub).invite(user, {
            collection_id: 3,
            user_id: 2,
          } as never),
        ),
      ).toEqual({ status: 403, body: { error: 'Only the owner can invite' } });
    });
    it('surfaces a sendInvite error with its status', () => {
      const svc = makeService({ sendInvite: vi.fn().mockReturnValue({ error: 'Already a member', status: 409 }) });
      expect(
        thrown(() =>
          new CollectionsController(svc, new RuntimeEnvService(), storageStub).invite(user, {
            collection_id: 3,
            user_id: 2,
          } as never),
        ),
      ).toEqual({ status: 409, body: { error: 'Already a member' } });
    });
    it('invites successfully as owner', () => {
      const svc = makeService();
      expect(
        new CollectionsController(svc, new RuntimeEnvService(), storageStub).invite(user, {
          collection_id: 3,
          user_id: 2,
        } as never),
      ).toEqual({ success: true });
    });
    it('accept surfaces an error, else succeeds', () => {
      const bad = makeService({ acceptInvite: vi.fn().mockReturnValue({ error: 'Gone', status: 404 }) });
      expect(
        thrown(() =>
          new CollectionsController(bad, new RuntimeEnvService(), storageStub).acceptInvite(
            user,
            { collection_id: 3 } as never,
            'sid',
          ),
        ),
      ).toEqual({ status: 404, body: { error: 'Gone' } });
      const svc = makeService();
      expect(
        new CollectionsController(svc, new RuntimeEnvService(), storageStub).acceptInvite(
          user,
          { collection_id: 3 } as never,
          'sid',
        ),
      ).toEqual({ success: true });
      expect(svc.acceptInvite).toHaveBeenCalledWith(1, 3, 'sid');
    });
    it('decline + leave forward the socket id', () => {
      const svc = makeService();
      const c = new CollectionsController(svc, new RuntimeEnvService(), storageStub);
      expect(c.declineInvite(user, { collection_id: 3 } as never, 'sid')).toEqual({ success: true });
      expect(svc.declineInvite).toHaveBeenCalledWith(1, 3, 'sid');
      expect(c.leave(user, { collection_id: 3 } as never, 'sid')).toEqual({ success: true });
      expect(svc.leaveCollection).toHaveBeenCalledWith(1, 3, 'sid');
    });
    it('cancel is owner-gated', () => {
      const notOwner = makeService({ isOwner: vi.fn().mockReturnValue(false) });
      expect(
        thrown(() =>
          new CollectionsController(notOwner, new RuntimeEnvService(), storageStub).cancelInvite(user, {
            collection_id: 3,
            user_id: 2,
          } as never),
        ),
      ).toEqual({ status: 403, body: { error: 'Only the owner can cancel invites' } });
      const svc = makeService();
      expect(
        new CollectionsController(svc, new RuntimeEnvService(), storageStub).cancelInvite(user, {
          collection_id: 3,
          user_id: 2,
        } as never),
      ).toEqual({ success: true });
    });
  });

  describe('members', () => {
    it('removeMember is owner-gated', () => {
      const notOwner = makeService({ isOwner: vi.fn().mockReturnValue(false) });
      expect(
        thrown(() =>
          new CollectionsController(notOwner, new RuntimeEnvService(), storageStub).removeMember(user, {
            collection_id: 3,
            user_id: 2,
          } as never),
        ),
      ).toEqual({ status: 403, body: { error: 'Only the owner can remove members' } });
      const svc = makeService();
      expect(
        new CollectionsController(svc, new RuntimeEnvService(), storageStub).removeMember(user, {
          collection_id: 3,
          user_id: 2,
        } as never),
      ).toEqual({ success: true });
      expect(svc.removeMember).toHaveBeenCalledWith(1, 3, 2);
    });
    it('availableUsers is owner-gated', () => {
      const notOwner = makeService({ isOwner: vi.fn().mockReturnValue(false) });
      expect(
        thrown(() =>
          new CollectionsController(notOwner, new RuntimeEnvService(), storageStub).availableUsers(user, '3'),
        ),
      ).toEqual({ status: 403, body: { error: 'Only the owner can manage members' } });
      expect(
        new CollectionsController(makeService(), new RuntimeEnvService(), storageStub).availableUsers(user, '3'),
      ).toEqual({ users: [{ id: 2 }] });
    });
  });

  describe('uploadCover', () => {
    const file = { filename: 'x.jpg' } as Express.Multer.File;
    it('403 in demo mode for a demo user', async () => {
      process.env.DEMO_MODE = 'true';
      const demo = { ...user, email: 'demo@trek.app' } as User;
      expect(
        await thrownAsync(() =>
          new CollectionsController(makeService(), new RuntimeEnvService(), storageStub).uploadCover(demo, '3', file),
        ),
      ).toEqual({
        status: 403,
        body: { error: 'Uploads are disabled in demo mode. Self-host TREK for full functionality.' },
      });
    });
    it('400 when no file was uploaded', async () => {
      expect(
        await thrownAsync(() =>
          new CollectionsController(makeService(), new RuntimeEnvService(), storageStub).uploadCover(
            user,
            '3',
            undefined,
          ),
        ),
      ).toEqual({ status: 400, body: { error: 'No image uploaded' } });
    });
    it('commits + stores the cover and forwards the socket id', async () => {
      const svc = makeService();
      expect(
        await new CollectionsController(svc, new RuntimeEnvService(), storageStub).uploadCover(user, '3', file, 'sid'),
      ).toEqual({ id: 3 });
      expect(storageStub.put).toHaveBeenCalledWith('covers', 'x.jpg', { tmpPath: undefined });
      expect(svc.setCollectionCover).toHaveBeenCalledWith(1, 3, '/uploads/covers/x.jpg', 'sid');
    });
  });

  describe('uploadPlaceImage', () => {
    const file = { filename: 'x.jpg' } as Express.Multer.File;
    it('403 in demo mode for a demo user', async () => {
      process.env.DEMO_MODE = 'true';
      const demo = { ...user, email: 'demo@trek.app' } as User;
      expect(
        await thrownAsync(() =>
          new CollectionsController(makeService(), new RuntimeEnvService(), storageStub).uploadPlaceImage(
            demo,
            '9',
            file,
          ),
        ),
      ).toEqual({
        status: 403,
        body: { error: 'Uploads are disabled in demo mode. Self-host TREK for full functionality.' },
      });
    });
    it('400 when no file was uploaded', async () => {
      expect(
        await thrownAsync(() =>
          new CollectionsController(makeService(), new RuntimeEnvService(), storageStub).uploadPlaceImage(
            user,
            '9',
            undefined,
          ),
        ),
      ).toEqual({ status: 400, body: { error: 'No image uploaded' } });
    });
    it('commits + stores the place image via /uploads/places and forwards the socket id', async () => {
      const svc = makeService({ setPlaceImage: vi.fn().mockReturnValue({ id: 9 }) });
      expect(
        await new CollectionsController(svc, new RuntimeEnvService(), storageStub).uploadPlaceImage(
          user,
          '9',
          file,
          'sid',
        ),
      ).toEqual({ id: 9 });
      expect(storageStub.put).toHaveBeenCalledWith('places', 'x.jpg', { tmpPath: undefined });
      expect(svc.setPlaceImage).toHaveBeenCalledWith(1, 9, '/uploads/places/x.jpg', 'sid');
    });
  });

  describe('labels', () => {
    it('create / update / delete / assign / unassign forward user + socket id', () => {
      const svc = makeService();
      const c = new CollectionsController(svc, new RuntimeEnvService(), storageStub);

      c.createLabel(user, { collection_id: 3, name: 'Berlin', color: '#ff0000' } as never, 'sock');
      expect(svc.createLabel).toHaveBeenCalledWith(1, 3, 'Berlin', '#ff0000', 'sock');

      c.updateLabel(user, '5', { name: 'Hamburg' } as never, 'sock');
      expect(svc.updateLabel).toHaveBeenCalledWith(1, 5, { name: 'Hamburg' }, 'sock');

      expect(c.deleteLabel(user, '5', 'sock')).toEqual({ success: true });
      expect(svc.deleteLabel).toHaveBeenCalledWith(1, 5, 'sock');

      c.assignLabels(user, { label_ids: [5], place_ids: [9, 10] } as never, 'sock');
      expect(svc.assignLabels).toHaveBeenCalledWith(1, [5], [9, 10], false, 'sock');

      c.unassignLabels(user, { label_ids: [5], place_ids: [9] } as never, 'sock');
      expect(svc.assignLabels).toHaveBeenCalledWith(1, [5], [9], true, 'sock');
    });
  });
});
