import { z } from 'zod';

/**
 * WS event contract registry — the single source of truth for every realtime
 * event TREK broadcasts (roadmap: "Tokenization & registries", paired with the
 * server's injectable RealtimeService facade).
 *
 * Wire envelopes (see server/src/websocket.ts):
 * - Trip-scoped (`scope: 'trip'`, sent via `broadcast`): the transport wraps
 *   the payload as `{ type: <event name>, tripId, ...payload }` — `tripId` is
 *   always injected by the transport and is NOT part of the payload schema.
 * - User-scoped (`scope: 'user'`, sent via `broadcastToUser`): the payload is
 *   sent verbatim and carries its own `type: <event name>` discriminator; the
 *   schemas below describe the fields BESIDES `type`.
 * - MCP-originated broadcasts add a `_source: 'mcp'` marker key to the payload
 *   (server/src/mcp/tools/_shared.ts). Zod object schemas strip unknown keys,
 *   so it needs no per-event modeling.
 *
 * Deliberately NOT in the registry:
 * - The dynamic plugin namespace: trip broadcasts force-namespaced to
 *   `plugin:<pluginId>:<event>` and user messages typed `plugin:<pluginId>`
 *   (plugin-host-deps.factory.ts). Names and payloads are plugin-chosen; the
 *   `plugin:` prefix is the reserved escape hatch (see the template-literal
 *   types below) and registry names must never collide with it.
 * - Transport control frames sent directly over the socket, not through
 *   broadcast: `welcome`, `joined`, `left`, `error` (server→client) and
 *   `join`, `leave` (client→server). They belong to the transport, which is
 *   deliberately-late roadmap work.
 *
 * Payload schemas are transcribed from the actual server call sites (server
 * shape wins over client expectations — parity). Entity rows are `z.unknown()`
 * scaffolding on purpose: the key structure and event names are the contract
 * being pinned here; row shapes belong to their domain schemas and tighten
 * opportunistically. Where the same event is emitted with divergent shapes
 * today, the schema is the union of the real shapes and the divergence is
 * flagged with a DRIFT comment — do not "fix" a drift here without fixing the
 * emitting call site first.
 */

/** An entity row whose shape is owned by its domain schema (scaffolding). */
const entity = z.unknown();
/** Ids cross the wire as numbers or numeric strings depending on the emitting route. */
const id = z.union([z.number(), z.string()]);
const idList = z.array(id);
/**
 * A "something changed, refetch" ping — no declared payload fields. Loose on
 * purpose (zod v4 infers a plain `z.object({})` as `Record<string, never>`,
 * which would make `{ type } & payload` unsatisfiable for user-scoped events
 * whose wire payload is exactly `{ type }`).
 */
const empty = z.looseObject({});

export interface TrekWsEventContract {
  scope: 'trip' | 'user';
  payload: z.ZodType;
}

