import {
  McpController, Tool, Resource, ResourceTemplate, Prompt, type McpContext,
  TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE, TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
  TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, errorResult, ok,
} from '../../nest-mcp';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service';
import { CalendarService } from '../calendar/calendar.service';
import { TripMembersService } from '../trip-members/trip-members.service';
import { TripReadModelService } from '../trip-read-model/trip-read-model.service';
import { ADDON_IDS } from '../../addons';
import { MAX_MCP_TRIP_DAYS, noAccess, permissionDenied } from '../../mcp/tools/_shared';
import { canRead, canReadTrips, canDeleteTrips } from '../../mcp/scopes';
import { TripsService, MAX_TRIP_DAYS, NotFoundError, ValidationError } from './trips.service';
import { TodoService } from '../todo/todo.service';
import { CollabService } from '../collab/collab.service';
import { AddonsService } from '../addons/addons.service';

function parseId(value: string | string[]): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function accessDenied(uri: string) {
  return {
    contents: [{
      uri,
      mimeType: 'application/json',
      text: JSON.stringify({ error: 'Trip not found or access denied' }),
    }],
  };
}

function jsonContent(uri: string, data: unknown) {
  return {
    contents: [{
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(data, null, 2),
    }],
  };
}

/**
 * Trip MCP surface — ported 1:1 from the legacy registrars: ten tools from
 * src/mcp/tools/trips.ts (the three share-link tools moved to
 * src/nest/share/share.mcp.ts), the trek://trips, trek://trips/{tripId} and
 * trek://trips/{tripId}/members resources from src/mcp/resources.ts, and the
 * trip-summary prompt from src/mcp/tools/prompts.ts (identical names,
 * descriptions, schemas, annotations, error/payload shapes and broadcasts).
 *
 * Access markers deviate from the declarative default in two places, on
 * purpose (parity with the legacy registration-time gates):
 *  - the legacy `R` was canReadTrips(), which also accepts trips:delete /
 *    trips:share tokens — a declarative { group: 'trips', mode: 'read' }
 *    would silently deny those, so reads use the predicate escape hatch;
 *  - delete_trip's trips:delete gate has no declarative mode, so it is a
 *    predicate too. list_trips / get_trip_summary stay unconditionally
 *    registered (navigation tools — the legacy comment applies unchanged).
 */
@McpController()
export class TripsMcp {
  constructor(
    private readonly trips: TripsService,
    private readonly todos: TodoService,
    private readonly collab: CollabService,
    private readonly auth: AuthService,
    // Appended, not inserted: the hand-wired MCP test harnesses build this
    // positionally, so an earlier slot would silently shift every one of them.
    private readonly calendar: CalendarService,
    private readonly members: TripMembersService,
    private readonly readModel: TripReadModelService,
    private readonly addons: AddonsService,
    private readonly guards: McpToolGuardsService,
  ) {}

  // --- TRIPS ---

