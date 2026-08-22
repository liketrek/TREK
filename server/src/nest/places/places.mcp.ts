import {
  McpController, Tool, ResourceTemplate, type McpContext,
  TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE,
  TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, ok,
} from '../../nest-mcp';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { placeWebsiteSchema } from '@trek/shared';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { JourneyDomainService } from '../journey/journey-domain.service';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import { DatabaseService } from '../database/database.service';
import { MapsService } from '../maps/maps.service';
import { PlacesService } from './places.service';

function parseId(value: string | string[]): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Places MCP surface — ported 1:1 from the legacy registrar
 * src/mcp/tools/places.ts (ten tools) plus the trek://trips/{tripId}/places
 * resource from src/mcp/resources.ts: identical names, descriptions, input
 * schemas, annotations, error/payload shapes and safeBroadcast events. The
 * registration-time `canWrite/canRead(scopes, 'places')` gates became the
 * declarative access markers, resolved by trekMcpAccessPolicy.
 *
 * `search_place` stays in this controller even though it calls MapsService:
 * its legacy gate is `places:read`, not the geo group that maps.mcp.ts carries.
 *
 * AssignmentsService is injected from AssignmentsDomainModule — the split that
 * retired assignments.bridge. The full AssignmentsModule sits on the
 * DaysModule → PlacesModule → AssignmentsModule loop (its MCP class injects
 * DaysService), but the service itself never did, so its own module stays off
 * the loop and PlacesModule can import it.
 */
@McpController()
export class PlacesMcp {
  constructor(
    private readonly places: PlacesService,
    private readonly maps: MapsService,
    private readonly db: DatabaseService,
    private readonly auth: AuthService,
    private readonly journey: JourneyDomainService,
    private readonly assignments: AssignmentsService,
    private readonly guards: McpToolGuardsService,
  ) {}