export const TREK_WS_EVENTS = {
  // ── Places ────────────────────────────────────────────────────────────────
  'place:created': { scope: 'trip', payload: z.object({ place: entity }) },
  'place:updated': { scope: 'trip', payload: z.object({ place: entity }) },
  'place:deleted': { scope: 'trip', payload: z.object({ placeId: id }) },

  // ── Assignments ──────────────────────────────────────────────────────────
  'assignment:created': { scope: 'trip', payload: z.object({ assignment: entity }) },
  'assignment:updated': { scope: 'trip', payload: z.object({ assignment: entity }) },
  'assignment:deleted': { scope: 'trip', payload: z.object({ assignmentId: id, dayId: id }) },
  // (MCP drift fixed 2026-07-29: move_assignment now includes newDayId and
  // reorder_day_assignments sends orderedIds, matching REST.)
  'assignment:moved': {
    scope: 'trip',
    payload: z.object({ assignment: entity, oldDayId: id, newDayId: id }),
  },
  'assignment:reordered': {
    scope: 'trip',
    payload: z.object({ dayId: id, orderedIds: idList }),
  },
  'assignment:participants': {
    scope: 'trip',
    payload: z.object({ assignmentId: id, participants: z.array(z.unknown()) }),
  },

  // ── Days ─────────────────────────────────────────────────────────────────
  'day:created': { scope: 'trip', payload: z.object({ day: entity }) },
  'day:updated': { scope: 'trip', payload: z.object({ day: entity }) },
  // (MCP drift fixed 2026-07-29: delete_day now sends { dayId }, matching REST.)
  'day:deleted': { scope: 'trip', payload: z.object({ dayId: id }) },
  // Two legitimate shapes: a plain reorder sends { orderedIds }; the
  // insert-at-position create path re-uses the event with { day }.
  'day:reordered': {
    scope: 'trip',
    payload: z.union([z.object({ orderedIds: idList }), z.object({ day: entity })]),
  },

  // ── Day notes ────────────────────────────────────────────────────────────
  'dayNote:created': { scope: 'trip', payload: z.object({ dayId: id, note: entity }) },
  'dayNote:updated': { scope: 'trip', payload: z.object({ dayId: id, note: entity }) },
  'dayNote:deleted': { scope: 'trip', payload: z.object({ noteId: id, dayId: id }) },

  // ── Packing ──────────────────────────────────────────────────────────────
  'packing:created': { scope: 'trip', payload: z.object({ item: entity }) },
  'packing:updated': { scope: 'trip', payload: z.object({ item: entity }) },
  'packing:deleted': { scope: 'trip', payload: z.object({ itemId: id }) },
  'packing:reordered': { scope: 'trip', payload: z.object({ orderedIds: idList }) },
  'packing:bag-created': { scope: 'trip', payload: z.object({ bag: entity }) },
  'packing:bag-updated': { scope: 'trip', payload: z.object({ bag: entity }) },
  'packing:bag-deleted': { scope: 'trip', payload: z.object({ bagId: id }) },
  'packing:bag-members-updated': {
    scope: 'trip',
    payload: z.object({ bagId: id, members: z.array(z.unknown()) }),
  },
  'packing:assignees': {
    scope: 'trip',
    payload: z.object({ category: z.string(), assignees: z.array(z.unknown()) }),
  },
  'packing:template-applied': { scope: 'trip', payload: z.object({ items: z.array(z.unknown()) }) },

  // ── Todo ─────────────────────────────────────────────────────────────────
  'todo:created': { scope: 'trip', payload: z.object({ item: entity }) },
  'todo:updated': { scope: 'trip', payload: z.object({ item: entity }) },
  'todo:deleted': { scope: 'trip', payload: z.object({ itemId: id }) },
  'todo:assignees': {
    scope: 'trip',
    payload: z.object({ category: z.string(), assignees: z.array(z.unknown()) }),
  },

  // ── Budget ───────────────────────────────────────────────────────────────
  'budget:created': { scope: 'trip', payload: z.object({ item: entity }) },
  'budget:updated': { scope: 'trip', payload: z.object({ item: entity }) },
  'budget:deleted': { scope: 'trip', payload: z.object({ itemId: id }) },
  // Intentional union: item reorder vs category reorder (the client handles both).
  'budget:reordered': {
    scope: 'trip',
    payload: z.union([z.object({ orderedIds: idList }), z.object({ orderedCategories: z.array(z.string()) })]),
  },
  'budget:members-updated': {
    scope: 'trip',
    payload: z.object({ itemId: id, members: z.array(z.unknown()), persons: z.unknown() }),
  },
  'budget:member-paid-updated': {
    scope: 'trip',
    payload: z.object({ itemId: id, userId: id, paid: z.unknown() }),
  },
  'budget:settlement-created': { scope: 'trip', payload: z.object({ settlement: entity }) },
  'budget:settlement-updated': { scope: 'trip', payload: z.object({ settlement: entity }) },
  'budget:settlement-deleted': { scope: 'trip', payload: z.object({ settlementId: id }) },

  // ── Reservations ─────────────────────────────────────────────────────────
  // DRIFT: the accommodation cascade paths emit an empty refetch ping `{}`;
  // the client reads payload.reservation.id unguarded on the `{}` variant.
  'reservation:created': {
    scope: 'trip',
    payload: z.union([z.object({ reservation: entity }), empty]),
  },
  'reservation:updated': {
    scope: 'trip',
    payload: z.union([z.object({ reservation: entity }), empty]),
  },
  'reservation:deleted': { scope: 'trip', payload: z.object({ reservationId: id }) },
  // DRIFT: REST sends { positions, day_id }; the MCP tool sends { positions, dayId }.
  'reservation:positions': {
    scope: 'trip',
    payload: z.union([
      z.object({ positions: z.array(z.unknown()), day_id: id.nullish() }),
      z.object({ positions: z.array(z.unknown()), dayId: id.nullish() }),
    ]),
  },
  'reservation:travelers-updated': {
    scope: 'trip',
    payload: z.object({ reservationId: id, travelers: z.array(z.unknown()) }),
  },

  // ── Accommodations ───────────────────────────────────────────────────────
  // DRIFT: `{ accommodation }` vs empty refetch ping `{}` (reservation cascade
  // paths); the client handles neither event today (refetches off trip:updated).
  'accommodation:created': {
    scope: 'trip',
    payload: z.union([z.object({ accommodation: entity }), empty]),
  },
  'accommodation:updated': {
    scope: 'trip',
    payload: z.union([z.object({ accommodation: entity }), empty]),
  },
  // DRIFT: { accommodationId } vs `{}` vs the MCP day-clear path's
  // { id, linkedReservationId } (days.mcp.ts).
  'accommodation:deleted': {
    scope: 'trip',
    payload: z.union([z.object({ accommodationId: id }), z.object({ id, linkedReservationId: id.nullish() }), empty]),
  },

  // ── Trip / members ───────────────────────────────────────────────────────
  'trip:updated': { scope: 'trip', payload: z.object({ trip: entity }) },
  // Note the key is `id`, not `tripId` (the transport injects tripId anyway).
  'trip:deleted': { scope: 'trip', payload: z.object({ id }) },
  'member:added': { scope: 'trip', payload: z.object({ member: entity }) },
  'member:removed': { scope: 'trip', payload: z.object({ userId: id }) },

  // ── Files ────────────────────────────────────────────────────────────────
  'file:created': { scope: 'trip', payload: z.object({ file: entity }) },
  'file:updated': { scope: 'trip', payload: z.object({ file: entity }) },
  'file:deleted': { scope: 'trip', payload: z.object({ fileId: id }) },

  // ── Collab ───────────────────────────────────────────────────────────────
  'collab:note:created': { scope: 'trip', payload: z.object({ note: entity }) },
  'collab:note:updated': { scope: 'trip', payload: z.object({ note: entity }) },
  'collab:note:deleted': { scope: 'trip', payload: z.object({ noteId: id }) },
  'collab:poll:created': { scope: 'trip', payload: z.object({ poll: entity }) },
  'collab:poll:voted': { scope: 'trip', payload: z.object({ poll: entity }) },
  'collab:poll:closed': { scope: 'trip', payload: z.object({ poll: entity }) },
  'collab:poll:deleted': { scope: 'trip', payload: z.object({ pollId: id }) },
  'collab:message:created': { scope: 'trip', payload: z.object({ message: entity }) },
  'collab:message:reacted': {
    scope: 'trip',
    payload: z.object({ messageId: id, reactions: z.unknown() }),
  },
  'collab:message:deleted': {
    scope: 'trip',
    payload: z.object({ messageId: id, username: z.string().nullish() }),
  },

  // ── Memories ─────────────────────────────────────────────────────────────
  'memories:updated': { scope: 'trip', payload: z.object({ userId: id }) },

  // ── Notifications (user-scoped) ──────────────────────────────────────────
  'notification:new': { scope: 'user', payload: z.object({ notification: entity }) },
  'notification:updated': { scope: 'user', payload: z.object({ notification: entity }) },

  // ── Collections (user-scoped) ────────────────────────────────────────────
  'collections:updated': { scope: 'user', payload: z.object({ collectionId: id }) },
  'collections:accepted': { scope: 'user', payload: z.object({ collectionId: id }) },
  'collections:declined': { scope: 'user', payload: z.object({ collectionId: id }) },
  'collections:left': { scope: 'user', payload: z.object({ collectionId: id }) },
  'collections:deleted': { scope: 'user', payload: z.object({ collectionId: id }) },
  'collections:cancelled': { scope: 'user', payload: z.object({ collectionId: id }) },
  'collections:removed': { scope: 'user', payload: z.object({ collectionId: id }) },
  'collections:invite': {
    scope: 'user',
    payload: z.object({ from: z.object({ id, username: z.string() }), collectionId: id }),
  },

  // ── Vacay (user-scoped) ──────────────────────────────────────────────────
  'vacay:update': { scope: 'user', payload: empty },
  'vacay:settings': { scope: 'user', payload: empty },
  'vacay:accepted': { scope: 'user', payload: empty },
  'vacay:declined': { scope: 'user', payload: empty },
  'vacay:cancelled': { scope: 'user', payload: empty },
  'vacay:dissolved': { scope: 'user', payload: empty },
  'vacay:invite': {
    scope: 'user',
    payload: z.object({ from: z.object({ id, username: z.string() }), planId: id }),
  },
  'vacay:share': { scope: 'user', payload: z.object({ from: z.object({ id }) }) },
  'vacay:share-removed': { scope: 'user', payload: empty },
  'vacay:shared-update': { scope: 'user', payload: empty },

  // ── Journey (user-scoped; broadcastJourneyEvent injects journeyId) ──────
  'journey:trip:synced': { scope: 'user', payload: z.object({ journeyId: id, tripId: id }) },
  'journey:entry:created': { scope: 'user', payload: z.object({ journeyId: id, entry: entity }) },
  // DRIFT: the soft-delete path emits { journeyId, entryId } under :updated
  // instead of { journeyId, entry } (journeyService.ts).
  'journey:entry:updated': {
    scope: 'user',
    payload: z.union([z.object({ journeyId: id, entry: entity }), z.object({ journeyId: id, entryId: id })]),
  },
  'journey:entry:deleted': { scope: 'user', payload: z.object({ journeyId: id, entryId: id }) },
  'journey:entries:reordered': {
    scope: 'user',
    payload: z.object({ journeyId: id, orderedIds: idList }),
  },
  'journey:contributor:changed': {
    scope: 'user',
    payload: z.object({ journeyId: id, targetUserId: id, role: z.unknown() }),
  },

  /*
   * The Studio book was saved (#1973).
   *
   * Carries the new version rather than the document. Everyone with the book
   * open needs to know theirs is behind — which is one integer — and the ones
   * who care can ask for the document. Pushing a few hundred kilobytes of JSON
   * to every contributor on every autosave would be a broadcast the size of the
   * thing being edited.
   */
  'journey:book:saved': {
    scope: 'user',
    payload: z.object({ journeyId: id, version: z.number(), savedBy: id }),
  },

  /**
   * Who else has this book open.
   *
   * Sent to everyone in the book whenever the set changes — someone arrives,
   * someone leaves, someone's tab dies. The whole list rather than a delta,
   * because it is a handful of names and a delta protocol would need an
   * ordering guarantee to be worth anything.
   */
  'journey:book:peers': {
    scope: 'user',
    payload: z.object({
      journeyId: id,
      peers: z.array(
        z.object({
          socketId: z.number(),
          userId: id,
          username: z.string(),
          avatar: z.string().nullable().optional(),
        }),
      ),
    }),
  },

  /**
   * Where somebody's pointer is.
   *
   * In millimetres on the spread, not pixels on a screen: the two people
   * looking at a book are at different zoom levels on different monitors, and a
   * pixel means nothing to the other one. `spreadIndex` is there so a pointer
   * on page 40 is not drawn on page 2.
   *
   * `null` coordinates mean the pointer left the page — the arrow goes away,
   * and the person stays in the list.
   */
  'journey:book:cursor': {
    scope: 'user',
    payload: z.object({
      journeyId: id,
      socketId: z.number(),
      userId: id,
      spreadIndex: z.number().int().min(0),
      x: z.number().nullable(),
      y: z.number().nullable(),
    }),
  },

  // ── Booking import (user-scoped; push() injects jobId + tripId) ─────────
  'import:progress': {
    scope: 'user',
    payload: z.object({
      jobId: z.string(),
      tripId: id.nullish(),
      status: z.string(),
      done: z.number(),
      total: z.number(),
      fileName: z.string().optional(),
    }),
  },
  'import:done': {
    scope: 'user',
    payload: z.object({ jobId: z.string(), tripId: id.nullish(), result: z.unknown() }),
  },
  'import:error': {
    scope: 'user',
    payload: z.object({ jobId: z.string(), tripId: id.nullish(), message: z.string() }),
  },
} as const satisfies Record<string, TrekWsEventContract>;