  @Tool({
    name: 'create_trip',
    description: 'Create a new trip. Returns the created trip with its generated days.',
    inputSchema: {
      title: z.string().min(1).max(200).describe('Trip title'),
      description: z.string().max(2000).optional().describe('Trip description'),
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Start date (YYYY-MM-DD)'),
      end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('End date (YYYY-MM-DD)'),
      currency: z.string().length(3).optional().describe('Currency code (e.g. EUR, USD)'),
      day_count: z.number().int().min(1).max(MAX_TRIP_DAYS).optional().describe(
        'How many days a trip without dates gets (default 7). Ignored when start_date and end_date are both set, because the range decides the count.'),
      reminder_days: z.number().int().min(0).max(30).optional().describe(
        'How many days before departure the pre-trip reminder fires (default 3). 0 turns the reminder off.'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'trips', mode: 'write' },
  })
  async createTrip(
    { title, description, start_date, end_date, currency, day_count, reminder_days }: {
      title: string; description?: string; start_date?: string; end_date?: string; currency?: string;
      day_count?: number; reminder_days?: number;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (start_date) {
      const d = new Date(start_date + 'T00:00:00Z');
      if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== start_date)
        return { content: [{ type: 'text' as const, text: 'start_date is not a valid calendar date.' }], isError: true };
    }
    if (end_date) {
      const d = new Date(end_date + 'T00:00:00Z');
      if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== end_date)
        return { content: [{ type: 'text' as const, text: 'end_date is not a valid calendar date.' }], isError: true };
    }
    if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
      return { content: [{ type: 'text' as const, text: 'End date must be after start date.' }], isError: true };
    }
    const { trip } = this.trips.create(ctx.userId, { title, description, start_date, end_date, currency, day_count, reminder_days }, MAX_MCP_TRIP_DAYS);
    return ok({ trip });
  }

  @Tool({
    name: 'update_trip',
    description: 'Update an existing trip\'s details.',
    inputSchema: {
      tripId: z.number().int().positive(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).nullable().optional().describe('Trip description; null removes it'),
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      clear_dates: z.boolean().optional().describe(
        'Drop both dates and turn the trip back into a dateless one. Cannot be combined with start_date or end_date; pair it with day_count to say how many days the dateless trip keeps'),
      currency: z.string().length(3).optional(),
      is_archived: z.boolean().optional().describe('Archive (true) or unarchive (false) the trip'),
      cover_image: z.string().nullable().optional().describe('Cover image path, e.g. /uploads/covers/abc.jpg; null removes the cover'),
      day_count: z.number().int().min(1).max(MAX_TRIP_DAYS).optional().describe(
        'Resize a trip without dates to this many days. Days that still hold content are never trimmed. Ignored while the trip has a date range, because the range decides the count'),
      reminder_days: z.number().int().min(0).max(30).optional().describe(
        'How many days before departure the pre-trip reminder fires. 0 turns the reminder off'),
      date_shift_mode: z.enum(['keep_bookings', 'shift_all']).optional().describe(
        'When changing dates: keep_bookings (default) keeps dated reservations/accommodations on their dates while day plans move; shift_all moves the whole itinerary, bookings included'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'trips', mode: 'write' },
  })
  async updateTrip(
    { tripId, title, description, start_date, end_date, clear_dates, currency, is_archived, cover_image, day_count, reminder_days, date_shift_mode }: {
      tripId: number; title?: string; description?: string | null; start_date?: string; end_date?: string;
      clear_dates?: boolean; currency?: string; is_archived?: boolean; cover_image?: string | null;
      day_count?: number; reminder_days?: number; date_shift_mode?: 'keep_bookings' | 'shift_all';
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.trips.canAccessTrip(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('trip_edit', tripId, ctx.userId)) return permissionDenied();
    if (clear_dates && (start_date || end_date))
      return errorResult('clear_dates cannot be combined with start_date or end_date.');
    if (start_date) {
      const d = new Date(start_date + 'T00:00:00Z');
      if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== start_date)
        return { content: [{ type: 'text' as const, text: 'start_date is not a valid calendar date.' }], isError: true };
    }
    if (end_date) {
      const d = new Date(end_date + 'T00:00:00Z');
      if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== end_date)
        return { content: [{ type: 'text' as const, text: 'end_date is not a valid calendar date.' }], isError: true };
    }
    // updateTrip reads every field with a `!== undefined` presence sentinel, so a
    // dated trip only goes back to dateless once an explicit null reaches it. A flag
    // rather than a nullable start_date/end_date: clients that serialise an omitted
    // optional as null would otherwise wipe the dates of every trip they touched.
    const dates: { start_date?: string | null; end_date?: string | null } = clear_dates
      ? { start_date: null, end_date: null }
      : { start_date, end_date };
    // update() re-anchors the budget before the trip row moves off the old
    // currency (#1543) and then runs the legacy updateTrip core.
    const { updatedTrip } = await this.trips.update(tripId, ctx.userId, { title, description, ...dates, currency, is_archived, cover_image, day_count, reminder_days, date_shift_mode }, 'user');
    this.guards.safeBroadcast(tripId, 'trip:updated', { trip: updatedTrip });
    return ok({ trip: updatedTrip });
  }

  @Tool({
    name: 'search_cover_images',
    description: 'Search Unsplash for candidate cover photos and return their URLs, thumbnails and photographer credits. Use this when the user wants a cover image but has no URL of their own, then pass the chosen photo\'s url back as update_trip\'s cover_image. Nothing is saved to a trip here.',
    inputSchema: {
      query: z.string().min(1).max(200).describe('What the cover should show, e.g. "Lisbon rooftops at sunset"'),
    },
    annotations: TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
    access: (ctx) => canReadTrips(ctx.scopes),
  })
  async searchCoverImages({ query }: { query: string }, ctx: McpContext) {
    try {
      const result = await this.trips.searchCoverImages(query, ctx.userId);
      if ('error' in result) return errorResult(result.error);
      return ok({ photos: result.photos });
    } catch (err) {
      console.error('Unsplash cover image error:', err);
      return errorResult('Error searching for cover images');
    }
  }

  @Tool({
    name: 'delete_trip',
    description: 'Delete a trip. Only the trip owner can delete it.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: (ctx) => canDeleteTrips(ctx.scopes),
  })
  async deleteTrip({ tripId }: { tripId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.trips.isOwner(tripId, ctx.userId)) return noAccess();
    this.trips.remove(tripId, ctx.userId, 'user');
    return ok({ success: true, tripId });
  }

  // list_trips and get_trip_summary are always registered regardless of OAuth scopes —
  // they are navigation tools that any MCP client needs to discover trip IDs.
  @Tool({
    name: 'list_trips',
    description: 'List all trips the current user owns or is a member of. Use this for trip discovery before calling get_trip_summary.',
    inputSchema: {
      include_archived: z.boolean().optional().describe('Include archived trips (default false)'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
  })
  async listTrips({ include_archived }: { include_archived?: boolean }, ctx: McpContext) {
    const notice = ctx.getDeprecationNotice ? ctx.getDeprecationNotice() : null;
    const trips = this.trips.list(ctx.userId, include_archived ? null : 0);
    if (notice) return {
      isError: true as const,
      content: [
        { type: 'text' as const, text: notice },
        { type: 'text' as const, text: JSON.stringify({ trips }, null, 2) },
      ],
    };
    return ok({ trips });
  }

  // --- TRIP SUMMARY ---

  @Tool({
    name: 'get_trip_summary',
    description: 'Get a full denormalized summary of a trip in a single call: metadata, members, days with assignments and notes, accommodations, budget line items (when enabled), packing list (when enabled), reservations, collab notes and poll/message counts (when enabled), and to-do items (when enabled). Use this as a context loader before planning or modifying a trip.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
  })
  async getTripSummary({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!this.trips.canAccessTrip(tripId, ctx.userId)) return noAccess();
    const summary = this.readModel.getTripSummary(tripId, ctx.userId);
    if (!summary) return noAccess();
    const R = canReadTrips(ctx.scopes);
    // Addon availability gates
    const packingEnabled = this.addons.isAddonEnabled(ADDON_IDS.PACKING);
    const budgetEnabled  = this.addons.isAddonEnabled(ADDON_IDS.BUDGET);
    const collabEnabled  = this.addons.isAddonEnabled(ADDON_IDS.COLLAB);
    const collabFeatures = collabEnabled ? this.addons.getCollabFeatures() : null;
    // Scope gates — sections not covered by the client's OAuth scopes are omitted.
    // Core trip data (metadata, days, members, accommodations) is always included
    // because this tool is always registered and needed for navigation.
    const canReadBudget  = budgetEnabled  && canRead(ctx.scopes, 'budget');
    const canReadPacking = packingEnabled && canRead(ctx.scopes, 'packing');
    const canReadCollab  = collabEnabled  && canRead(ctx.scopes, 'collab');
    const canReadTodos   = packingEnabled && canRead(ctx.scopes, 'todos');
    const canReadRes     = canRead(ctx.scopes, 'reservations');
    const todos = canReadTodos ? this.todos.listItems(tripId) : [];
    let pollCount = 0;
    let messageCount = 0;
    if (canReadCollab) {
      if (collabFeatures?.polls) pollCount    = this.collab.listPolls(tripId).length;
      if (collabFeatures?.chat)  messageCount = this.collab.countMessages(tripId);
    }
    const notice = ctx.getDeprecationNotice ? ctx.getDeprecationNotice() : null;
    // The core bucket (trip metadata, members WITH email, days with place
    // coordinates, accommodations) carries confidential PII and itinerary data,
    // so it is gated on trips:read just like the sub-sections below. Without a
    // read scope the tool still resolves trip id + title so it stays usable for
    // navigation (list_trips already covers discovery). trek_ PATs (null scopes)
    // and any trips:read holder keep the full payload — no behaviour change.
    const summaryData = {
      trip:          R                                             ? summary.trip          : { id: summary.trip.id, title: summary.trip.title },
      members:       R                                             ? summary.members       : undefined,
      days:          R                                             ? summary.days          : undefined,
      // Accommodations are "accommodation details" under reservations:read too
      // (see SCOPE_INFO) and pair with reservations in the share payload, so a
      // reservations-scoped token keeps them — gate on either read scope.
      accommodations: (R || canReadRes)                            ? summary.accommodations : undefined,
      reservations:  canReadRes                                    ? summary.reservations : undefined,
      packing:       canReadPacking                                ? summary.packing      : undefined,
      budget:        canReadBudget                                 ? summary.budget       : undefined,
      collab_notes:  canReadCollab && collabFeatures?.notes        ? summary.collab_notes : [],
      todos,
      pollCount,
      messageCount,
    };
    if (notice) return {
      isError: true as const,
      content: [
        { type: 'text' as const, text: notice },
        { type: 'text' as const, text: JSON.stringify(summaryData, null, 2) },
      ],
    };
    return ok(summaryData);
  }

  // --- TRIP MEMBERS, COPY, ICS ---

  @Tool({
    name: 'list_trip_members',
    description: 'List all members of a trip (owner + collaborators).',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: (ctx) => canReadTrips(ctx.scopes),
  })
  async listTripMembers({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!this.trips.canAccessTrip(tripId, ctx.userId)) return noAccess();
    const ownerRow = this.trips.getOwner(tripId);
    if (!ownerRow) return noAccess();
    const { owner, members } = this.members.listMembers(tripId, ownerRow.user_id);
    return ok({ owner, members });
  }

  @Tool({
    name: 'add_trip_member',
    description: 'Add a user to a trip by their username or email address. Needs the member_manage permission, which by default only the trip owner holds. Use create_trip_guest instead for a companion who has no TREK account.',
    inputSchema: {
      tripId: z.number().int().positive(),
      identifier: z.string().min(1).describe('Username or email of the user to add'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'trips', mode: 'write' },
  })
  async addTripMember({ tripId, identifier }: { tripId: number; identifier: string }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.trips.canAccessTrip(tripId, ctx.userId)) return noAccess();
    const ownerRow = this.trips.getOwner(tripId);
    if (!ownerRow) return noAccess();
    // member_manage rather than a hardcoded owner test: the action is admin-lowerable
    // in the permission matrix, and POST /api/trips/:id/members has always honoured
    // that setting (and the admin bypass inside checkPermission) where this did not.
    if (!this.guards.hasTripPermission('member_manage', tripId, ctx.userId)) return permissionDenied();
    try {
      const result = this.members.addMember(tripId, identifier, ownerRow.user_id, ctx.userId);
      this.guards.safeBroadcast(tripId, 'member:added', { member: result.member });
      return ok({ member: result.member });
    } catch (err) {
      const msg = err instanceof ValidationError || err instanceof NotFoundError ? err.message : 'Failed to add member.';
      return { content: [{ type: 'text' as const, text: msg }], isError: true };
    }
  }

  @Tool({
    name: 'remove_trip_member',
    description: 'Remove somebody else from a trip. Needs the member_manage permission, which by default only the trip owner holds. When the user means themselves, prefer leave_trip: it says so plainly and needs no permission.',
    inputSchema: {
      tripId: z.number().int().positive(),
      memberId: z.number().int().positive().describe('User ID of the member to remove'),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'trips', mode: 'write' },
  })
  async removeTripMember({ tripId, memberId }: { tripId: number; memberId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.trips.canAccessTrip(tripId, ctx.userId)) return noAccess();
    // Giving up your own access is not member management, so it carries no permission
    // requirement: the same self-removal bypass DELETE /api/trips/:id/members/:userId has.
    if (memberId !== ctx.userId && !this.guards.hasTripPermission('member_manage', tripId, ctx.userId))
      return permissionDenied();
    this.members.removeMember(tripId, memberId);
    this.guards.safeBroadcast(tripId, 'member:removed', { userId: memberId });
    return ok({ success: true });
  }

  @Tool({
    name: 'leave_trip',
    description: 'Leave a trip you were invited to, giving up your own access to it. Prefer this over remove_trip_member whenever the user means themselves. The owner cannot leave their own trip.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'trips', mode: 'write' },
  })
  async leaveTrip({ tripId }: { tripId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.trips.canAccessTrip(tripId, ctx.userId)) return noAccess();
    const ownerRow = this.trips.getOwner(tripId);
    if (!ownerRow) return noAccess();
    // removeMember only deletes a trip_members row, and the owner has none, so an
    // owner calling this would get a success that changed nothing. Say so instead.
    if (ownerRow.user_id === ctx.userId)
      return errorResult('You own this trip, so you cannot leave it. Hand it to another member first, or delete it.');
    this.members.removeMember(tripId, ctx.userId);
    this.guards.safeBroadcast(tripId, 'member:removed', { userId: ctx.userId });
    return ok({ success: true });
  }

  // --- GUESTS (#1362) ---
  //
  // add_trip_member resolves an existing account by username or email, so a
  // travelling companion who has never signed up could be put on a trip in the
  // planner and not through an assistant. These three mirror the owner-only
  // /api/trips/:id/guests routes (trip-members.controller.ts): a guest is a
  // credential-less users row assignable to budget splits, packing and day
  // participants exactly like a member, so importing a past trip no longer has
  // to drop who was on it.

  @Tool({
    name: 'create_trip_guest',
    description: 'Add a travelling companion who has no TREK account to a trip. Use this when the person cannot be found by username or email. A guest can be assigned to budget splits, packing items, to-dos and day participants like any member, but never signs in and is never emailed. Only the trip owner can do this.',
    inputSchema: {
      tripId: z.number().int().positive(),
      name: z.string().min(1).max(50).describe('Display name of the guest, e.g. "Anna"'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'trips', mode: 'write' },
  })
  async createTripGuest({ tripId, name }: { tripId: number; name: string }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.trips.canAccessTrip(tripId, ctx.userId)) return noAccess();
    const ownerRow = this.trips.getOwner(tripId);
    if (!ownerRow || ownerRow.user_id !== ctx.userId)
      return { content: [{ type: 'text' as const, text: 'Only the trip owner can manage guests.' }], isError: true };
    try {
      // No notifyInvite: a guest has no inbox.
      const { member } = this.members.createGuest(tripId, name, ctx.userId);
      this.guards.safeBroadcast(tripId, 'member:added', { member });
      return ok({ member });
    } catch (err) {
      const msg = err instanceof ValidationError ? err.message : 'Failed to create guest.';
      return { content: [{ type: 'text' as const, text: msg }], isError: true };
    }
  }

  @Tool({
    name: 'rename_trip_guest',
    description: 'Rename a guest on a trip. Only the trip owner can do this.',
    inputSchema: {
      tripId: z.number().int().positive(),
      guestId: z.number().int().positive().describe('User ID of the guest, from list_trip_members'),
      name: z.string().min(1).max(50).describe('New display name'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'trips', mode: 'write' },
  })
  async renameTripGuest({ tripId, guestId, name }: { tripId: number; guestId: number; name: string }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.trips.canAccessTrip(tripId, ctx.userId)) return noAccess();
    const ownerRow = this.trips.getOwner(tripId);
    if (!ownerRow || ownerRow.user_id !== ctx.userId)
      return { content: [{ type: 'text' as const, text: 'Only the trip owner can manage guests.' }], isError: true };
    try {
      if (!this.members.renameGuest(tripId, guestId, name))
        return { content: [{ type: 'text' as const, text: 'Guest not found.' }], isError: true };
    } catch (err) {
      const msg = err instanceof ValidationError ? err.message : 'Failed to rename guest.';
      return { content: [{ type: 'text' as const, text: msg }], isError: true };
    }
    return ok({ success: true });
  }

  @Tool({
    name: 'delete_trip_guest',
    description: 'Remove a guest from a trip. This deletes the guest outright (they exist only for this trip) and re-splits any expenses they were part of. Only the trip owner can do this.',
    inputSchema: {
      tripId: z.number().int().positive(),
      guestId: z.number().int().positive().describe('User ID of the guest, from list_trip_members'),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'trips', mode: 'write' },
  })
  async deleteTripGuest({ tripId, guestId }: { tripId: number; guestId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.trips.canAccessTrip(tripId, ctx.userId)) return noAccess();
    const ownerRow = this.trips.getOwner(tripId);
    if (!ownerRow || ownerRow.user_id !== ctx.userId)
      return { content: [{ type: 'text' as const, text: 'Only the trip owner can manage guests.' }], isError: true };
    if (!this.members.deleteGuest(tripId, guestId))
      return { content: [{ type: 'text' as const, text: 'Guest not found.' }], isError: true };
    this.guards.safeBroadcast(tripId, 'member:removed', { userId: guestId });
    return ok({ success: true });
  }

  @Tool({
    name: 'copy_trip',
    description: 'Duplicate a trip (all days, places, itinerary, packing, budget, reservations, day notes). Packing items and to-dos are reset to unchecked. Returns the new trip.',
    inputSchema: {
      tripId: z.number().int().positive().describe('Source trip ID to duplicate'),
      title: z.string().min(1).max(200).optional().describe('Title for the new trip (defaults to source title)'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'trips', mode: 'write' },
  })
  async copyTrip({ tripId, title }: { tripId: number; title?: string }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.trips.canAccessTrip(tripId, ctx.userId)) return noAccess();
    try {
      const newTripId = this.trips.copy(tripId, ctx.userId, title);
      const newTrip = this.trips.canAccessTrip(newTripId, ctx.userId);
      return ok({ trip: { id: newTripId, ...newTrip } });
    } catch {
      return { content: [{ type: 'text' as const, text: 'Failed to copy trip.' }], isError: true };
    }
  }

  @Tool({
    name: 'export_trip_ics',
    description: 'Export a trip\'s itinerary and reservations as iCalendar (.ics) format text. Useful for importing into calendar apps.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: (ctx) => canReadTrips(ctx.scopes),
  })
  async exportTripIcs({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!this.trips.canAccessTrip(tripId, ctx.userId)) return noAccess();
    try {
      const { ics, filename } = this.calendar.exportICS(tripId);
      return ok({ ics, filename });
    } catch {
      return { content: [{ type: 'text' as const, text: 'Trip not found.' }], isError: true };
    }
  }

  // --- RESOURCES ---

  @Resource({
    name: 'trips',
    uri: 'trek://trips',
    description: 'All trips the user owns or is a member of',
    mimeType: 'application/json',
    access: (ctx) => canReadTrips(ctx.scopes),
  })
  async tripsResource(uri: URL, ctx: McpContext) {
    const trips = this.trips.list(ctx.userId, 0);
    return jsonContent(uri.href, trips);
  }

  @ResourceTemplate({
    name: 'trip',
    uriTemplate: 'trek://trips/{tripId}',
    description: 'A single trip with metadata and member count',
    mimeType: 'application/json',
    access: (ctx) => canReadTrips(ctx.scopes),
  })
  async tripResource(uri: URL, { tripId }: { tripId: string | string[] }, ctx: McpContext) {
    const id = parseId(tripId);
    if (id === null || !this.trips.canAccessTrip(id, ctx.userId)) return accessDenied(uri.href);
    const trip = this.trips.get(id, ctx.userId);
    return jsonContent(uri.href, trip);
  }

  @ResourceTemplate({
    name: 'trip-members',
    uriTemplate: 'trek://trips/{tripId}/members',
    description: 'Owner and collaborators of a trip',
    mimeType: 'application/json',
    access: (ctx) => canReadTrips(ctx.scopes),
  })
  async tripMembersResource(uri: URL, { tripId }: { tripId: string | string[] }, ctx: McpContext) {
    const id = parseId(tripId);
    if (id === null || !this.trips.canAccessTrip(id, ctx.userId)) return accessDenied(uri.href);
    const ownerRow = this.trips.getOwner(id);
    if (!ownerRow) return accessDenied(uri.href);
    const { owner, members } = this.members.listMembers(id, ownerRow.user_id);
    return jsonContent(uri.href, { owner, members });
  }

  // --- PROMPTS ---

  @Prompt({
    name: 'trip-summary',
    title: 'Trip Summary',
    description: 'Load a full summary of a trip for context before planning or modifications',
    argsSchema: {
      tripId: z.number().int().positive().describe('Trip ID to summarize'),
    },
  })
  async tripSummaryPrompt({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!this.trips.canAccessTrip(tripId, ctx.userId)) {
      return { messages: [{ role: 'user' as const, content: { type: 'text' as const, text: 'Trip not found or access denied.' } }] };
    }
    const summary = this.readModel.getTripSummary(tripId, ctx.userId);
    if (!summary) {
      return { messages: [{ role: 'user' as const, content: { type: 'text' as const, text: 'Trip not found.' } }] };
    }
    const { trip, days, members, budget, packing, reservations, collab_notes } = summary as any;
    const memberList = [members?.owner, ...(members?.collaborators || [])].filter(Boolean);
    const text = `Trip: ${trip?.title || 'Untitled'}${trip?.description ? `\n${trip.description}` : ''}
Dates: ${trip?.start_date || '?'} to ${trip?.end_date || '?'}
Members: ${memberList.length} (${memberList.map((m: any) => m.name || m.email).join(', ') || 'none'})
Days: ${days?.length || 0}
Packing: ${packing?.checked || 0}/${packing?.total || 0} items packed
Budget: ${budget?.total || 0} ${trip?.currency || 'EUR'} total
Reservations: ${reservations?.length || 0}
Collab Notes: ${collab_notes?.length || 0}
${days?.map((d: any, i: number) => `Day ${i + 1} (${d.date}): ${d.assignments?.length || 0} places${d.title ? ` - ${d.title}` : ''}`).join('\n') || 'No days yet'}`;
    return {
      description: `Summary of trip "${trip?.title || tripId}"`,
      messages: [{ role: 'user' as const, content: { type: 'text' as const, text } }],
    };
  }
}