  @Tool({
    name: 'create_place',
    description: 'Add a new place/POI to a trip. Set google_place_id, google_ftid, or osm_id (from search_place) so the app can show opening hours, ratings, and direct Google Maps links. Set price + currency to record the cost so it shows on the item.',
    inputSchema: {
      tripId: z.number().int().positive(),
      name: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      address: z.string().max(500).optional(),
      category_id: z.number().int().positive().optional().describe('Category ID — use list_categories to see available options'),
      google_place_id: z.string().optional().describe('Google Place ID from search_place — enables opening hours display'),
      google_ftid: z.string().optional().describe('Google Maps feature ID from search_place — enables direct Google Maps links'),
      osm_id: z.string().optional().describe('OpenStreetMap ID from search_place (e.g. "way:12345") — enables opening hours if no Google ID'),
      notes: z.string().max(2000).optional(),
      website: placeWebsiteSchema.optional(),
      phone: z.string().max(50).optional(),
      price: z.number().nonnegative().optional().describe('Cost of this place/activity (e.g. ticket price, entry fee)'),
      currency: z.string().length(3).optional().describe('ISO 4217 currency code (e.g. "EUR", "USD")'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'places', mode: 'write' },
  })
  async createPlace(
    { tripId, name, description, lat, lng, address, category_id, google_place_id, google_ftid, osm_id, notes, website, phone, price, currency }: {
      tripId: number; name: string; description?: string; lat?: number; lng?: number; address?: string;
      category_id?: number; google_place_id?: string; google_ftid?: string; osm_id?: string;
      notes?: string; website?: string; phone?: string; price?: number; currency?: string;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.db.canAccessTrip(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('place_edit', tripId, ctx.userId)) return permissionDenied();
    const place = this.places.create(String(tripId), { name, description, lat, lng, address, category_id, google_place_id, google_ftid, osm_id, notes, website, phone, price, currency });
    this.guards.safeBroadcast(tripId, 'place:created', { place });
    return ok({ place });
  }

  @Tool({
    name: 'create_and_assign_place',
    description: 'Create a new place and immediately assign it to a day in one atomic operation. Use place details from search_place results. Only use when the place does not yet exist — if it already exists, use assign_place_to_day directly. Set price + currency to record the cost so it shows on the item.',
    inputSchema: {
      tripId: z.number().int().positive(),
      dayId: z.number().int().positive().describe('Day to assign the place to'),
      name: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      address: z.string().max(500).optional(),
      category_id: z.number().int().positive().optional().describe('Category ID — use list_categories to see available options'),
      google_place_id: z.string().optional().describe('Google Place ID from search_place — enables opening hours display'),
      google_ftid: z.string().optional().describe('Google Maps feature ID from search_place — enables direct Google Maps links'),
      osm_id: z.string().optional().describe('OpenStreetMap ID from search_place (e.g. "way:12345")'),
      place_notes: z.string().max(2000).optional().describe('Notes for the place'),
      website: placeWebsiteSchema.optional(),
      phone: z.string().max(50).optional(),
      assignment_notes: z.string().max(500).optional().describe('Notes for this day assignment'),
      price: z.number().nonnegative().optional().describe('Cost of this place/activity (e.g. ticket price, entry fee)'),
      currency: z.string().length(3).optional().describe('ISO 4217 currency code (e.g. "EUR", "USD")'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'places', mode: 'write' },
  })
  async createAndAssignPlace(
    { tripId, dayId, name, description, lat, lng, address, category_id, google_place_id, google_ftid, osm_id, place_notes, website, phone, assignment_notes, price, currency }: {
      tripId: number; dayId: number; name: string; description?: string; lat?: number; lng?: number; address?: string;
      category_id?: number; google_place_id?: string; google_ftid?: string; osm_id?: string;
      place_notes?: string; website?: string; phone?: string; assignment_notes?: string;
      price?: number; currency?: string;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.db.canAccessTrip(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('place_edit', tripId, ctx.userId)) return permissionDenied();
    if (!this.assignments.dayExists(dayId, tripId)) return { content: [{ type: 'text' as const, text: 'Day not found.' }], isError: true };
    try {
      const result = this.db.transaction(() => {
        const place = this.places.create(String(tripId), { name, description, lat, lng, address, category_id, google_place_id, google_ftid, osm_id, notes: place_notes, website, phone, price, currency });
        const assignment = this.assignments.createAssignment(dayId, place.id, assignment_notes ?? null);
        return { place, assignment };
      });
      this.guards.safeBroadcast(tripId, 'place:created', { place: result.place });
      this.guards.safeBroadcast(tripId, 'assignment:created', { assignment: result.assignment });
      try { this.journey.reconcileTripSkeletons(tripId); } catch { /* non-fatal */ }
      return ok(result);
    } catch {
      return { content: [{ type: 'text' as const, text: 'Failed to create place and assignment.' }], isError: true };
    }
  }

  @Tool({
    name: 'update_place',
    description: 'Update an existing place in a trip.',
    inputSchema: {
      tripId: z.number().int().positive(),
      placeId: z.number().int().positive(),
      name: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      address: z.string().max(500).optional(),
      category_id: z.number().int().positive().optional().describe('Category ID — use list_categories'),
      price: z.number().optional(),
      currency: z.string().length(3).optional(),
      place_time: z.string().max(50).optional().describe('Scheduled time (e.g. "09:00")'),
      end_time: z.string().max(50).optional().describe('End time (e.g. "11:00")'),
      duration_minutes: z.number().int().positive().optional(),
      notes: z.string().max(2000).optional(),
      website: placeWebsiteSchema.optional(),
      phone: z.string().max(50).optional(),
      transport_mode: z.enum(['walking', 'driving', 'cycling', 'transit', 'flight']).optional(),
      osm_id: z.string().optional().describe('OpenStreetMap ID (e.g. "way:12345")'),
      google_place_id: z.string().optional().describe('Google Place ID (e.g. "ChIJd8BlQ2BZwokRAFUEcm_qrcA")'),
      google_ftid: z.string().optional().describe('Google Maps feature ID (e.g. "0x89c259b7abdd4769:0x103aaf1c8bf8a050")'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'places', mode: 'write' },
  })
  async updatePlace(
    { tripId, placeId, name, description, lat, lng, address, category_id, price, currency, place_time, end_time, duration_minutes, notes, website, phone, transport_mode, osm_id, google_place_id, google_ftid }: {
      tripId: number; placeId: number; name?: string; description?: string; lat?: number; lng?: number;
      address?: string; category_id?: number; price?: number; currency?: string; place_time?: string;
      end_time?: string; duration_minutes?: number; notes?: string; website?: string; phone?: string;
      transport_mode?: 'walking' | 'driving' | 'cycling' | 'transit' | 'flight'; osm_id?: string;
      google_place_id?: string; google_ftid?: string;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.db.canAccessTrip(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('place_edit', tripId, ctx.userId)) return permissionDenied();
    const place = await this.places.update(String(tripId), String(placeId), { name, description, lat, lng, address, category_id, price, currency, place_time, end_time, duration_minutes, notes, website, phone, transport_mode, osm_id, google_place_id, google_ftid });
    if (!place) return { content: [{ type: 'text' as const, text: 'Place not found.' }], isError: true };
    this.guards.safeBroadcast(tripId, 'place:updated', { place });
    return ok({ place });
  }

  @Tool({
    name: 'rate_place',
    description: "Set or clear the current user's 1-5 star rating on a trip place (#1435). Every trip member rates independently; the place shows the average. Omit rating (or pass null) to remove the user's vote. Use the ratings to capture the user's preferences and shape the itinerary around highly-rated places.",
    inputSchema: {
      tripId: z.number().int().positive(),
      placeId: z.number().int().positive(),
      rating: z.number().int().min(1).max(5).nullable().optional().describe('1-5 stars; null/omitted clears the vote'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'places', mode: 'write' },
  })
  async ratePlace(
    { tripId, placeId, rating }: { tripId: number; placeId: number; rating?: number | null },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    // Rating is a personal vote — any trip member may cast one, place_edit not required.
    if (!this.db.canAccessTrip(tripId, ctx.userId)) return noAccess();
    const place = this.places.rate(String(tripId), String(placeId), ctx.userId, rating ?? null);
    if (!place) return { content: [{ type: 'text' as const, text: 'Place not found.' }], isError: true };
    this.guards.safeBroadcast(tripId, 'place:updated', { place });
    return ok({ place });
  }

  @Tool({
    name: 'delete_place',
    description: 'Delete a place from a trip.',
    inputSchema: {
      tripId: z.number().int().positive(),
      placeId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'places', mode: 'write' },
  })
  async deletePlace({ tripId, placeId }: { tripId: number; placeId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.db.canAccessTrip(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('place_edit', tripId, ctx.userId)) return permissionDenied();
    // Scope the id to the trip before the hook: onPlaceDeleted keys on the place
    // id alone, so a foreign id would detach that trip's journey entries even
    // though the delete below refuses it.
    if (!this.places.get(String(tripId), String(placeId))) {
      return { content: [{ type: 'text' as const, text: 'Place not found.' }], isError: true };
    }
    try { this.journey.onPlaceDeleted(placeId); } catch { /* non-fatal */ } // sync journeys before the row is gone
    // The link is gone once the place is, so read it first (#1298).
    const expenseIds = this.places.linkedExpenseIds(tripId, [placeId]);
    const deleted = await this.places.remove(String(tripId), String(placeId));
    if (!deleted) return { content: [{ type: 'text' as const, text: 'Place not found.' }], isError: true };
    this.guards.safeBroadcast(tripId, 'place:deleted', { placeId });
    for (const itemId of expenseIds) this.guards.safeBroadcast(tripId, 'budget:deleted', { itemId });
    return ok({ success: true });
  }

  @Tool({
    name: 'list_places',
    description: 'List all places/POIs in a trip, optionally filtered by assignment status. Use assignment=unassigned to find orphan activities not yet scheduled on any day.',
    inputSchema: {
      tripId: z.number().int().positive(),
      search: z.string().optional(),
      category: z.string().optional(),
      tag: z.string().optional(),
      assignment: z.enum(['all', 'unassigned', 'assigned']).optional().default('all').describe('Filter by assignment status: "all" (default), "unassigned" (not on any day), or "assigned" (scheduled on a day)'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'places', mode: 'read' },
  })
  async listPlaces(
    { tripId, search, category, tag, assignment }: {
      tripId: number; search?: string; category?: string; tag?: string;
      assignment?: 'all' | 'unassigned' | 'assigned';
    },
    ctx: McpContext,
  ) {
    if (!this.db.canAccessTrip(tripId, ctx.userId)) return noAccess();
    const places = this.places.list(String(tripId), { search, category, tag, assignment });
    return ok({ places });
  }

  // The list_categories tool moved to the DI-discovered
  // src/nest/categories/categories.mcp.ts (@McpController).

  // --- SEARCH ---

  @Tool({
    name: 'search_place',
    description: 'Search for a real-world place by name or address. Returns results with osm_id (and google_place_id/google_ftid if configured). Use these IDs when calling create_place so the app can display opening hours, ratings, and map links.',
    inputSchema: {
      query: z.string().min(1).max(500).describe('Place name or address to search for'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'places', mode: 'read' },
  })
  async searchPlace({ query }: { query: string }, ctx: McpContext) {
    try {
      const result = await this.maps.searchPlaces(ctx.userId, query);
      return ok(result);
    } catch {
      return { content: [{ type: 'text' as const, text: 'Place search failed.' }], isError: true };
    }
  }

  @Tool({
    name: 'import_places_from_url',
    description: 'Import places from a shared Google Maps or Naver Maps list URL. Returns the imported places and count. The list must be shared publicly.',
    inputSchema: {
      tripId: z.number().int().positive(),
      url: z.string().url().describe('Publicly shared Google Maps list URL (maps.app.goo.gl/...) or Naver Maps list URL'),
      source: z.enum(['google-list', 'naver-list']).describe('List source: "google-list" for Google Maps saved places, "naver-list" for Naver Maps'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'places', mode: 'write' },
  })
  async importPlacesFromUrl(
    { tripId, url, source }: { tripId: number; url: string; source: 'google-list' | 'naver-list' },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.db.canAccessTrip(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('place_edit', tripId, ctx.userId)) return permissionDenied();

    const result = source === 'google-list'
      ? await this.places.importGoogleList(String(tripId), url)
      : await this.places.importNaverList(String(tripId), url);

    if ('error' in result) {
      return { content: [{ type: 'text' as const, text: result.error }], isError: true };
    }

    for (const place of result.places) {
      this.guards.safeBroadcast(tripId, 'place:created', { place });
    }
    return ok({ places: result.places, count: result.places.length, listName: result.listName, skipped: result.skipped });
  }

  @Tool({
    name: 'bulk_delete_places',
    description: 'Delete multiple places from a trip at once. Removes all day assignments for each place as well. Warn the user before calling this — it cannot be undone.',
    inputSchema: {
      tripId: z.number().int().positive(),
      placeIds: z.array(z.number().int().positive()).min(1).max(200),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'places', mode: 'write' },
  })
  async bulkDeletePlaces({ tripId, placeIds }: { tripId: number; placeIds: number[] }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.db.canAccessTrip(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('place_edit', tripId, ctx.userId)) return permissionDenied();

    // Trip-scoped, and ahead of the DELETE: journey_entries.source_place_id is
    // ON DELETE SET NULL, so a hook that ran afterwards found nothing left to
    // detach and left the entries as orphans.
    const scoped = this.places.scopedIds(String(tripId), placeIds);
    for (const id of scoped) {
      try { this.journey.onPlaceDeleted(id); } catch { /* non-fatal */ }
    }
    // The link is gone once the places are, so read it first (#1298).
    const expenseIds = this.places.linkedExpenseIds(tripId, scoped);
    const deleted = await this.places.removeMany(String(tripId), placeIds);
    for (const id of deleted) this.guards.safeBroadcast(tripId, 'place:deleted', { placeId: id });
    for (const itemId of expenseIds) this.guards.safeBroadcast(tripId, 'budget:deleted', { itemId });
    return ok({ deleted, count: deleted.length });
  }

  @Tool({
    name: 'bulk_update_places',
    description: 'Update many places in a trip at once, applying the SAME field values to every listed place. Use this for sweeping edits — e.g. re-categorising a batch of POIs (set category_id for 80 places) — in a single call instead of one update_place per place. Only the fields you set are changed; everything else on each place is preserved. Use list_categories for category_id.',
    inputSchema: {
      tripId: z.number().int().positive(),
      placeIds: z.array(z.number().int().positive()).min(1).max(500).describe('IDs of the places to update (from list_places)'),
      category_id: z.number().int().positive().optional().describe('Category ID — use list_categories'),
      price: z.number().optional(),
      currency: z.string().length(3).optional(),
      transport_mode: z.enum(['walking', 'driving', 'cycling', 'transit', 'flight']).optional(),
      place_time: z.string().max(50).optional().describe('Scheduled time (e.g. "09:00")'),
      end_time: z.string().max(50).optional().describe('End time (e.g. "11:00")'),
      duration_minutes: z.number().int().positive().optional(),
      notes: z.string().max(2000).optional(),
      website: placeWebsiteSchema.optional(),
      phone: z.string().max(50).optional(),
      description: z.string().max(2000).optional(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'places', mode: 'write' },
  })
  async bulkUpdatePlaces(
    { tripId, placeIds, category_id, price, currency, transport_mode, place_time, end_time, duration_minutes, notes, website, phone, description }: {
      tripId: number; placeIds: number[]; category_id?: number; price?: number; currency?: string;
      transport_mode?: 'walking' | 'driving' | 'cycling' | 'transit' | 'flight'; place_time?: string;
      end_time?: string; duration_minutes?: number; notes?: string; website?: string; phone?: string;
      description?: string;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.db.canAccessTrip(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('place_edit', tripId, ctx.userId)) return permissionDenied();

    const fields = { category_id, price, currency, transport_mode, place_time, end_time, duration_minutes, notes, website, phone, description };
    if (Object.values(fields).every(v => v === undefined)) {
      return { content: [{ type: 'text' as const, text: 'Provide at least one field to update.' }], isError: true };
    }

    const updated = await this.places.updateMany(String(tripId), placeIds, fields);
    for (const place of updated) this.guards.safeBroadcast(tripId, 'place:updated', { place });
    return ok({ count: updated.length, updatedIds: updated.map(p => p.id), skipped: placeIds.length - updated.length });
  }

  @ResourceTemplate({
    name: 'trip-places',
    uriTemplate: 'trek://trips/{tripId}/places',
    description: 'All places/POIs in a trip, optionally filtered by assignment status (e.g. ?assignment=unassigned)',
    mimeType: 'application/json',
    access: { group: 'places', mode: 'read' },
  })
  async tripPlacesResource(uri: URL, { tripId }: { tripId: string | string[] }, ctx: McpContext) {
    const id = parseId(tripId);
    if (id === null || !this.db.canAccessTrip(id, ctx.userId)) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Trip not found or access denied' }),
        }],
      };
    }
    const assignment = uri.searchParams.get('assignment') as 'all' | 'unassigned' | 'assigned' | null;
    const places = this.places.list(String(id), { assignment: assignment ?? undefined });
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(places, null, 2),
      }],
    };
  }
}
