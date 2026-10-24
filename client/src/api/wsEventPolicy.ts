import type { TrekWsEventName } from '@trek/shared'

/**
 * Client-side handling policy for every event in the shared WS registry
 * (`TREK_WS_EVENTS` in @trek/shared). Together with the tripStore lookups
 * (DEXIE_WRITERS / STATE_APPLIERS in store/slices/remoteEventHandler.ts),
 * these lists partition the registry exactly — the registry-parity test
 * fails if a registry event is missing from all of them, or listed twice.
 * A new server event therefore forces an explicit client decision (handle
 * it, or add it here) instead of being dropped by a silent `default:`.
 */

/**
 * Events consumed by dedicated listeners outside the tripStore reducer.
 * Every entry names real handling code — if that code is removed, remove
 * the entry (the event then needs a new home or an IGNORED_WS_EVENTS slot).
 */
export const HANDLED_OUTSIDE_TRIP_STORE = [
  // Tours facet invalidation — hooks/useTripWebSocket forwards tours:changed to
  // useTourPlaceIds so the active trip refreshes its Tours/Places read model.
  'tours:changed',
  // CW-03: store/tourVisitStore (watchTourVisits) keeps the visits store current.
  'tours:visits',
  // Collab — Collab/MCollab components + useTripWebSocket's collabFileSync
  'collab:note:created',
  'collab:note:updated',
  'collab:note:deleted',
  'collab:link:created',
  'collab:link:updated',
  'collab:link:deleted',
  'collab:poll:created',
  'collab:poll:voted',
  'collab:poll:closed',
  'collab:poll:deleted',
  'collab:message:created',
  'collab:message:reacted',
  'collab:message:deleted',
  // Road trip shaping — components/Roadtrip/useRoadtripVias. The points a drive is
  // routed through live in that hook and nowhere else; a store slice for them would be a
  // second copy of the same list to keep in step.
  'roadtripVia:changed',
  'roadtripTrack:changed',
  'roadtripPreferences:changed',
  // components/Roadtrip/useDayBoundaries reloads the shared boundaries.
  'roadtripBoundary:changed',
  // In-app notifications: hooks/useInAppNotificationListener, which also keeps
  // the bell's unread count in step (inAppNotificationStore).
  'notification:new',
  'notification:updated',
  'notification:read-all',
  // The same app-wide listener reads the display settings (settingsStore) and the
  // tags (tripStore.reloadTags) again; both events carry names, never values.
  'settings:updated',
  'tags:changed',
  // pages/dashboard/useDashboard reads the trip list again (desktop and phone).
  'trips:changed',
  // pages/atlas/useAtlas reads the atlas again (desktop and phone).
  'atlas:changed',
  // Trip roster: pages/tripPlanner/useTripRosterSync and the desktop packing panel
  // (components/Packing/usePackingListPanel) read the members again. member:removed
  // (it may be this user leaving the trip) and member:updated (a guest's new name on
  // the rows that list people) are applied in the store and read back by the same
  // hooks; both also move the balances below.
  'member:added',
  // Balances: components/Budget/useCostsLedger reads the settlement again on
  // these and on the budget item events that move a split.
  'budget:settlement-created',
  'budget:settlement-updated',
  'budget:settlement-deleted',
  // Bags and who looks after a category: components/Packing/useBagTotalsPing and
  // usePackingCategoryAssignees read them again, for both packing lists.
  'packing:bag-created',
  'packing:bag-updated',
  'packing:bag-deleted',
  'packing:bag-members-updated',
  'packing:assignees',
  // Bag weights (#2191) — content-free ping; components/Packing/usePackingListPanel
  // and mobile/screens/trip/tabs/MPackingListTab re-read the bags on it. It carries
  // no state to apply, which is the point: the totals are summed server-side across
  // members whose items this client may not see.
  'packing:bag-totals',
  // Collections — pages/collections/useCollections ('collections:' prefix listener)
  'collections:updated',
  'collections:accepted',
  'collections:declined',
  'collections:left',
  'collections:deleted',
  'collections:cancelled',
  'collections:removed',
  'collections:invite',
  // Vacay — pages/vacay/useVacay
  'vacay:update',
  'vacay:settings',
  'vacay:accepted',
  'vacay:declined',
  'vacay:cancelled',
  'vacay:dissolved',
  'vacay:invite',
  'vacay:share',
  'vacay:share-removed',
  'vacay:shared-update',
  // Journey — pages/journeyDetail/useJourneyDetail ('journey:' prefix listener)
  // reads the open journey again, and leaves it once journey:deleted says it is gone.
  // The journey list (pages/journey/useJourney) reads itself again on those two.
  'journey:updated',
  'journey:deleted',
  'journey:trip:synced',
  'journey:entry:created',
  'journey:entry:updated',
  'journey:entry:deleted',
  'journey:entries:reordered',
  'journey:contributor:changed',
  // Capture times landed after a photo import (#1587); the same listener reloads
  // the journey so the gallery re-sorts.
  'journey:photos:updated',
  // A day's recorded route was taken over or removed (JRN-01):
  // components/Journey/useJourneyRecordings reads the kept days again.
  'journey:recording:updated',
  // Studio book — components/Studio/useBookStore (its own listener: a client
  // with nothing outstanding takes the new version, one with unsaved edits
  // deliberately does not and conflicts on its next save instead)
  'journey:book:saved',
  // Studio presence — components/Studio/useBookPresence (its own listener:
  // who has the book open, and where their pointers are)
  'journey:book:peers',
  'journey:book:cursor',
  // Document sync: components/Files/docsync/useDocSync re-reads the bindings
  // and their counts, and components/Files/docsync/useDocSyncOffered asks
  // again whether the Files screen offers the sync button. Content-free like
  // the bag ping: what a run changed is per-binding server state, and the
  // files it moved arrive as file:* events.
  'docsync:changed',
  // Linked journal: components/Trips/useTripJournalLink asks again which journal
  // the trip shows and who it is open to. Content-free, because that answer is
  // per person (a member left off the link must not learn its title).
  'trip:journal:changed',
  // Booking import — BackgroundTasks/BackgroundTasksWidget ('import:' prefix listener)
  'import:progress',
  'import:done',
  'import:error',
  // Stays live in page-local planner state, not in the trip store. A stay
  // written elsewhere (the assistant, a fellow traveller, a plugin, a booking
  // import) goes remoteEventHandler (STAY_REFRESH_EVENTS) -> accommodations:refresh
  // -> components/Planner/useStaysRefresh, which reloads them once per burst in
  // pages/tripPlanner/useTripPlanner (sidebar, map, the phone's day sheet) and
  // components/Planner/useDayDetail (the desktop day panel).
  'accommodation:created',
  'accommodation:updated',
  'accommodation:deleted',
] as const satisfies readonly TrekWsEventName[]

/**
 * Events the client deliberately does not act on, each with the reason. Removing
 * an entry means the event is now handled somewhere; ADDING one is a product
 * decision that a server event should have no client reaction, never a way to
 * silence the registry-parity test, which pins these keys to a list that only
 * shrinks.
 */
export const IGNORED_WS_EVENTS: Partial<Record<TrekWsEventName, string>> = {
  'todo:assignees':
    'No screen shows who looks after a todo category (todoApi.getCategoryAssignees has no caller), so there is nothing to refresh.',
}

/**
 * Events registered ahead of the write that sends them. The broadcast parity
 * work gave every one of them a handler, so the list is empty; it stays as the
 * place a future event registered before its sender goes, and only shrinks.
 */
export const AWAITING_SENDER_WS_EVENTS: readonly TrekWsEventName[] = []
