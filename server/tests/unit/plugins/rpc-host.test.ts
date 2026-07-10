/**
 * The capability router is the plugin permission boundary (#plugins, M1). These
 * tests prove that an ungranted method is never reachable, a granted method
 * works, a granted trip read is still membership-checked against the acting
 * user, and bad params / unknown methods are rejected — without ever spawning a
 * child (the router runs in the host).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginRpcHost, type HostDeps } from '../../../src/nest/plugins/host/rpc-host';
import type { RpcRequest, RpcResponse, RpcError } from '../../../src/nest/plugins/protocol/envelope';

function makeDeps(): HostDeps {
  return {
    data: {
      query: vi.fn(() => [{ n: 1 }]),
      exec: vi.fn(() => ({ changes: 1 })),
      migrate: vi.fn(() => ({ applied: true })),
      close: vi.fn(),
    } as unknown as HostDeps['data'],
    db: {
      prepare: vi.fn((sql: string) => ({
        all: () => [{ id: 7, name: 'Place' }],
        get: () =>
          sql.includes('FROM trips')
            ? { id: 1, title: 'Japan', start_date: '2027-01-01' }
            : { id: 3, username: 'ada', display_name: 'Ada', avatar: null },
      })),
    },
    // trip 1 is accessible to user 42; everything else is not
    canAccessTrip: vi.fn((tripId: number, userId: number) => (tripId === 1 && userId === 42 ? { id: 1 } : undefined)),
    // user 42 may see user 3 (they share a trip); nobody else
    canSeeUser: vi.fn((actingUserId: number, targetUserId: number) => actingUserId === 42 && targetUserId === 3),
    broadcastToTrip: vi.fn(),
    broadcastToUser: vi.fn(),
    // Costs (budget) — addon on; user 42 may edit trip 1's costs.
    budgetAddonEnabled: vi.fn(() => true),
    canEditCosts: vi.fn((tripId: number, userId: number) => tripId === 1 && userId === 42),
    listPackingItems: vi.fn((tripId: number, _userId: number) => [{ id: 1, trip_id: tripId, name: 'Socks' }]),
    listTripFiles: vi.fn((tripId: number) => [{ id: 2, trip_id: tripId, filename: 'visa.pdf' }]),
    getTripFileContent: vi.fn((tripId: number, fileId: number) => ({ name: 'visa.pdf', mimetype: 'application/pdf', size: 3, content_base64: 'aGk=', _t: tripId, _f: fileId })),
    listCollabNotes: vi.fn((tripId: number) => [{ id: 1, trip_id: tripId, title: 'Note' }]),
    listCollabPolls: vi.fn((tripId: number) => [{ id: 2, trip_id: tripId, question: 'Q?' }]),
    listCollabMessages: vi.fn((tripId: number, before: number | undefined) => [{ id: 3, trip_id: tripId, text: 'hi', _before: before ?? null }]),
    journalEntriesForUser: vi.fn((uid: number, journeyId: number) => [{ id: 10, journey_id: journeyId, author_id: uid }]),
    atlasBucketForUser: vi.fn((uid: number) => [{ id: 5, user_id: uid, name: 'Kyoto' }]),
    canCreateTrip: vi.fn((userId: number) => userId === 42),
    createTripForUser: vi.fn((userId: number, input: unknown) => ({ id: 99, user_id: userId, ...(input as object) })),
    getRates: vi.fn(async (base: string) => ({ [base]: 1, USD: 1.08 })),
    listCostsForTrip: vi.fn((tripId: number) => [{ id: 5, trip_id: tripId, name: 'Hotel', total_price: 100 }]),
    listCostsForUser: vi.fn(() => [
      { id: 5, trip_id: 1, name: 'Hotel' },
      { id: 6, trip_id: 2, name: 'Food' },
    ]),
    createCost: vi.fn((tripId: number, input: unknown) => ({ id: 9, trip_id: tripId, ...(input as object) })),
    updateCost: vi.fn((tripId: number, itemId: number, input: unknown) => ({ id: itemId, trip_id: tripId, ...(input as object) })),
    deleteCost: vi.fn(() => ({ deleted: true })),
    // Planner writes — user 42 may edit trip 1 only (mirrors canAccessTrip).
    canEditPlaces: vi.fn((tripId: number, userId: number) => tripId === 1 && userId === 42),
    createPlace: vi.fn((tripId: number, input: unknown) => ({ id: 10, trip_id: tripId, ...(input as object) })),
    updatePlace: vi.fn((tripId: number, placeId: number, input: unknown) => ({ id: placeId, trip_id: tripId, ...(input as object) })),
    deletePlace: vi.fn(() => ({ deleted: true })),
    canEditDays: vi.fn((tripId: number, userId: number) => tripId === 1 && userId === 42),
    createDay: vi.fn((tripId: number, input: unknown) => ({ id: 20, trip_id: tripId, ...(input as object) })),
    updateDay: vi.fn((tripId: number, dayId: number, input: unknown) => ({ id: dayId, trip_id: tripId, ...(input as object) })),
    deleteDay: vi.fn(() => ({ deleted: true })),
    assignPlaceToDay: vi.fn((tripId: number, dayId: number, placeId: number, notes: string | null) => ({ id: 30, day_id: dayId, place_id: placeId, notes })),
    unassignPlace: vi.fn(() => ({ deleted: true })),
    canEditTrip: vi.fn((tripId: number, userId: number) => tripId === 1 && userId === 42),
    updateTrip: vi.fn((tripId: number, _userId: number, input: unknown) => ({ id: tripId, ...(input as object) })),
    // Cross-trip reads + reservations (bookings) — user 42 may edit trip 1 only.
    listTripsForUser: vi.fn(() => [{ id: 1, title: 'Japan' }, { id: 2, title: 'Peru' }]),
    listReservationsForUser: vi.fn(() => [{ id: 5, trip_id: 1, title: 'Hotel' }, { id: 6, trip_id: 2, title: 'Flight' }]),
    canEditReservations: vi.fn((tripId: number, userId: number) => tripId === 1 && userId === 42),
    createReservation: vi.fn((tripId: number, input: unknown) => ({ id: 40, trip_id: tripId, ...(input as object) })),
    updateReservation: vi.fn((tripId: number, reservationId: number, input: unknown) => ({ id: reservationId, trip_id: tripId, ...(input as object) })),
    deleteReservation: vi.fn(() => ({ deleted: true })),
    // Trip-scoped hydrated reads + accommodations (lodging blocks, day_edit-gated).
    listTripDays: vi.fn((tripId: number) => [{ id: 3, trip_id: tripId, day_number: 1, assignments: [], notes_items: [] }]),
    listTripReservations: vi.fn((tripId: number) => [{ id: 5, trip_id: tripId, title: 'Hotel', endpoints: [], day_positions: null }]),
    listTripAccommodations: vi.fn((tripId: number) => [{ id: 11, trip_id: tripId, place_name: 'Ryokan' }]),
    createAccommodation: vi.fn((tripId: number, input: unknown) => ({ id: 60, trip_id: tripId, ...(input as object) })),
    updateAccommodation: vi.fn((tripId: number, accommodationId: number, input: unknown) => ({ id: accommodationId, trip_id: tripId, ...(input as object) })),
    deleteAccommodation: vi.fn(() => ({ deleted: true })),
    // User-scoped addon reads + day notes.
    listJournalsForUser: vi.fn(() => [{ id: 1, title: 'Japan 2027' }]),
    atlasVisitedForUser: vi.fn(() => ({ countries: [{ country_code: 'JP' }], regions: [] })),
    vacayForUser: vi.fn(() => ({ plan: { id: 1 }, entries: [] })),
    listCollectionsForUser: vi.fn(() => ({ collections: [{ id: 1, name: 'Tokyo eats' }] })),
    getCollectionForUser: vi.fn((_userId: number, id: number) => ({ id, name: 'Tokyo eats', places: [] })),
    listDayNotes: vi.fn((tripId: number, dayId: number) => [{ id: 1, day_id: dayId, trip_id: tripId, text: 'note' }]),
    createDayNote: vi.fn((_tripId: number, dayId: number, input: unknown) => ({ id: 50, day_id: dayId, ...(input as object) })),
    updateDayNote: vi.fn((_tripId: number, dayId: number, noteId: number, input: unknown) => ({ id: noteId, day_id: dayId, ...(input as object) })),
    deleteDayNote: vi.fn(() => ({ deleted: true })),
    canEditPacking: vi.fn((tripId: number, userId: number) => tripId === 1 && userId === 42),
    createPackingItem: vi.fn((tripId: number, input: unknown) => ({ id: 70, trip_id: tripId, ...(input as object) })),
    updatePackingItem: vi.fn((tripId: number, itemId: number, input: unknown) => ({ id: itemId, trip_id: tripId, ...(input as object) })),
    deletePackingItem: vi.fn(() => ({ deleted: true })),
    listPackingBags: vi.fn(() => [{ id: 80, name: 'Backpack' }]),
    createPackingBag: vi.fn((tripId: number, input: unknown) => ({ id: 80, trip_id: tripId, ...(input as object) })),
    updatePackingBag: vi.fn((_tripId: number, bagId: number, input: unknown) => ({ id: bagId, ...(input as object) })),
    deletePackingBag: vi.fn(() => ({ deleted: true })),
    setPackingBagMembers: vi.fn((_tripId: number, bagId: number, userIds: number[]) => ({ bagId, members: userIds })),
    getWeather: vi.fn(() => ({ temp: 20 })),
    listCategories: vi.fn(() => [{ id: 1, name: 'Food' }]),
    tripMembers: vi.fn(() => [{ id: 5, username: 'ada' }, { id: 6, username: 'bob' }]),
    listTagsForUser: vi.fn((uid: number) => [{ id: 1, user_id: uid, name: 'work' }]),
    createTagForUser: vi.fn((uid: number, name: string) => ({ id: 9, user_id: uid, name })),
    updateTagForUser: vi.fn((_uid: number, tagId: number, name?: string) => ({ id: tagId, name })),
    deleteTagForUser: vi.fn(() => ({ deleted: true })),
    canUploadFiles: vi.fn((tripId: number, userId: number) => tripId === 1 && userId === 42),
    canEditFiles: vi.fn((tripId: number, userId: number) => tripId === 1 && userId === 42),
    canDeleteFiles: vi.fn((tripId: number, userId: number) => tripId === 1 && userId === 42),
    createTripFile: vi.fn((tripId: number, input: unknown, uid: number) => ({ id: 130, trip_id: tripId, uploaded_by: uid, ...(input as object) })),
    createTripFileLink: vi.fn(() => [{ file_id: 130 }]),
    updateTripFile: vi.fn((_tripId: number, fileId: number, input: unknown) => ({ id: fileId, ...(input as object) })),
    softDeleteTripFile: vi.fn(() => ({ deleted: true })),
    canEditCollab: vi.fn((tripId: number, userId: number) => tripId === 1 && userId === 42),
    createCollabNote: vi.fn((tripId: number, input: unknown, uid: number) => ({ id: 140, trip_id: tripId, created_by: uid, ...(input as object) })),
    createCollabPoll: vi.fn((tripId: number, input: unknown) => ({ id: 141, trip_id: tripId, ...(input as object) })),
    voteCollabPoll: vi.fn((_tripId: number, pollId: number) => ({ id: pollId, votes: 1 })),
    createCollabMessage: vi.fn((tripId: number, text: string) => ({ id: 142, trip_id: tripId, text })),
    canManageMembers: vi.fn((tripId: number, userId: number) => tripId === 1 && userId === 42),
    addTripMember: vi.fn((tripId: number, targetUserId: number, invitedBy: number) => ({ joined: true, tripId, targetUserId, invitedBy })),
    removeTripMember: vi.fn((tripId: number, targetUserId: number) => ({ removed: true, tripId, targetUserId })),
    canAccessTripForNotify: vi.fn((tripId: number, userId: number) => tripId === 1 && userId === 42),
    sendPluginNotification: vi.fn(async (pluginId: string, input: unknown) => ({ sent: true, pluginId, ...(input as object) })),
    aiConfigured: vi.fn((userId: number) => userId === 42),
    aiComplete: vi.fn(async (_uid: number, prompt: string) => ({ text: `echo:${prompt}` })),
    aiExtract: vi.fn(async () => ({ results: [{ ok: true }] })),
    getUserSetting: vi.fn((pluginId: string, userId: number, key: string) => (userId === 42 && key === 'apiKey' ? `secret-of-${pluginId}` : undefined)),
    getOAuthToken: vi.fn(async (_pluginId: string, userId: number) => (userId === 42 ? 'access-token-xyz' : null)),
    schedulerSet: vi.fn((name: string, dueAt: number, everyMs: number | undefined) => ({ scheduled: true, name, dueAt, everyMs })),
    schedulerCancel: vi.fn((name: string) => ({ cancelled: name !== 'ghost' })),
    createCollectionForUser: vi.fn((uid: number, input: unknown) => ({ id: 100, owner_id: uid, ...(input as object) })),
    updateCollectionForUser: vi.fn((_uid: number, id: number, input: unknown) => ({ id, ...(input as object) })),
    saveCollectionPlace: vi.fn((uid: number, input: unknown) => ({ id: 101, saved_by: uid, ...(input as object) })),
    copyCollectionToTrip: vi.fn(() => ({ copied: 2, skipped: [] })),
    deleteCollectionPlace: vi.fn(() => ({ deleted: true })),
    markCountryVisited: vi.fn(() => ({ visited: true })),
    unmarkCountryVisited: vi.fn(() => ({ visited: false })),
    markRegionVisited: vi.fn(() => ({ visited: true })),
    unmarkRegionVisited: vi.fn(() => ({ visited: false })),
    createBucketItem: vi.fn((uid: number, input: unknown) => ({ id: 110, user_id: uid, ...(input as object) })),
    deleteBucketItem: vi.fn(() => ({ deleted: true })),
    vacayToggleEntry: vi.fn(() => ({ action: 'added' })),
    vacayToggleCompanyHoliday: vi.fn(() => ({ action: 'added' })),
    createJournalEntry: vi.fn((uid: number, journeyId: number, input: unknown) => ({ id: 120, journey_id: journeyId, created_by: uid, ...(input as object) })),
    updateJournalEntry: vi.fn((_uid: number, entryId: number, input: unknown) => ({ id: entryId, ...(input as object) })),
    deleteJournalEntry: vi.fn(() => ({ deleted: true })),
    createJournal: vi.fn((uid: number, input: unknown) => ({ id: 130, user_id: uid, ...(input as object) })),
    deleteJournal: vi.fn(() => ({ deleted: true })),
    canEditTodos: vi.fn((tripId: number, userId: number) => tripId === 1 && userId === 42),
    listTodos: vi.fn(() => [{ id: 1, name: 'Pack' }]),
    createTodo: vi.fn((tripId: number, input: unknown) => ({ id: 90, trip_id: tripId, ...(input as object) })),
    updateTodo: vi.fn((_tripId: number, todoId: number, input: unknown) => ({ id: todoId, ...(input as object) })),
    deleteTodo: vi.fn(() => ({ deleted: true })),
    // Metadata — trip 1 and place 7 resolve to trip 1 (accessible to 42); else undefined.
    metaEntityTrip: vi.fn((entityType: string, entityId: number) =>
      (entityType === 'trip' && entityId === 1) || (entityType === 'place' && entityId === 7) || (entityType === 'day' && entityId === 3)
        || (entityType === 'reservation' && entityId === 40) || (entityType === 'accommodation' && entityId === 11) ? 1 : undefined),
    metaGet: vi.fn(() => ({ hello: 'world' })),
    metaSet: vi.fn((_et: string, _eid: number, key: string, value: unknown) => ({ key, value })),
    metaList: vi.fn(() => ({ a: 1 })),
    metaDelete: vi.fn(() => ({ deleted: true })),
  };
}

const req = (method: string, params: Record<string, unknown> = {}): RpcRequest => ({ k: 'req', id: 'x', method, params });
const ok = (r: RpcResponse | RpcError): r is RpcResponse => r.ok === true;

describe('PluginRpcHost — capability enforcement', () => {
  let deps: HostDeps;
  beforeEach(() => { deps = makeDeps(); });

  it('registers only granted methods; an ungranted method is PERMISSION_DENIED', async () => {
    const host = new PluginRpcHost('p', new Set(['db:own']), deps);
    const denied = await host.dispatch(req('trips.getById', { tripId: 1, asUserId: 42 }));
    expect(denied.ok).toBe(false);
    expect((denied as RpcError).error.code).toBe('PERMISSION_DENIED');
    expect(deps.canAccessTrip).not.toHaveBeenCalled();
  });

  it('a granted db:own method runs against the plugin db', async () => {
    const host = new PluginRpcHost('p', new Set(['db:own']), deps);
    const res = await host.dispatch(req('db.query', { sql: 'SELECT 1', args: [] }));
    expect(ok(res)).toBe(true);
    expect((res as RpcResponse).result).toEqual([{ n: 1 }]);
    expect(deps.data.query).toHaveBeenCalledWith('SELECT 1', []);
  });

  it('an unknown method is UNKNOWN_METHOD, not PERMISSION_DENIED', async () => {
    const host = new PluginRpcHost('p', new Set(['db:own']), deps);
    const res = await host.dispatch(req('fs.readFile', { path: '/etc/passwd' }));
    expect((res as RpcError).error.code).toBe('UNKNOWN_METHOD');
  });

  it('db:read:trips reads a trip the acting user can access', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:trips']), deps);
    // The acting user is bound by the HOST (2nd dispatch arg), never from params.
    const res = await host.dispatch(req('trips.getById', { tripId: 1 }), 42);
    expect(ok(res)).toBe(true);
    // returns the ACTUAL trip row (title/start_date), not the access-check object
    expect((res as RpcResponse).result).toMatchObject({ id: 1, title: 'Japan', start_date: '2027-01-01' });
    expect(deps.db.prepare).toHaveBeenCalledWith(expect.stringContaining('FROM trips'));
  });

  it('db:read:trips is still RESOURCE_FORBIDDEN when the user is not a member', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:trips']), deps);
    const res = await host.dispatch(req('trips.getById', { tripId: 1 }), 99);
    expect((res as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('a trip read with NO bound acting user is RESOURCE_FORBIDDEN (jobs / forged calls)', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:trips']), deps);
    // A plugin-supplied asUserId is ignored; without a host-bound user, deny.
    const res = await host.dispatch(req('trips.getById', { tripId: 1, asUserId: 42 }), undefined);
    expect((res as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.canAccessTrip).not.toHaveBeenCalled();
  });

  it('trips.getPlaces is membership-checked before the core read', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:trips']), deps);
    const forbidden = await host.dispatch(req('trips.getPlaces', { tripId: 2 }), 42);
    expect((forbidden as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.db.prepare).not.toHaveBeenCalled();

    const allowed = await host.dispatch(req('trips.getPlaces', { tripId: 1 }), 42);
    expect(ok(allowed)).toBe(true);
    expect((allowed as RpcResponse).result).toEqual([{ id: 7, name: 'Place' }]);
  });

  it('db:read:packing / db:read:files delegate to the service, membership-checked, and stay separate scopes', async () => {
    const packing = new PluginRpcHost('p', new Set(['db:read:packing']), deps);
    // no access to trip 2 → refused before the service is called
    expect(((await packing.dispatch(req('packing.list', { tripId: 2 }), 42)) as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.listPackingItems).not.toHaveBeenCalled();
    const okP = await packing.dispatch(req('packing.list', { tripId: 1 }), 42);
    expect(ok(okP)).toBe(true);
    // the acting user is threaded through so packing's #858 private-item filter applies
    expect(deps.listPackingItems).toHaveBeenCalledWith(1, 42);
    // the packing scope does NOT unlock files
    expect(((await packing.dispatch(req('files.list', { tripId: 1 }), 42)) as RpcError).error.code).toBe('PERMISSION_DENIED');

    const files = new PluginRpcHost('p', new Set(['db:read:files']), deps);
    const okF = await files.dispatch(req('files.list', { tripId: 1 }), 42);
    expect((okF as RpcResponse).result).toEqual([{ id: 2, trip_id: 1, filename: 'visa.pdf' }]);
  });

  it('db:read:users returns only the public projection for a visible user', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:users']), deps);
    const res = await host.dispatch(req('users.getById', { id: 3 }), 42);
    expect(ok(res)).toBe(true);
    expect((res as RpcResponse).result).toEqual({ id: 3, username: 'ada', display_name: 'Ada', avatar: null });
    // the SELECT column list is host-controlled — no password/token columns
    expect(deps.db.prepare).toHaveBeenCalledWith(expect.stringContaining('id, username, display_name, avatar'));
  });

  it('db:read:users is RESOURCE_FORBIDDEN for a user the acting user cannot see (no enumeration)', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:users']), deps);
    const forbidden = await host.dispatch(req('users.getById', { id: 999 }), 42);
    expect((forbidden as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    // and with no bound acting user (job / forged call), also denied
    const noUser = await host.dispatch(req('users.getById', { id: 3 }), undefined);
    expect((noUser as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('ws:broadcast:trip forwards to the (namespaced) broadcaster for a member', async () => {
    const host = new PluginRpcHost('p', new Set(['ws:broadcast:trip']), deps);
    const res = await host.dispatch(req('ws.broadcastToTrip', { tripId: 1, event: 'ping', data: { a: 1 } }), 42);
    expect(ok(res)).toBe(true);
    expect(deps.broadcastToTrip).toHaveBeenCalledWith(1, 'ping', { a: 1 });
  });

  it('ws:broadcast:trip is RESOURCE_FORBIDDEN for a non-member trip (no cross-tenant push)', async () => {
    const host = new PluginRpcHost('p', new Set(['ws:broadcast:trip']), deps);
    const forbidden = await host.dispatch(req('ws.broadcastToTrip', { tripId: 999, event: 'x', data: {} }), 42);
    expect((forbidden as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.broadcastToTrip).not.toHaveBeenCalled();
    // and a broadcast with no bound acting user is denied too
    const noUser = await host.dispatch(req('ws.broadcastToTrip', { tripId: 1, event: 'x', data: {} }), undefined);
    expect((noUser as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('bad params are BAD_PARAMS', async () => {
    const host = new PluginRpcHost('p', new Set(['db:own']), deps);
    const res = await host.dispatch(req('db.query', { args: [] }));
    expect((res as RpcError).error.code).toBe('BAD_PARAMS');
  });

  it('with no permissions, every real method is denied', async () => {
    const host = new PluginRpcHost('p', new Set<string>(), deps);
    for (const m of ['db.query', 'trips.getById', 'users.getById', 'ws.broadcastToTrip']) {
      const res = await host.dispatch(req(m, { tripId: 1, asUserId: 42, id: 3, event: 'x', sql: 'SELECT 1' }));
      expect((res as RpcError).error.code).toBe('PERMISSION_DENIED');
    }
  });

  it('ws:broadcast:user forwards only to the acting user (never an arbitrary one)', async () => {
    const host = new PluginRpcHost('p', new Set(['ws:broadcast:user']), deps);
    const res = await host.dispatch(req('ws.broadcastToUser', { userId: 42, event: 'poke', data: { x: 2 } }), 42);
    expect(ok(res)).toBe(true);
    expect(deps.broadcastToUser).toHaveBeenCalledWith(42, { event: 'poke', x: 2 });
    // broadcasting to a DIFFERENT user is refused
    const forbidden = await host.dispatch(req('ws.broadcastToUser', { userId: 9, event: 'poke', data: {} }), 42);
    expect((forbidden as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('non-array db args are BAD_PARAMS; a primitive ws payload is wrapped', async () => {
    const host = new PluginRpcHost('p', new Set(['db:own', 'ws:broadcast:trip']), deps);
    const bad = await host.dispatch(req('db.query', { sql: 'SELECT 1', args: 'nope' }));
    expect((bad as RpcError).error.code).toBe('BAD_PARAMS');

    await host.dispatch(req('ws.broadcastToTrip', { tripId: 1, event: 'ping', data: 'primitive' }), 42);
    expect(deps.broadcastToTrip).toHaveBeenCalledWith(1, 'ping', { value: 'primitive' });
  });

  it('dispose() closes the plugin data db', () => {
    const host = new PluginRpcHost('p', new Set(['db:own']), deps);
    host.dispose();
    expect(deps.data.close).toHaveBeenCalled();
  });

  it('trips.getReservations is membership-checked and returns the hydrated list', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:trips']), deps);
    const res = await host.dispatch(req('trips.getReservations', { tripId: 1 }), 42);
    expect(ok(res)).toBe(true);
    // the REST-parity list (endpoints/day_positions), not a raw row scan
    expect(deps.listTripReservations).toHaveBeenCalledWith(1);
    expect(((res as RpcResponse).result as Array<{ endpoints: unknown[] }>)[0].endpoints).toEqual([]);
    const forbidden = await host.dispatch(req('trips.getReservations', { tripId: 2 }), 42);
    expect((forbidden as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('trips.getDays / trips.getAccommodations ride on db:read:trips, membership-checked', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:trips']), deps);
    const days = await host.dispatch(req('trips.getDays', { tripId: 1 }), 42);
    expect(ok(days)).toBe(true);
    expect(deps.listTripDays).toHaveBeenCalledWith(1);
    const acc = await host.dispatch(req('trips.getAccommodations', { tripId: 1 }), 42);
    expect(ok(acc)).toBe(true);
    expect(deps.listTripAccommodations).toHaveBeenCalledWith(1);
    for (const m of ['trips.getDays', 'trips.getAccommodations']) {
      const forbidden = await host.dispatch(req(m, { tripId: 2 }), 42);
      expect((forbidden as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
      const noUser = await host.dispatch(req(m, { tripId: 1 }), undefined);
      expect((noUser as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    }
  });

  it('trips.listMine returns the acting user\'s trips; a job (no user) is refused', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:trips']), deps);
    const res = await host.dispatch(req('trips.listMine'), 42);
    expect(ok(res)).toBe(true);
    expect((res as RpcResponse).result).toHaveLength(2);
    const noUser = await host.dispatch(req('trips.listMine'), undefined);
    expect((noUser as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('reservations.listMine aggregates across accessible trips; refused without a user', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:trips']), deps);
    const res = await host.dispatch(req('reservations.listMine'), 42);
    expect(ok(res)).toBe(true);
    expect((res as RpcResponse).result).toHaveLength(2);
    expect((await host.dispatch(req('reservations.listMine'), undefined)).ok).toBe(false);
  });

  it('reservations.create needs db:write:reservations + reservation_edit, membership-checked', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:reservations']), deps);
    const good = await host.dispatch(req('reservations.create', { tripId: 1, input: { title: 'Hotel Tokyo' } }), 42);
    expect(ok(good)).toBe(true);
    expect(deps.createReservation).toHaveBeenCalledWith(1, expect.objectContaining({ title: 'Hotel Tokyo' }), 42);
    // a trip the acting user cannot edit -> forbidden, and the dep is never reached
    const forbidden = await host.dispatch(req('reservations.create', { tripId: 2, input: { title: 'x' } }), 42);
    expect((forbidden as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('reservations.create refuses a job/onLoad (no acting user) and invalid input', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:reservations']), deps);
    const noUser = await host.dispatch(req('reservations.create', { tripId: 1, input: { title: 'x' } }), undefined);
    expect((noUser as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    const bad = await host.dispatch(req('reservations.create', { tripId: 1, input: {} }), 42);
    expect((bad as RpcError).error.code).toBe('BAD_PARAMS');
    expect(deps.createReservation).not.toHaveBeenCalled();
  });

  it('reservations.delete is gated the same way (edit permission + membership)', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:reservations']), deps);
    const good = await host.dispatch(req('reservations.delete', { tripId: 1, reservationId: 40 }), 42);
    expect(ok(good)).toBe(true);
    expect(deps.deleteReservation).toHaveBeenCalledWith(1, 40, 42);
    const forbidden = await host.dispatch(req('reservations.delete', { tripId: 2, reservationId: 1 }), 42);
    expect((forbidden as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('reservations.create/update pin the endpoint STRUCTURE but stay permissive like the service', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:reservations']), deps);
    const goodEp = [{ role: 'from', name: 'HND', lat: 35.55, lng: 139.78, code: 'HND' }];
    const good = await host.dispatch(req('reservations.create', { tripId: 1, input: { title: 'Flight', endpoints: goodEp } }), 42);
    expect(ok(good)).toBe(true);
    // A structurally-wrong endpoint (bad role enum) or a non-array is refused up front.
    for (const endpoints of [[{ role: 'banana', name: 'x', lat: 1, lng: 2 }], 'nope']) {
      const bad = await host.dispatch(req('reservations.update', { tripId: 1, reservationId: 40, input: { endpoints } }), 42);
      expect((bad as RpcError).error.code).toBe('BAD_PARAMS');
    }
    // But a coord-less endpoint is NOT rejected — it's accepted and dropped downstream,
    // exactly like the REST/importer path (no breaking change vs 3.2.1).
    const coordless = await host.dispatch(req('reservations.update', { tripId: 1, reservationId: 40, input: { endpoints: [{ role: 'to', name: 'x' }] } }), 42);
    expect(ok(coordless)).toBe(true);
    // [] is the documented delete-all and stays valid
    const clear = await host.dispatch(req('reservations.update', { tripId: 1, reservationId: 40, input: { endpoints: [] } }), 42);
    expect(ok(clear)).toBe(true);
  });

  it('accommodations.* need db:write:accommodations + day_edit, membership-checked', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:accommodations']), deps);
    const input = { place_id: 7, start_day_id: 3, end_day_id: 4 };
    const good = await host.dispatch(req('accommodations.create', { tripId: 1, input }), 42);
    expect(ok(good)).toBe(true);
    expect(deps.createAccommodation).toHaveBeenCalledWith(1, expect.objectContaining(input));
    // gated by day_edit (accommodations live in the day service), not reservation_edit
    (deps.canEditDays as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);
    const noEdit = await host.dispatch(req('accommodations.create', { tripId: 1, input }), 42);
    expect((noEdit as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    const forbidden = await host.dispatch(req('accommodations.update', { tripId: 2, accommodationId: 11, input: {} }), 42);
    expect((forbidden as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    const noUser = await host.dispatch(req('accommodations.delete', { tripId: 1, accommodationId: 11 }), undefined);
    expect((noUser as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    const bad = await host.dispatch(req('accommodations.create', { tripId: 1, input: { place_id: 7 } }), 42);
    expect((bad as RpcError).error.code).toBe('BAD_PARAMS');
    const del = await host.dispatch(req('accommodations.delete', { tripId: 1, accommodationId: 11 }), 42);
    expect(ok(del)).toBe(true);
    expect(deps.deleteAccommodation).toHaveBeenCalledWith(1, 11);
    // and none of it is reachable without the grant
    const ungranted = new PluginRpcHost('p', new Set(['db:write:reservations']), deps);
    const denied = await ungranted.dispatch(req('accommodations.create', { tripId: 1, input }), 42);
    expect((denied as RpcError).error.code).toBe('PERMISSION_DENIED');
  });

  it('user-scoped addon reads (journal/atlas/vacay) need a bound user; a job is refused', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:journal', 'db:read:atlas', 'db:read:vacay']), deps);
    expect(ok(await host.dispatch(req('journal.listMine'), 42))).toBe(true);
    expect(ok(await host.dispatch(req('atlas.visited'), 42))).toBe(true);
    expect(ok(await host.dispatch(req('vacay.mine'), 42))).toBe(true);
    for (const m of ['journal.listMine', 'atlas.visited', 'vacay.mine']) {
      expect((await host.dispatch(req(m), undefined)).ok).toBe(false);
    }
  });

  it('wave-13 reads: collab / journal.getEntries / atlas.bucketList / files.getContent / rates / trips.create gated correctly', async () => {
    // collab reads: membership-checked, need db:read:collab
    const collab = new PluginRpcHost('p', new Set(['db:read:collab']), deps);
    expect(ok(await collab.dispatch(req('collab.listNotes', { tripId: 1 }), 42))).toBe(true);
    expect(ok(await collab.dispatch(req('collab.listMessages', { tripId: 1, before: 5 }), 42))).toBe(true);
    expect((await collab.dispatch(req('collab.listPolls', { tripId: 2 }), 42)).ok).toBe(false); // no access to trip 2
    // journal.getEntries: user-bound, needs db:read:journal; a job is refused
    const journal = new PluginRpcHost('p', new Set(['db:read:journal']), deps);
    expect(ok(await journal.dispatch(req('journal.getEntries', { journeyId: 7 }), 42))).toBe(true);
    expect((await journal.dispatch(req('journal.getEntries', { journeyId: 7 }), undefined)).ok).toBe(false);
    // atlas.bucketList: user-bound, needs db:read:atlas
    const atlas = new PluginRpcHost('p', new Set(['db:read:atlas']), deps);
    expect(ok(await atlas.dispatch(req('atlas.bucketList'), 42))).toBe(true);
    expect((await atlas.dispatch(req('atlas.bucketList'), undefined)).ok).toBe(false);
    // files.getContent: separate grant from files.list, membership-checked
    const files = new PluginRpcHost('p', new Set(['db:read:files:content']), deps);
    expect(ok(await files.dispatch(req('files.getContent', { tripId: 1, fileId: 2 }), 42))).toBe(true);
    expect((await files.dispatch(req('files.getContent', { tripId: 2, fileId: 2 }), 42)).ok).toBe(false);
    // reading content is NOT unlocked by plain db:read:files
    const filesList = new PluginRpcHost('p', new Set(['db:read:files']), deps);
    expect((await filesList.dispatch(req('files.getContent', { tripId: 1, fileId: 2 }), 42) as RpcError).error.code).toBe('PERMISSION_DENIED');
    // rates.get: tenant-free (works without a user), needs rates:read
    const rates = new PluginRpcHost('p', new Set(['rates:read']), deps);
    expect(ok(await rates.dispatch(req('rates.get', { base: 'EUR' }), undefined))).toBe(true);
    // trips.create: needs db:create:trips + the acting user's trip_create + a bound user
    const create = new PluginRpcHost('p', new Set(['db:create:trips']), deps);
    expect(ok(await create.dispatch(req('trips.create', { input: { title: 'Japan' } }), 42))).toBe(true);
    expect((await create.dispatch(req('trips.create', { input: { title: 'x' } }), 7) as RpcError).error.code).toBe('RESOURCE_FORBIDDEN'); // canCreateTrip false for 7
    expect((await create.dispatch(req('trips.create', { input: { title: 'x' } }), undefined) as RpcError).error.code).toBe('RESOURCE_FORBIDDEN'); // no user
    expect((await create.dispatch(req('trips.create', { input: {} }), 42) as RpcError).error.code).toBe('BAD_PARAMS'); // title required
  });

  it('daynotes.list is membership-checked (trip-scoped)', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:daynotes']), deps);
    const good = await host.dispatch(req('daynotes.list', { tripId: 1, dayId: 5 }), 42);
    expect(ok(good)).toBe(true);
    expect(deps.listDayNotes).toHaveBeenCalledWith(1, 5);
    const forbidden = await host.dispatch(req('daynotes.list', { tripId: 999, dayId: 5 }), 42);
    expect((forbidden as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('collections reads are user-scoped and need db:read:collections + a bound user', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:collections']), deps);
    expect(ok(await host.dispatch(req('collections.listMine'), 42))).toBe(true);
    const one = await host.dispatch(req('collections.get', { id: 1 }), 42);
    expect(ok(one)).toBe(true);
    expect(deps.getCollectionForUser).toHaveBeenCalledWith(42, 1);
    expect((await host.dispatch(req('collections.listMine'), undefined)).ok).toBe(false);
  });

  it('daynotes.create needs db:write:daynotes + day_edit, membership-checked, text required', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:daynotes']), deps);
    const good = await host.dispatch(req('daynotes.create', { tripId: 1, dayId: 5, input: { text: 'Pack sunscreen' } }), 42);
    expect(ok(good)).toBe(true);
    expect(deps.createDayNote).toHaveBeenCalledWith(1, 5, expect.objectContaining({ text: 'Pack sunscreen' }));
    const bad = await host.dispatch(req('daynotes.create', { tripId: 1, dayId: 5, input: { text: '  ' } }), 42);
    expect((bad as RpcError).error.code).toBe('BAD_PARAMS');
    const forbidden = await host.dispatch(req('daynotes.create', { tripId: 2, dayId: 5, input: { text: 'x' } }), 42);
    expect((forbidden as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('daynotes.delete is gated the same way (edit + membership + bound user)', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:daynotes']), deps);
    const good = await host.dispatch(req('daynotes.delete', { tripId: 1, dayId: 5, noteId: 50 }), 42);
    expect(ok(good)).toBe(true);
    expect(deps.deleteDayNote).toHaveBeenCalledWith(1, 5, 50);
    const noUser = await host.dispatch(req('daynotes.delete', { tripId: 1, dayId: 5, noteId: 50 }), undefined);
    expect((noUser as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('packing.create needs db:write:packing + packing_edit, membership-checked, name required', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:packing']), deps);
    const good = await host.dispatch(req('packing.create', { tripId: 1, input: { name: 'Socks' } }), 42);
    expect(ok(good)).toBe(true);
    expect(deps.createPackingItem).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Socks' }), 42);
    expect((await host.dispatch(req('packing.create', { tripId: 1, input: { name: '' } }), 42)).ok).toBe(false); // schema: name min 1
    expect(((await host.dispatch(req('packing.create', { tripId: 2, input: { name: 'x' } }), 42)) as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect((await host.dispatch(req('packing.create', { tripId: 1, input: { name: 'x' } }), undefined)).ok).toBe(false); // no acting user
  });

  it('packing.update/delete are gated the same way; nothing without the grant', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:packing']), deps);
    expect(ok(await host.dispatch(req('packing.update', { tripId: 1, itemId: 70, input: { checked: true } }), 42))).toBe(true);
    expect(deps.updatePackingItem).toHaveBeenCalledWith(1, 70, expect.objectContaining({ checked: true }), 42);
    expect(ok(await host.dispatch(req('packing.delete', { tripId: 1, itemId: 70 }), 42))).toBe(true);
    expect(deps.deletePackingItem).toHaveBeenCalledWith(1, 70);
    const noGrant = new PluginRpcHost('p', new Set(['db:read:packing']), deps);
    expect((await noGrant.dispatch(req('packing.create', { tripId: 1, input: { name: 'x' } }), 42)).ok).toBe(false);
  });

  it('weather.get + categories.list are tenant-free (work without a user)', async () => {
    const w = new PluginRpcHost('p', new Set(['weather:read']), deps);
    expect(ok(await w.dispatch(req('weather.get', { lat: 48, lng: 11 }), undefined))).toBe(true);
    const c = new PluginRpcHost('p', new Set(['db:read:categories']), deps);
    expect(ok(await c.dispatch(req('categories.list', {}), undefined))).toBe(true);
  });

  it('tags are the acting user\'s own; a userless context + empty name are refused', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:tags', 'db:write:tags']), deps);
    expect(ok(await host.dispatch(req('tags.list'), 42))).toBe(true);
    expect(deps.listTagsForUser).toHaveBeenCalledWith(42);
    expect(ok(await host.dispatch(req('tags.create', { input: { name: 'work' } }), 42))).toBe(true);
    expect((await host.dispatch(req('tags.list'), undefined)).ok).toBe(false);
    expect((await host.dispatch(req('tags.create', { input: { name: '' } }), 42)).ok).toBe(false);
  });

  it('trips.members + todos.list are trip-membership-gated', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:trips', 'db:read:todos']), deps);
    expect(ok(await host.dispatch(req('trips.members', { tripId: 1 }), 42))).toBe(true);
    expect(ok(await host.dispatch(req('todos.list', { tripId: 1 }), 42))).toBe(true);
    expect(((await host.dispatch(req('trips.members', { tripId: 2 }), 42)) as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('todos + packing-bags writes need the grant + edit right + a bound user', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:todos', 'db:write:packing']), deps);
    expect(ok(await host.dispatch(req('todos.create', { tripId: 1, input: { name: 'Pack' } }), 42))).toBe(true);
    expect((await host.dispatch(req('todos.create', { tripId: 1, input: { name: ' ' } }), 42)).ok).toBe(false);
    expect(((await host.dispatch(req('todos.create', { tripId: 2, input: { name: 'x' } }), 42)) as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(ok(await host.dispatch(req('packing.createBag', { tripId: 1, input: { name: 'Bag' } }), 42))).toBe(true);
    expect(ok(await host.dispatch(req('packing.setBagMembers', { tripId: 1, bagId: 80, userIds: [5, 6] }), 42))).toBe(true);
    expect(deps.setPackingBagMembers).toHaveBeenCalledWith(1, 80, [5, 6]);
    expect((await host.dispatch(req('packing.createBag', { tripId: 1, input: { name: 'Bag' } }), undefined)).ok).toBe(false);
  });

  it('atlas writes are uid-bound (code-validated, userless refused)', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:atlas']), deps);
    expect(ok(await host.dispatch(req('atlas.markCountry', { code: 'jp' }), 42))).toBe(true);
    expect(deps.markCountryVisited).toHaveBeenCalledWith(42, 'JP'); // uid host-bound, code normalized
    expect(ok(await host.dispatch(req('atlas.markRegion', { regionCode: 'JP-13', countryCode: 'JP' }), 42))).toBe(true);
    expect(ok(await host.dispatch(req('atlas.createBucketItem', { input: { name: 'Kyoto' } }), 42))).toBe(true);
    expect((await host.dispatch(req('atlas.markCountry', { code: 'JP' }), undefined)).ok).toBe(false); // no user
    expect((await host.dispatch(req('atlas.markCountry', { code: 'not-a-code-way-too-long' }), 42)).ok).toBe(false);
    expect((await host.dispatch(req('atlas.createBucketItem', { input: { name: '' } }), 42)).ok).toBe(false);
  });

  it('vacay writes validate the date and are uid-bound', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:vacay']), deps);
    expect(ok(await host.dispatch(req('vacay.toggleEntry', { date: '2026-08-01' }), 42))).toBe(true);
    expect(deps.vacayToggleEntry).toHaveBeenCalledWith(42, '2026-08-01');
    expect(ok(await host.dispatch(req('vacay.toggleCompanyHoliday', { date: '2026-12-24', note: 'Xmas' }), 42))).toBe(true);
    expect((await host.dispatch(req('vacay.toggleEntry', { date: 'tomorrow' }), 42)).ok).toBe(false);
    expect((await host.dispatch(req('vacay.toggleEntry', { date: '2026-08-01' }), undefined)).ok).toBe(false);
  });

  it('journal writes require entry_date on create and a bound user', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:journal']), deps);
    expect(ok(await host.dispatch(req('journal.createEntry', { journeyId: 3, input: { entry_date: '2026-08-01', story: 'x' } }), 42))).toBe(true);
    expect(deps.createJournalEntry).toHaveBeenCalledWith(42, 3, expect.objectContaining({ entry_date: '2026-08-01' }));
    expect((await host.dispatch(req('journal.createEntry', { journeyId: 3, input: { story: 'no date' } }), 42)).ok).toBe(false);
    expect((await host.dispatch(req('journal.updateEntry', { entryId: 120, input: {} }), undefined)).ok).toBe(false);
    expect(ok(await host.dispatch(req('journal.deleteEntry', { entryId: 120 }), 42))).toBe(true);
  });

  it('collections writes are schema-validated and uid-bound', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:collections']), deps);
    expect(ok(await host.dispatch(req('collections.create', { input: { name: 'Tokyo eats' } }), 42))).toBe(true);
    expect(deps.createCollectionForUser).toHaveBeenCalledWith(42, expect.objectContaining({ name: 'Tokyo eats' }));
    expect(ok(await host.dispatch(req('collections.deletePlace', { placeId: 7 }), 42))).toBe(true);
    expect((await host.dispatch(req('collections.create', { input: { name: 'x' } }), undefined)).ok).toBe(false);
    const noGrant = new PluginRpcHost('p', new Set(['db:read:collections']), deps);
    expect((await noGrant.dispatch(req('collections.create', { input: { name: 'x' } }), 42)).ok).toBe(false);
  });

  it('files.create validates name/content/size and is gated by file_upload', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:files']), deps);
    const good = await host.dispatch(req('files.create', { tripId: 1, input: { name: 'itinerary.pdf', content_base64: 'aGk=' } }), 42);
    expect(ok(good)).toBe(true);
    expect(deps.createTripFile).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'itinerary.pdf' }), 42);
    expect((await host.dispatch(req('files.create', { tripId: 1, input: { name: '', content_base64: 'aGk=' } }), 42)).ok).toBe(false);
    expect((await host.dispatch(req('files.create', { tripId: 1, input: { name: 'a.pdf' } }), 42)).ok).toBe(false); // no content
    expect(((await host.dispatch(req('files.create', { tripId: 2, input: { name: 'a.pdf', content_base64: 'aGk=' } }), 42)) as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect((await host.dispatch(req('files.create', { tripId: 1, input: { name: 'a.pdf', content_base64: 'aGk=' } }), undefined)).ok).toBe(false);
  });

  it('files link/update/softDelete run under file_edit / file_delete', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:files']), deps);
    expect(ok(await host.dispatch(req('files.createLink', { tripId: 1, fileId: 130, opts: { place_id: 7 } }), 42))).toBe(true);
    expect(ok(await host.dispatch(req('files.update', { tripId: 1, fileId: 130, input: { description: 'x' } }), 42))).toBe(true);
    expect(ok(await host.dispatch(req('files.softDelete', { tripId: 1, fileId: 130 }), 42))).toBe(true);
    expect(deps.canDeleteFiles).toHaveBeenCalled();
  });

  it('collab writes are gated by collab_edit and validate their inputs', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:collab']), deps);
    expect(ok(await host.dispatch(req('collab.createNote', { tripId: 1, input: { title: 'Ideas' } }), 42))).toBe(true);
    expect((await host.dispatch(req('collab.createNote', { tripId: 1, input: { title: '' } }), 42)).ok).toBe(false);
    expect(ok(await host.dispatch(req('collab.createPoll', { tripId: 1, input: { question: 'Where?', options: ['A', 'B'] } }), 42))).toBe(true);
    expect((await host.dispatch(req('collab.createPoll', { tripId: 1, input: { question: 'Where?', options: ['A'] } }), 42)).ok).toBe(false);
    expect(ok(await host.dispatch(req('collab.votePoll', { tripId: 1, pollId: 141, optionIndex: 0 }), 42))).toBe(true);
    expect(ok(await host.dispatch(req('collab.createMessage', { tripId: 1, text: 'hi' }), 42))).toBe(true);
    expect((await host.dispatch(req('collab.createMessage', { tripId: 1, text: '' }), 42)).ok).toBe(false);
    expect(((await host.dispatch(req('collab.createNote', { tripId: 2, input: { title: 'x' } }), 42)) as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('trips.addMember is its own permission (member_manage), host-bound inviter', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:members']), deps);
    const good = await host.dispatch(req('trips.addMember', { tripId: 1, userId: 6 }), 42);
    expect(ok(good)).toBe(true);
    expect(deps.addTripMember).toHaveBeenCalledWith(1, 6, 42); // inviter = HOST-bound acting user
    expect(((await host.dispatch(req('trips.addMember', { tripId: 2, userId: 6 }), 42)) as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect((await host.dispatch(req('trips.addMember', { tripId: 1, userId: 6 }), undefined)).ok).toBe(false);
    // and NOT reachable via any other write grant
    const otherGrant = new PluginRpcHost('p', new Set(['db:write:trips', 'db:write:collab']), deps);
    expect((await otherGrant.dispatch(req('trips.addMember', { tripId: 1, userId: 6 }), 42)).ok).toBe(false);
  });

  it('notify.send forces the recipient to the acting user or a member trip; admin scope refused', async () => {
    const host = new PluginRpcHost('p', new Set(['notify:send']), deps);
    expect(ok(await host.dispatch(req('notify.send', { input: { title: 'Delay', body: 'AB123 is late', scope: 'user', targetId: 42 } }), 42))).toBe(true);
    expect(deps.sendPluginNotification).toHaveBeenCalledWith('p', expect.objectContaining({ scope: 'user', targetId: 42 }));
    expect(ok(await host.dispatch(req('notify.send', { input: { title: 'Trip', body: 'x', scope: 'trip', targetId: 1 } }), 42))).toBe(true);
    // another user (scope user, foreign targetId) → forbidden
    expect(((await host.dispatch(req('notify.send', { input: { title: 't', body: 'b', scope: 'user', targetId: 99 } }), 42)) as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    // a trip the acting user isn't in → forbidden
    expect(((await host.dispatch(req('notify.send', { input: { title: 't', body: 'b', scope: 'trip', targetId: 2 } }), 42)) as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    // admin scope → bad params (not an allowed scope)
    expect((await host.dispatch(req('notify.send', { input: { title: 't', body: 'b', scope: 'admin', targetId: 0 } }), 42)).ok).toBe(false);
    // a protocol-relative / absolute link → rejected
    expect((await host.dispatch(req('notify.send', { input: { title: 't', body: 'b', scope: 'user', targetId: 42, link: '//evil.com' } }), 42)).ok).toBe(false);
    expect((await host.dispatch(req('notify.send', { input: { title: '', body: 'b', scope: 'user', targetId: 42 } }), 42)).ok).toBe(false);
  });

  it('ai.complete/extract require a configured provider + a bound user, with caps', async () => {
    const host = new PluginRpcHost('p', new Set(['ai:invoke']), deps);
    expect(ok(await host.dispatch(req('ai.complete', { prompt: 'Summarize my trip' }), 42))).toBe(true);
    expect(ok(await host.dispatch(req('ai.extract', { text: 'AB123 JFK 10:00', jsonSchema: { type: 'object' } }), 42))).toBe(true);
    expect((await host.dispatch(req('ai.complete', { prompt: '' }), 42)).ok).toBe(false);
    expect((await host.dispatch(req('ai.extract', { text: 'x', jsonSchema: 'not-an-object' }), 42)).ok).toBe(false);
    expect((await host.dispatch(req('ai.complete', { prompt: 'x'.repeat(20001) }), 42)).ok).toBe(false);
    // user 7 has no provider configured → bad params (not a crash)
    expect((await host.dispatch(req('ai.complete', { prompt: 'hi' }), 7)).ok).toBe(false);
    // no user context at all → forbidden
    expect((await host.dispatch(req('ai.complete', { prompt: 'hi' }), undefined)).ok).toBe(false);
  });

  it('settings.get returns the acting user\'s own value; a userless context yields undefined', async () => {
    // No permission required — it only ever returns THIS plugin's config for the acting user.
    const host = new PluginRpcHost('p', new Set(), deps);
    const bound = await host.dispatch(req('settings.get', { key: 'apiKey' }), 42);
    expect(ok(bound)).toBe(true);
    expect((bound as RpcResponse).result).toEqual({ value: 'secret-of-p' });
    expect(deps.getUserSetting).toHaveBeenCalledWith('p', 42, 'apiKey');
    const userless = await host.dispatch(req('settings.get', { key: 'apiKey' }), undefined);
    expect((userless as RpcResponse).result).toEqual({ value: undefined });
  });

  it('oauth.getToken needs the grant + a bound user; returns only the access token', async () => {
    const host = new PluginRpcHost('p', new Set(['oauth:client']), deps);
    const ok1 = await host.dispatch(req('oauth.getToken', {}), 42);
    expect(ok(ok1)).toBe(true);
    expect((ok1 as RpcResponse).result).toEqual({ accessToken: 'access-token-xyz' });
    expect(deps.getOAuthToken).toHaveBeenCalledWith('p', 42);
    // no bound user (a job/onLoad) → null, matching the SDK contract, not an error
    const userless = await host.dispatch(req('oauth.getToken', {}), undefined);
    expect(ok(userless)).toBe(true);
    expect((userless as RpcResponse).result).toEqual({ accessToken: null });
    // without the grant → not reachable
    const noGrant = new PluginRpcHost('p', new Set(), deps);
    expect((await noGrant.dispatch(req('oauth.getToken', {}), 42)).ok).toBe(false);
  });

  it('scheduler.set/cancel ride on jobs:run and are userless (no acting user needed)', async () => {
    const host = new PluginRpcHost('p', new Set(['jobs:run']), deps);
    // userless (no bound user) is fine — scheduled tasks are like jobs
    const set = await host.dispatch(req('scheduler.set', { name: 'poll', dueAt: 123, everyMs: 60000, payload: { x: 1 } }), undefined);
    expect(ok(set)).toBe(true);
    expect(deps.schedulerSet).toHaveBeenCalledWith('poll', 123, 60000, { x: 1 });
    const cancel = await host.dispatch(req('scheduler.cancel', { name: 'poll' }), undefined);
    expect(ok(cancel)).toBe(true);
    // without jobs:run → not reachable
    const noGrant = new PluginRpcHost('p', new Set(), deps);
    expect((await noGrant.dispatch(req('scheduler.set', { name: 'x', dueAt: 1 }), 42) as RpcError).error.code).toBe('PERMISSION_DENIED');
  });

  it('a read scope is denied without its own permission', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:trips']), deps);
    expect((await host.dispatch(req('journal.listMine'), 42)).ok).toBe(false);
    expect((await host.dispatch(req('daynotes.list', { tripId: 1, dayId: 5 }), 42)).ok).toBe(false);
  });

  it('an error thrown by a handler becomes HOST_ERROR', async () => {
    (deps.data.query as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('disk gone');
    });
    const host = new PluginRpcHost('p', new Set(['db:own']), deps);
    const res = await host.dispatch(req('db.query', { sql: 'SELECT 1', args: [] }));
    expect((res as RpcError).error.code).toBe('HOST_ERROR');
    expect((res as RpcError).error.message).toBe('disk gone');
  });

  it('a non-Error thrown by a handler still maps to HOST_ERROR', async () => {
    (deps.data.query as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw 'raw string';
    });
    const host = new PluginRpcHost('p', new Set(['db:own']), deps);
    const res = await host.dispatch(req('db.query', { sql: 'SELECT 1' }));
    expect((res as RpcError).error.code).toBe('HOST_ERROR');
    expect((res as RpcError).error.message).toBe('internal error');
  });

  it('coerces numeric string params and tolerates a missing params object', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:trips', 'db:own']), deps);
    // tripId as a string -> coerced to a number; acting user is the bound host arg
    const res = await host.dispatch(req('trips.getById', { tripId: '1' }), 42);
    expect(ok(res)).toBe(true);
    // a request with no params object at all -> BAD_PARAMS (sql missing), not a crash
    const noParams = await host.dispatch({ k: 'req', id: 'y', method: 'db.query', params: undefined });
    expect((noParams as RpcError).error.code).toBe('BAD_PARAMS');
  });

  // ── Costs (budget items): db:read:costs / db:write:costs ────────────────────

  it('db:read:costs reads a trip the acting user can access', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:costs']), deps);
    const res = await host.dispatch(req('costs.getByTrip', { tripId: 1 }), 42);
    expect(ok(res)).toBe(true);
    expect((res as RpcResponse).result).toEqual([{ id: 5, trip_id: 1, name: 'Hotel', total_price: 100 }]);
    expect(deps.listCostsForTrip).toHaveBeenCalledWith(1);
  });

  it('db:read:costs is membership-checked before the read (non-member → RESOURCE_FORBIDDEN)', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:costs']), deps);
    const res = await host.dispatch(req('costs.getByTrip', { tripId: 1 }), 99);
    expect((res as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.listCostsForTrip).not.toHaveBeenCalled();
  });

  it('costs are RESOURCE_FORBIDDEN when the Costs addon is disabled', async () => {
    (deps.budgetAddonEnabled as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const host = new PluginRpcHost('p', new Set(['db:read:costs']), deps);
    const res = await host.dispatch(req('costs.getByTrip', { tripId: 1 }), 42);
    expect((res as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.listCostsForTrip).not.toHaveBeenCalled();
  });

  it('costs.listMine returns costs across every accessible trip', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:costs']), deps);
    const res = await host.dispatch(req('costs.listMine', {}), 42);
    expect(ok(res)).toBe(true);
    expect((res as RpcResponse).result).toEqual([
      { id: 5, trip_id: 1, name: 'Hotel' },
      { id: 6, trip_id: 2, name: 'Food' },
    ]);
    expect(deps.listCostsForUser).toHaveBeenCalledWith(42);
  });

  it('costs.listMine with no bound acting user is RESOURCE_FORBIDDEN (jobs / forged calls)', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:costs']), deps);
    const res = await host.dispatch(req('costs.listMine', {}), undefined);
    expect((res as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.listCostsForUser).not.toHaveBeenCalled();
  });

  it('costs.getByTrip is PERMISSION_DENIED without db:read:costs', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:trips']), deps);
    const res = await host.dispatch(req('costs.getByTrip', { tripId: 1 }), 42);
    expect((res as RpcError).error.code).toBe('PERMISSION_DENIED');
  });

  it('db:write:costs creates a cost when the user may edit the trip', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:costs']), deps);
    const res = await host.dispatch(req('costs.create', { tripId: 1, input: { name: 'Hotel', total_price: 120 } }), 42);
    expect(ok(res)).toBe(true);
    expect((res as RpcResponse).result).toMatchObject({ id: 9, trip_id: 1, name: 'Hotel', total_price: 120 });
    expect(deps.createCost).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Hotel', total_price: 120 }));
  });

  it('db:write:costs is RESOURCE_FORBIDDEN without the budget_edit permission', async () => {
    (deps.canEditCosts as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const host = new PluginRpcHost('p', new Set(['db:write:costs']), deps);
    const res = await host.dispatch(req('costs.create', { tripId: 1, input: { name: 'Hotel' } }), 42);
    expect((res as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.createCost).not.toHaveBeenCalled();
  });

  it('db:write:costs on a trip the user cannot access is RESOURCE_FORBIDDEN', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:costs']), deps);
    const res = await host.dispatch(req('costs.create', { tripId: 1, input: { name: 'Hotel' } }), 99);
    expect((res as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.createCost).not.toHaveBeenCalled();
  });

  it('db:write:costs with an invalid payload is BAD_PARAMS', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:costs']), deps);
    // name is required (min length 1) by budgetCreateItemRequestSchema
    const res = await host.dispatch(req('costs.create', { tripId: 1, input: { total_price: 5 } }), 42);
    expect((res as RpcError).error.code).toBe('BAD_PARAMS');
    expect(deps.createCost).not.toHaveBeenCalled();
  });

  it('db:write:costs with no bound acting user is RESOURCE_FORBIDDEN', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:costs']), deps);
    const res = await host.dispatch(req('costs.create', { tripId: 1, input: { name: 'Hotel' } }), undefined);
    expect((res as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.createCost).not.toHaveBeenCalled();
  });

  it('costs.create is PERMISSION_DENIED without db:write:costs', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:costs']), deps);
    const res = await host.dispatch(req('costs.create', { tripId: 1, input: { name: 'Hotel' } }), 42);
    expect((res as RpcError).error.code).toBe('PERMISSION_DENIED');
  });

  it('db:write:costs updates a cost when the user may edit the trip', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:costs']), deps);
    const res = await host.dispatch(req('costs.update', { tripId: 1, itemId: 5, input: { name: 'Hostel' } }), 42);
    expect(ok(res)).toBe(true);
    expect((res as RpcResponse).result).toMatchObject({ id: 5, trip_id: 1, name: 'Hostel' });
    expect(deps.updateCost).toHaveBeenCalledWith(1, 5, expect.objectContaining({ name: 'Hostel' }));
  });

  it('costs.update is RESOURCE_FORBIDDEN without the budget_edit permission', async () => {
    (deps.canEditCosts as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const host = new PluginRpcHost('p', new Set(['db:write:costs']), deps);
    const res = await host.dispatch(req('costs.update', { tripId: 1, itemId: 5, input: { name: 'X' } }), 42);
    expect((res as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.updateCost).not.toHaveBeenCalled();
  });

  it('costs.update on a trip the user cannot access is RESOURCE_FORBIDDEN', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:costs']), deps);
    const res = await host.dispatch(req('costs.update', { tripId: 1, itemId: 5, input: { name: 'X' } }), 99);
    expect((res as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.updateCost).not.toHaveBeenCalled();
  });

  it('costs.update with an invalid payload is BAD_PARAMS', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:costs']), deps);
    // total_price must be a number per budgetUpdateItemRequestSchema.
    const res = await host.dispatch(req('costs.update', { tripId: 1, itemId: 5, input: { total_price: 'nope' } }), 42);
    expect((res as RpcError).error.code).toBe('BAD_PARAMS');
    expect(deps.updateCost).not.toHaveBeenCalled();
  });

  it('costs.update with no bound acting user is RESOURCE_FORBIDDEN', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:costs']), deps);
    const res = await host.dispatch(req('costs.update', { tripId: 1, itemId: 5, input: { name: 'X' } }), undefined);
    expect((res as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.updateCost).not.toHaveBeenCalled();
  });

  it('costs.update is PERMISSION_DENIED without db:write:costs', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:costs']), deps);
    const res = await host.dispatch(req('costs.update', { tripId: 1, itemId: 5, input: { name: 'X' } }), 42);
    expect((res as RpcError).error.code).toBe('PERMISSION_DENIED');
  });

  it('db:write:costs deletes a cost when the user may edit the trip', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:costs']), deps);
    const res = await host.dispatch(req('costs.delete', { tripId: 1, itemId: 5 }), 42);
    expect(ok(res)).toBe(true);
    expect((res as RpcResponse).result).toMatchObject({ deleted: true });
    expect(deps.deleteCost).toHaveBeenCalledWith(1, 5);
  });

  it('costs.delete is RESOURCE_FORBIDDEN without the budget_edit permission', async () => {
    (deps.canEditCosts as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const host = new PluginRpcHost('p', new Set(['db:write:costs']), deps);
    const res = await host.dispatch(req('costs.delete', { tripId: 1, itemId: 5 }), 42);
    expect((res as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.deleteCost).not.toHaveBeenCalled();
  });

  it('costs.delete on a trip the user cannot access is RESOURCE_FORBIDDEN', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:costs']), deps);
    const res = await host.dispatch(req('costs.delete', { tripId: 1, itemId: 5 }), 99);
    expect((res as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.deleteCost).not.toHaveBeenCalled();
  });

  it('costs.delete with no bound acting user is RESOURCE_FORBIDDEN', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:costs']), deps);
    const res = await host.dispatch(req('costs.delete', { tripId: 1, itemId: 5 }), undefined);
    expect((res as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.deleteCost).not.toHaveBeenCalled();
  });

  it('costs.delete is PERMISSION_DENIED without db:write:costs', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:costs']), deps);
    const res = await host.dispatch(req('costs.delete', { tripId: 1, itemId: 5 }), 42);
    expect((res as RpcError).error.code).toBe('PERMISSION_DENIED');
  });

  // --- Planner writes (#1429) ---
  it('db:write:places creates a place on a trip the acting user may edit', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:places']), deps);
    const res = await host.dispatch(req('places.create', { tripId: 1, input: { name: 'Fushimi Inari' } }), 42);
    expect(ok(res)).toBe(true);
    expect(deps.createPlace).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Fushimi Inari' }));
  });

  it('places.create rejects an over-long string field (mirrors the REST STRING_LIMITS)', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:places']), deps);
    const res = await host.dispatch(req('places.create', { tripId: 1, input: { name: 'A'.repeat(201) } }), 42);
    expect((res as RpcError).error.code).toBe('BAD_PARAMS');
    expect(deps.createPlace).not.toHaveBeenCalled();
  });

  it('places.create is PERMISSION_DENIED without db:write:places', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:trips']), deps);
    const res = await host.dispatch(req('places.create', { tripId: 1, input: { name: 'X' } }), 42);
    expect((res as RpcError).error.code).toBe('PERMISSION_DENIED');
  });

  it('places.create is RESOURCE_FORBIDDEN on a trip the acting user cannot edit', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:places']), deps);
    const res = await host.dispatch(req('places.create', { tripId: 2, input: { name: 'X' } }), 42);
    expect((res as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.createPlace).not.toHaveBeenCalled();
  });

  it('places.create with no bound acting user is RESOURCE_FORBIDDEN (jobs / forged calls)', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:places']), deps);
    const res = await host.dispatch(req('places.create', { tripId: 1, input: { name: 'X' } }), undefined);
    expect((res as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('places.create with an invalid payload (no name) is BAD_PARAMS', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:places']), deps);
    const res = await host.dispatch(req('places.create', { tripId: 1, input: {} }), 42);
    expect((res as RpcError).error.code).toBe('BAD_PARAMS');
    expect(deps.createPlace).not.toHaveBeenCalled();
  });

  it('db:write:itinerary assigns a place to a day (day_edit gated)', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:itinerary']), deps);
    const res = await host.dispatch(req('itinerary.assign', { tripId: 1, dayId: 3, placeId: 10 }), 42);
    expect(ok(res)).toBe(true);
    expect(deps.assignPlaceToDay).toHaveBeenCalledWith(1, 3, 10, null);
  });

  it('db:write:trips updates a trip the acting user may edit', async () => {
    const host = new PluginRpcHost('p', new Set(['db:write:trips']), deps);
    const res = await host.dispatch(req('trips.update', { tripId: 1, input: { title: 'Renamed' } }), 42);
    expect(ok(res)).toBe(true);
    expect(deps.updateTrip).toHaveBeenCalledWith(1, 42, expect.objectContaining({ title: 'Renamed' }));
  });

  // --- Plugin metadata (db:meta) ---
  it('db:meta stores and reads namespaced metadata on an accessible entity', async () => {
    const host = new PluginRpcHost('p', new Set(['db:meta']), deps);
    const set = await host.dispatch(req('meta.set', { entityType: 'trip', entityId: 1, key: 'rating', value: 5 }), 42);
    expect(ok(set)).toBe(true);
    expect(deps.metaSet).toHaveBeenCalledWith('trip', 1, 'rating', 5);
    const placeOk = await host.dispatch(req('meta.get', { entityType: 'place', entityId: 7, key: 'x' }), 42);
    expect(ok(placeOk)).toBe(true); // place 7 resolves to accessible trip 1
  });

  it('meta.set is PERMISSION_DENIED without db:meta', async () => {
    const host = new PluginRpcHost('p', new Set(['db:read:trips']), deps);
    const res = await host.dispatch(req('meta.set', { entityType: 'trip', entityId: 1, key: 'x', value: 1 }), 42);
    expect((res as RpcError).error.code).toBe('PERMISSION_DENIED');
  });

  it('meta is RESOURCE_FORBIDDEN on an entity the acting user cannot access', async () => {
    const host = new PluginRpcHost('p', new Set(['db:meta']), deps);
    const res = await host.dispatch(req('meta.set', { entityType: 'trip', entityId: 2, key: 'x', value: 1 }), 42);
    expect((res as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.metaSet).not.toHaveBeenCalled();
  });

  it('meta with an unknown entityType is BAD_PARAMS', async () => {
    const host = new PluginRpcHost('p', new Set(['db:meta']), deps);
    const res = await host.dispatch(req('meta.set', { entityType: 'user', entityId: 1, key: 'x', value: 1 }), 42);
    expect((res as RpcError).error.code).toBe('BAD_PARAMS');
  });

  it('meta writes resolve the entity edit permission per type (place→place_edit, day→day_edit) and refuse no-user', async () => {
    const host = new PluginRpcHost('p', new Set(['db:meta']), deps);
    expect(ok(await host.dispatch(req('meta.set', { entityType: 'place', entityId: 7, key: 'k', value: 1 }), 42))).toBe(true);
    expect(deps.canEditPlaces).toHaveBeenCalled();
    expect(ok(await host.dispatch(req('meta.set', { entityType: 'day', entityId: 3, key: 'k', value: 1 }), 42))).toBe(true);
    expect(deps.canEditDays).toHaveBeenCalled();
    // reservation metadata uses reservation_edit; accommodation uses day_edit
    expect(ok(await host.dispatch(req('meta.set', { entityType: 'reservation', entityId: 40, key: 'ext_id', value: 'AB1' }), 42))).toBe(true);
    expect(deps.canEditReservations).toHaveBeenCalled();
    expect(ok(await host.dispatch(req('meta.set', { entityType: 'accommodation', entityId: 11, key: 'k', value: 1 }), 42))).toBe(true);
    // an entity of another trip is refused
    expect((await host.dispatch(req('meta.get', { entityType: 'reservation', entityId: 999, key: 'k' }), 42) as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    // no host-bound acting user (a job / forged call) → refused
    const noUser = await host.dispatch(req('meta.get', { entityType: 'trip', entityId: 1, key: 'k' }), undefined);
    expect((noUser as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('meta WRITES need the entity edit permission — a read-only member is RESOURCE_FORBIDDEN', async () => {
    // Member can access the trip but not edit it (viewer role).
    (deps.canEditTrip as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const host = new PluginRpcHost('p', new Set(['db:meta']), deps);
    const write = await host.dispatch(req('meta.set', { entityType: 'trip', entityId: 1, key: 'x', value: 1 }), 42);
    expect((write as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
    expect(deps.metaSet).not.toHaveBeenCalled();
    // …but a READ is only access-gated, so it still works.
    const read = await host.dispatch(req('meta.get', { entityType: 'trip', entityId: 1, key: 'x' }), 42);
    expect(ok(read)).toBe(true);
    expect(deps.metaGet).toHaveBeenCalled();
  });
});
