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
  // Collab — Collab/MCollab components + useTripWebSocket's collabFileSync
  'collab:note:created',
  'collab:note:updated',
  'collab:note:deleted',
  'collab:poll:created',
  'collab:poll:voted',
  'collab:poll:closed',
  'collab:poll:deleted',
  'collab:message:created',
  'collab:message:reacted',
  'collab:message:deleted',
  // In-app notifications — hooks/useInAppNotificationListener
  'notification:new',
  'notification:updated',
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
  'journey:trip:synced',
  'journey:entry:created',
  'journey:entry:updated',
  'journey:entry:deleted',
  'journey:entries:reordered',
  'journey:contributor:changed',
  // Studio book — components/Studio/useBookStore (its own listener: a client
  // with nothing outstanding takes the new version, one with unsaved edits
  // deliberately does not and conflicts on its next save instead)
  'journey:book:saved',
  // Studio presence — components/Studio/useBookPresence (its own listener:
  // who has the book open, and where their pointers are)
  'journey:book:peers',
  'journey:book:cursor',
  // Booking import — BackgroundTasks/BackgroundTasksWidget ('import:' prefix listener)
  'import:progress',
  'import:done',
  'import:error',
] as const satisfies readonly TrekWsEventName[]

/**
 * Events the client deliberately does not act on today (state of the world
 * when the registry landed — every one of these was already dropped by the
 * old silent `default:` branches). Removing an entry means the event is now
 * handled somewhere; ADDING an entry is a product decision that a new server
 * event should have no client reaction — never add one just to silence the
 * registry-parity test.
 */
export const IGNORED_WS_EVENTS = [
  'assignment:participants',
  'packing:reordered',
  'packing:bag-created',
  'packing:bag-updated',
  'packing:bag-deleted',
  'packing:bag-members-updated',
  'packing:assignees',
  'packing:template-applied',
  'todo:assignees',
  'budget:settlement-created',
  'budget:settlement-updated',
  'budget:settlement-deleted',
  'reservation:positions',
  // Accommodations live in page-local planner state; the client refetches
  // them off trip:updated date changes, never off these events.
  'accommodation:created',
  'accommodation:updated',
  'accommodation:deleted',
  'trip:deleted',
  'member:added',
  'member:removed',
] as const satisfies readonly TrekWsEventName[]
