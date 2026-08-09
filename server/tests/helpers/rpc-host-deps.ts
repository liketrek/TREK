import { vi } from 'vitest';
import type { HostDeps } from '../../src/nest/plugins/host/rpc-host';
import { TagsRpc } from '../../src/nest/tags/tags.rpc';
import type { TagsService } from '../../src/nest/tags/tags.service';

/**
 * The stubbed HostDeps every plugin router test builds on. It used to live inside
 * rpc-host.test.ts; it moved here so the coverage ledger test can construct the same
 * host without duplicating 150 lines of stubs.
 *
 * The fixture encodes one access story throughout: user 42 may access and edit trip 1,
 * and nothing else. Tests rely on that, so widen it only with care.
 */
export function makeDeps(): HostDeps {
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

/**
 * Every @PluginController() class that owns wire methods, in the order the container
 * would discover them. It grows by one entry per rollout PR, and the coverage ledger
 * test (tests/unit/plugins/rpc-coverage.test.ts) is what turns a forgotten entry into
 * a red build instead of a silent PERMISSION_DENIED in production.
 *
 * The services handed in are stubs: the ledger only binds the handlers, it never runs
 * them. Behaviour is asserted in each domain's own <domain>.rpc.test.ts.
 */
export function allRpcControllers(): object[] {
  const tags = {
    list: vi.fn(() => []),
    getByIdAndUser: vi.fn(() => undefined),
    create: vi.fn(() => ({})),
    update: vi.fn(() => ({})),
    remove: vi.fn(),
  } as unknown as TagsService;
  return [new TagsRpc(tags)];
}
