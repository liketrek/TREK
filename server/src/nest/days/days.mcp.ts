import {
  McpController, Tool, ResourceTemplate, type McpContext,
  TOOL_ANNOTATIONS_WRITE, TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, errorResult, ok,
} from '../../nest-mcp';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import {
  DAY_CREATE_DATED_CONFLICT, dayCreateRequestSchema, dayReorderRequestSchema, dayUpdateRequestSchema,
} from '@trek/shared';
import type { DayCreateRequest, DayReorderRequest, DayUpdateRequest } from '@trek/shared';
import { DaysService, DayReorderError, DayAppendError, type DatedDayAppend, type DaySender } from './days.service';
import { DayRemovalService, DayDeleteError, type DayRemoval } from './day-removal.service';
import type { MirrorSender } from '../accommodations/accommodations.service';

function parseId(value: string | string[]): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Day MCP surface — ported 1:1 from the legacy registrars: the seven tools of
 * src/mcp/tools/days.ts and the trek://trips/{tripId}/days resource from src/mcp/resources.ts
 * (identical names, descriptions, schemas, annotations, error/payload shapes
 * and broadcasts). The legacy registration-time gates map to the declarative
 * trips write/read access markers (registerDayTools' whole-registrar
 * `canWrite(scopes, 'trips')` early return and the resources' canReadTrips
 * checks, resolved by trekMcpAccessPolicy — note canReadTrips also accepted
 * trips:delete / trips:share-only tokens; the declarative read marker is
 * marginally narrower for those, same trade day-notes made). No addon gate —
 * days are core.
 *
 * reorder_days, create_day's `position` and update_day's `notes` sit outside
 * that port: the REST controller has carried all three since #589, and until
 * they landed here a model could append and rename days but not move one, slot
 * one in mid-trip, or write a day's notes.
 */
@McpController()
export class DaysMcp {
  constructor(
    private readonly days: DaysService,
    private readonly auth: AuthService,
    private readonly guards: McpToolGuardsService,
    private readonly removal: DayRemovalService,
  ) {}