/** Every registered event name. The registry above is the count; this derives from it. */
export type TrekWsEventName = keyof typeof TREK_WS_EVENTS;

/** Names broadcast to a trip room (`{ type, tripId, ...payload }` envelope). */
export type TrekWsTripEventName = {
  [K in TrekWsEventName]: (typeof TREK_WS_EVENTS)[K]['scope'] extends 'trip' ? K : never;
}[TrekWsEventName];

/** Names sent to a single user's sockets (payload carries `type` itself). */
export type TrekWsUserEventName = {
  [K in TrekWsEventName]: (typeof TREK_WS_EVENTS)[K]['scope'] extends 'user' ? K : never;
}[TrekWsEventName];

/** The payload contract for one event (the part beside type/tripId on the wire). */
export type TrekWsPayload<E extends TrekWsEventName> = z.infer<(typeof TREK_WS_EVENTS)[E]['payload']>;

/**
 * The reserved plugin escape hatch: trip broadcasts are force-namespaced to
 * `plugin:<pluginId>:<event>` and user-scoped plugin messages are typed
 * `plugin:<pluginId>` by the host — names and payloads are plugin-chosen and
 * deliberately outside the registry.
 */
export type TrekWsPluginEventName = `plugin:${string}`;

/** All registered names, for runtime enumeration (client ratchet, audits). */
export const TREK_WS_EVENT_NAMES = Object.keys(TREK_WS_EVENTS) as TrekWsEventName[];

/** Trip-scoped subset of {@link TREK_WS_EVENT_NAMES}. */
export const TREK_WS_TRIP_EVENT_NAMES = TREK_WS_EVENT_NAMES.filter(
  (name) => TREK_WS_EVENTS[name].scope === 'trip',
) as TrekWsTripEventName[];

/** User-scoped subset of {@link TREK_WS_EVENT_NAMES}. */
export const TREK_WS_USER_EVENT_NAMES = TREK_WS_EVENT_NAMES.filter(
  (name) => TREK_WS_EVENTS[name].scope === 'user',
) as TrekWsUserEventName[];

// Compile-time lockstep: the trip/user unions must partition the full name
// union exactly — fails `tsc` if a scope literal widens or a name lands in
// neither bucket (same pattern as the MCP access-group gate).
type AssertExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
export const TREK_WS_SCOPES_PARTITION_EVENT_NAMES: AssertExact<
  TrekWsTripEventName | TrekWsUserEventName,
  TrekWsEventName
> = true;
