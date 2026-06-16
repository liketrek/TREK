import { describe, it, expect, vi, beforeEach } from 'vitest';

const { dbMock } = vi.hoisted(() => {
  const stmt = { get: vi.fn(() => ({ id: 42 })), all: vi.fn(() => []), run: vi.fn() };
  return { dbMock: { prepare: vi.fn(() => stmt), _stmt: stmt } };
});
const { canAccessTrip } = vi.hoisted(() => ({ canAccessTrip: vi.fn(() => ({ user_id: 1 })) }));
vi.mock('../../../src/db/database', () => ({ db: dbMock, canAccessTrip, closeDb: () => {}, reinitialize: () => {} }));

const { broadcast } = vi.hoisted(() => ({ broadcast: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast }));
const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn(() => true) }));
vi.mock('../../../src/services/permissions', () => ({ checkPermission }));

const { tripSvc } = vi.hoisted(() => ({
  tripSvc: {
    listTrips: vi.fn(), createTrip: vi.fn(), getTrip: vi.fn(), updateTrip: vi.fn(), deleteTrip: vi.fn(),
    getTripRaw: vi.fn(), getTripOwner: vi.fn(), deleteOldCover: vi.fn(), updateCoverImage: vi.fn(),
    listMembers: vi.fn(() => ({ owner: { id: 1 }, members: [] })), addMember: vi.fn(), removeMember: vi.fn(),
    exportICS: vi.fn(), copyTripById: vi.fn(), TRIP_SELECT: 'SELECT * FROM trips t',
  },
}));
vi.mock('../../../src/services/tripService', () => tripSvc);
vi.mock('../../../src/services/dayService', () => ({ listDays: () => ({ days: [1] }), listAccommodations: () => [] }));
vi.mock('../../../src/services/placeService', () => ({ listPlaces: () => [] }));
vi.mock('../../../src/services/packingService', () => ({ listItems: () => [] }));
vi.mock('../../../src/services/todoService', () => ({ listItems: () => [] }));
vi.mock('../../../src/services/budgetService', () => ({ listBudgetItems: () => [] }));
vi.mock('../../../src/services/reservationService', () => ({ listReservations: () => [] }));
vi.mock('../../../src/services/fileService', () => ({ listFiles: () => [] }));

import { TripsService } from '../../../src/nest/trips/trips.service';

function svc() { return new TripsService(); }
beforeEach(() => vi.clearAllMocks());

describe('TripsService (wrapper delegation + bundle/copy/notify helpers)', () => {
  it('delegates the simple wrappers to tripService', () => {
    const s = svc();
    s.list(1, 0); expect(tripSvc.listTrips).toHaveBeenCalledWith(1, 0);
    s.create(1, { title: 'T' } as never); expect(tripSvc.createTrip).toHaveBeenCalledWith(1, { title: 'T' });
    s.get('9', 1); expect(tripSvc.getTrip).toHaveBeenCalledWith('9', 1);
    s.getRaw('9'); expect(tripSvc.getTripRaw).toHaveBeenCalledWith('9');
    s.getOwner('9'); expect(tripSvc.getTripOwner).toHaveBeenCalledWith('9');
    s.update('9', 1, {} as never, 'user'); expect(tripSvc.updateTrip).toHaveBeenCalledWith('9', 1, {}, 'user');
    s.remove('9', 1, 'user'); expect(tripSvc.deleteTrip).toHaveBeenCalledWith('9', 1, 'user');
    s.deleteOldCover('/old.jpg'); expect(tripSvc.deleteOldCover).toHaveBeenCalledWith('/old.jpg');
    s.updateCoverImage('9', '/n.jpg'); expect(tripSvc.updateCoverImage).toHaveBeenCalledWith('9', '/n.jpg');
    s.copy('9', 1, 'C'); expect(tripSvc.copyTripById).toHaveBeenCalledWith('9', 1, 'C');
    s.listMembers('9', 1); expect(tripSvc.listMembers).toHaveBeenCalledWith('9', 1);
    s.addMember('9', 'b@x.y', 1, 1); expect(tripSvc.addMember).toHaveBeenCalledWith('9', 'b@x.y', 1, 1);
    s.removeMember('9', 2); expect(tripSvc.removeMember).toHaveBeenCalledWith('9', 2);
    s.exportICS('9'); expect(tripSvc.exportICS).toHaveBeenCalledWith('9');
  });

  it('canAccessTrip delegates to the db helper', () => {
    canAccessTrip.mockReturnValueOnce({ user_id: 7 });
    expect(svc().canAccessTrip('9', 7)).toEqual({ user_id: 7 });
    expect(canAccessTrip).toHaveBeenCalledWith('9', 7);
  });

  it('can() delegates to checkPermission; broadcast forwards', () => {
    svc().can('trip_edit', 'user', 1, 1, false);
    expect(checkPermission).toHaveBeenCalledWith('trip_edit', 'user', 1, 1, false);
    svc().broadcast('9', 'trip:updated', { a: 1 }, 'sock');
    expect(broadcast).toHaveBeenCalledWith('9', 'trip:updated', { a: 1 }, 'sock');
  });

  it('getCopiedTrip re-reads via the TRIP_SELECT query', () => {
    expect(svc().getCopiedTrip(42, 1)).toEqual({ id: 42 });
    expect(dbMock.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM trips t'));
  });

  it('bundle aggregates every sub-collection + the member list', () => {
    const result = svc().bundle('9', { user_id: 1 });
    expect(result).toMatchObject({ trip: { user_id: 1 }, days: [1], places: [], members: [{ id: 1 }] });
  });

  it('bundle tolerates a null member list', () => {
    tripSvc.listMembers.mockReturnValueOnce({ owner: { id: 1 }, members: null });
    const result = svc().bundle('9', { user_id: 1 });
    expect(result).toMatchObject({ members: [{ id: 1 }] });
  });

  it('notifyInvite is fire-and-forget (no throw)', () => {
    expect(() => svc().notifyInvite('9', { id: 1, email: 'a@b.c' } as never, 2, 'T', 'b@x.y')).not.toThrow();
  });
});