  @Tool({
    name: 'update_day',
    description: 'Set the title and/or the notes of a day in a trip (e.g. "Arrival in Paris", "Free day"). An omitted field keeps its current value, so the title and the notes can be changed independently.',
    inputSchema: {
      tripId: z.number().int().positive(),
      dayId: z.number().int().positive(),
      // The shared contract leaves title unbounded, as the raw-body route it
      // replaced did; the tool keeps the cap it was ported with so a model
      // cannot park a paragraph in a day header.
      title: z.string().max(200).nullable().optional().describe('Day title, or null to clear it'),
      notes: dayUpdateRequestSchema.shape.notes.describe('Free-text notes for the day; an empty string clears them'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'trips', mode: 'write' },
  })
  async updateDay(
    { tripId, dayId, ...fields }: { tripId: number; dayId: number } & DayUpdateRequest,
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.days.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    const current = this.days.getDay(dayId, tripId);
    if (!current) return errorResult('Day not found.');
    // The rest spread carries only the keys the caller actually sent, which is
    // what update()'s presence sentinels need: naming the two fields here would
    // hand it an undefined notes on a title-only call and wipe the day's notes.
    const updated = this.days.update(dayId, current, fields);
    this.guards.safeBroadcast(tripId, 'day:updated', { day: updated });
    return ok({ day: updated });
  }

  @Tool({
    name: 'create_day',
    description: 'Add a day to a trip. Without `position` the day is appended at the end, optionally with a date and notes. With `position` an empty day is slotted in at that place instead, which is the way to add a day in the middle of an itinerary that already has days. With `dated` the trip grows by the calendar day after its last date: the new day gets that date and goes right behind the last dated day, and the end date of the trip moves to it, while `position` re-dates the days after the slot it fills.',
    inputSchema: {
      tripId: z.number().int().positive(),
      date: dayCreateRequestSchema.shape.date.describe('ISO date string YYYY-MM-DD, optional for dateless trips'),
      notes: dayCreateRequestSchema.shape.notes,
      position: dayCreateRequestSchema.shape.position.describe('1-based slot to insert an empty day at; omit to append at the end. On a dated trip the days keep their calendar slots, so the trip gains one day at its end and bookings move with the day they sit on. date and notes are ignored when this is set, as on the REST route.'),
      dated: dayCreateRequestSchema.shape.dated.describe('Append the calendar day after the last date of the trip and extend the trip by one day. Days without a date stay undated and move one place back. Cannot be combined with position or date. Only for trips with dates.'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'trips', mode: 'write' },
  })
  async createDay(
    { tripId, date, notes, position, dated }: { tripId: number } & DayCreateRequest,
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.days.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    if (dated) return this.appendDated(tripId, notes, date, position, ctx);
    if (position === undefined) {
      const day = this.days.create(tripId, date, notes);
      this.guards.safeBroadcast(tripId, 'day:created', { day });
      return ok({ day });
    }
    try {
      const day = this.days.insert(tripId, position);
      // An insert renumbers and re-dates every later day, so collaborators get
      // the list-wide event and refetch, the same one the REST create route sends.
      this.guards.safeBroadcast(tripId, 'day:reordered', { day });
      // The trip grew by a day, and on a dated trip its end date moved.
      const trip = this.days.getTripForViewer(tripId, ctx.userId);
      if (trip) this.guards.safeBroadcast(tripId, 'trip:updated', { trip });
      return ok({ day });
    } catch (err) {
      // REST lets this bubble into a 500; a tool caller can act on the sentence.
      if (err instanceof DayReorderError) return errorResult(err.message);
      throw err;
    }
  }

  /**
   * create_day with `dated`, the same as the REST route. The tool builds its input
   * from the contract's fields alone, so the refusal the contract's refine gives
   * for `dated` next to `date` or `position` is repeated here, word for word.
   */
  private appendDated(
    tripId: number, notes: string | undefined, date: string | undefined, position: number | undefined, ctx: McpContext,
  ) {
    if (date !== undefined || position !== undefined) return errorResult(`${DAY_CREATE_DATED_CONFLICT}.`);
    let append: DatedDayAppend;
    try {
      append = this.days.appendDated(tripId, ctx.userId, notes);
    } catch (err) {
      if (err instanceof DayAppendError) return errorResult(err.message);
      throw err;
    }
    // A tool has no socket of its own, so every screen hears all of it.
    const send: DaySender = (event, payload) => this.guards.safeBroadcast(tripId, event, payload as Record<string, unknown>);
    this.days.announceDatedAppend(append, { all: send, others: send });
    return ok({ day: append.day, trip: append.trip });
  }

  @Tool({
    name: 'reorder_days',
    description: 'Reorder the days of a trip by listing every one of its day IDs in the desired order. This moves whole days of the itinerary; to move places around inside a single day use reorder_day_assignments instead. Each day keeps its places, notes, stays and bookings, and on a dated trip the calendar dates stay pinned to their slots, so the content moves across the dates.',
    inputSchema: {
      tripId: z.number().int().positive(),
      orderedIds: dayReorderRequestSchema.shape.orderedIds.min(1).describe('Every day ID of the trip, in the desired order'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'trips', mode: 'write' },
  })
  async reorderDays(
    { tripId, orderedIds }: { tripId: number } & DayReorderRequest,
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.days.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    try {
      this.days.reorder(tripId, orderedIds);
    } catch (err) {
      // A non-permutation and an inverted stay are both the caller's input, so
      // they come back as tool errors rather than a throw the SDK has to dress up.
      if (err instanceof DayReorderError) return errorResult(err.message);
      throw err;
    }
    // REST parity shape ({ orderedIds }): the client refetches the day list off it.
    this.guards.safeBroadcast(tripId, 'day:reordered', { orderedIds });
    return ok({ success: true });
  }

  @Tool({
    name: 'delete_day',
    description: 'Delete a day from a trip. The places planned on it stay in the place list of the trip; its notes, title and description are deleted; bookings on it stay on the trip without a day. A stay that checks in or out on the day is cancelled together with its booking and the expense of that booking, while a stay that only runs across the day is kept. The later days move up one place. On a dated trip the dates stay on their positions, so every later day and the bookings on it move one date earlier; a day without a date then takes the last date, and when there is none the trip ends one day earlier. The last day of a trip cannot be deleted.',
    inputSchema: {
      tripId: z.number().int().positive(),
      dayId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'trips', mode: 'write' },
  })
  async deleteDay({ tripId, dayId }: { tripId: number; dayId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.days.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    if (!this.days.getDay(dayId, tripId)) return errorResult('Day not found.');
    let removal: DayRemoval;
    try {
      removal = this.removal.remove(tripId, dayId, { userId: ctx.userId });
    } catch (err) {
      // The last day stays, and the caller can act on the sentence.
      if (err instanceof DayDeleteError) return errorResult(err.message);
      throw err;
    }
    // The same fan-out as REST, day:deleted ({ dayId }, the shape the client reads)
    // first. A tool has no socket of its own, so every screen hears all of it.
    const send: MirrorSender = (event, payload) => this.guards.safeBroadcast(tripId, event, payload as Record<string, unknown>);
    this.removal.announce(tripId, removal, { all: send, others: send });
    return ok({ success: true });
  }

  @Tool({
    name: 'set_day_default_transport_mode',
    description: 'Set the whole-day default travel mode for a day. transport_mode is a route profile key: "driving", "walking", "cycling", or a plugin profile written as "plugin:<pluginId>/<profileId>". Any other value is stored but drawn as a driving route. null clears the default. Per-segment leg modes still override this.',
    inputSchema: {
      tripId: z.number().int().positive(),
      dayId: z.number().int().positive(),
      transport_mode: z.string().nullable().optional().describe('Route profile key (e.g. "driving"), or null to clear the day default'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'trips', mode: 'write' },
  })
  async setDayDefaultTransportMode(
    { tripId, dayId, transport_mode }: { tripId: number; dayId: number; transport_mode?: string | null },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.days.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    if (!this.days.getDay(dayId, tripId)) return errorResult('Day not found.');
    const day = this.days.setDefaultTransportMode(dayId, transport_mode ?? null);
    this.guards.safeBroadcast(tripId, 'day:updated', { day });
    return ok({ day });
  }

  @ResourceTemplate({
    name: 'trip-days',
    uriTemplate: 'trek://trips/{tripId}/days',
    description: 'Days of a trip with their assigned places',
    mimeType: 'application/json',
    access: { group: 'trips', mode: 'read' },
  })
  async tripDaysResource(uri: URL, { tripId }: { tripId: string | string[] }, ctx: McpContext) {
    const id = parseId(tripId);
    if (id === null || !this.days.verifyTripAccess(id, ctx.userId)) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Trip not found or access denied' }),
        }],
      };
    }
    const { days } = this.days.list(id);
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(days, null, 2),
      }],
    };
  }
}
