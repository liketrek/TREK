import {
  McpController, Tool, ResourceTemplate, type McpContext,
  TOOL_ANNOTATIONS_WRITE, TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, ok,
} from '@trek/nest-mcp';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service';
import { PlacesService } from '../places/places.service';
import { safeBroadcast, noAccess, hasTripPermission, permissionDenied } from '../../mcp/tools/_shared';
import { DatabaseService } from '../database/database.service';
import { DaysService } from './days.service';

function parseId(value: string | string[]): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Day MCP surface — ported 1:1 from the legacy registrars: the seven tools of
 * src/mcp/tools/days.ts and the trek://trips/{tripId}/days +
 * trek://trips/{tripId}/accommodations resources from src/mcp/resources.ts
 * (identical names, descriptions, schemas, annotations, error/payload shapes
 * and broadcasts). The legacy registration-time gates map to the declarative
 * trips write/read access markers (registerDayTools' whole-registrar
 * `canWrite(scopes, 'trips')` early return and the resources' canReadTrips
 * checks, resolved by trekMcpAccessPolicy — note canReadTrips also accepted
 * trips:delete / trips:share-only tokens; the declarative read marker is
 * marginally narrower for those, same trade day-notes made). No addon gate —
 * days are core.
 */
@McpController()
export class DaysMcp {
  constructor(
    private readonly days: DaysService,
    private readonly db: DatabaseService,
    private readonly places: PlacesService,
    private readonly auth: AuthService,
  ) {}

  @Tool({
    name: 'update_day',
    description: 'Set the title of a day in a trip (e.g. "Arrival in Paris", "Free day").',
    inputSchema: {
      tripId: z.number().int().positive(),
      dayId: z.number().int().positive(),
      title: z.string().max(200).nullable().describe('Day title, or null to clear it'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'trips', mode: 'write' },
  })
  async updateDay(
    { tripId, dayId, title }: { tripId: number; dayId: number; title: string | null },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.days.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    const current = this.days.getDay(dayId, tripId);
    if (!current) return { content: [{ type: 'text' as const, text: 'Day not found.' }], isError: true };
    const updated = this.days.update(dayId, current, { title });
    safeBroadcast(tripId, 'day:updated', { day: updated });
    return ok({ day: updated });
  }

  @Tool({
    name: 'create_day',
    description: 'Add a new day to a trip (optionally with a specific date and notes).',
    inputSchema: {
      tripId: z.number().int().positive(),
      date: z.string().optional().describe('ISO date string YYYY-MM-DD, optional for dateless trips'),
      notes: z.string().optional(),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'trips', mode: 'write' },
  })
  async createDay(
    { tripId, date, notes }: { tripId: number; date?: string; notes?: string },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.days.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    const day = this.days.create(tripId, date, notes);
    safeBroadcast(tripId, 'day:created', { day });
    return ok({ day });
  }

  @Tool({
    name: 'delete_day',
    description: 'Delete a day from a trip.',
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
    if (!hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    if (!this.days.getDay(dayId, tripId)) return { content: [{ type: 'text' as const, text: 'Day not found.' }], isError: true };
    this.days.remove(dayId);
    // REST parity shape ({ dayId }) — the client reads payload.dayId, so the { id }
    // variant never removed the day from collaborator screens.
    safeBroadcast(tripId, 'day:deleted', { dayId });
    return ok({ success: true });
  }

  @Tool({
    name: 'create_accommodation',
    description: 'Add an accommodation (hotel, Airbnb, etc.) to a trip, linked to a place and a date range.',
    inputSchema: {
      tripId: z.number().int().positive(),
      place_id: z.number().int().positive().describe('The place to use as the accommodation'),
      start_day_id: z.number().int().positive().describe('Check-in day ID'),
      end_day_id: z.number().int().positive().describe('Check-out day ID'),
      check_in: z.string().max(10).optional().describe('Check-in time e.g. "15:00"'),
      check_in_end: z.string().max(10).optional().describe('Check-in window end time e.g. "20:00"'),
      check_out: z.string().max(10).optional().describe('Check-out time e.g. "11:00"'),
      confirmation: z.string().max(100).optional(),
      notes: z.string().max(1000).optional(),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'trips', mode: 'write' },
  })
  async createAccommodation(
    { tripId, place_id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes }: {
      tripId: number; place_id: number; start_day_id: number; end_day_id: number;
      check_in?: string; check_in_end?: string; check_out?: string; confirmation?: string; notes?: string;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.days.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    const errors = this.days.validateAccommodationRefs(tripId, place_id, start_day_id, end_day_id);
    if (errors.length > 0) return { content: [{ type: 'text' as const, text: errors.map(e => e.message).join(', ') }], isError: true };
    const accommodation = this.days.createAccommodation(tripId, { place_id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes });
    safeBroadcast(tripId, 'accommodation:created', { accommodation });
    return ok({ accommodation });
  }

  @Tool({
    name: 'create_place_accommodation',
    description: 'Create a new place and immediately set it as an accommodation for a date range in one atomic operation. Use place details from search_place results. Only use when the place does not yet exist — if it already exists, use create_accommodation directly. Set price + currency to record the accommodation cost so it shows on the item.',
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
      osm_id: z.string().optional().describe('OpenStreetMap ID from search_place (e.g. "way:12345")'),
      place_notes: z.string().max(2000).optional().describe('Notes for the place'),
      website: z.string().max(500).optional(),
      phone: z.string().max(50).optional(),
      start_day_id: z.number().int().positive().describe('Check-in day ID'),
      end_day_id: z.number().int().positive().describe('Check-out day ID'),
      check_in: z.string().max(10).optional().describe('Check-in time e.g. "15:00"'),
      check_in_end: z.string().max(10).optional().describe('Check-in window end time e.g. "20:00"'),
      check_out: z.string().max(10).optional().describe('Check-out time e.g. "11:00"'),
      confirmation: z.string().max(100).optional(),
      accommodation_notes: z.string().max(1000).optional().describe('Notes for the accommodation'),
      price: z.number().nonnegative().optional().describe('Total accommodation cost (shown on the item)'),
      currency: z.string().length(3).optional().describe('ISO 4217 currency code (e.g. "EUR", "USD")'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'trips', mode: 'write' },
  })
  async createPlaceAccommodation(
    { tripId, name, description, lat, lng, address, category_id, google_place_id, google_ftid, osm_id, place_notes, website, phone, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, accommodation_notes, price, currency }: {
      tripId: number; name: string; description?: string; lat?: number; lng?: number; address?: string;
      category_id?: number; google_place_id?: string; google_ftid?: string; osm_id?: string;
      place_notes?: string; website?: string; phone?: string; start_day_id: number; end_day_id: number;
      check_in?: string; check_in_end?: string; check_out?: string; confirmation?: string;
      accommodation_notes?: string; price?: number; currency?: string;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.days.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    const dayErrors = this.days.validateAccommodationRefs(tripId, undefined, start_day_id, end_day_id);
    if (dayErrors.length > 0) return { content: [{ type: 'text' as const, text: dayErrors.map(e => e.message).join(', ') }], isError: true };
    try {
      const result = this.db.transaction(() => {
        const place = this.places.create(String(tripId), { name, description, lat, lng, address, category_id, google_place_id, google_ftid, osm_id, notes: place_notes, website, phone, price, currency });
        const accommodation = this.days.createAccommodation(tripId, { place_id: place.id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes: accommodation_notes });
        return { place, accommodation };
      });
      safeBroadcast(tripId, 'place:created', { place: result.place });
      safeBroadcast(tripId, 'accommodation:created', { accommodation: result.accommodation });
      return ok(result);
    } catch {
      return { content: [{ type: 'text' as const, text: 'Failed to create place and accommodation.' }], isError: true };
    }
  }

  @Tool({
    name: 'update_accommodation',
    description: 'Update fields on an existing accommodation.',
    inputSchema: {
      tripId: z.number().int().positive(),
      accommodationId: z.number().int().positive(),
      place_id: z.number().int().positive().optional(),
      start_day_id: z.number().int().positive().optional(),
      end_day_id: z.number().int().positive().optional(),
      check_in: z.string().max(10).optional(),
      check_in_end: z.string().max(10).optional().describe('Check-in window end time e.g. "20:00"'),
      check_out: z.string().max(10).optional(),
      confirmation: z.string().max(100).optional(),
      notes: z.string().max(1000).optional(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'trips', mode: 'write' },
  })
  async updateAccommodation(
    { tripId, accommodationId, place_id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes }: {
      tripId: number; accommodationId: number; place_id?: number; start_day_id?: number; end_day_id?: number;
      check_in?: string; check_in_end?: string; check_out?: string; confirmation?: string; notes?: string;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.days.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    const existing = this.days.getAccommodation(accommodationId, tripId);
    if (!existing) return { content: [{ type: 'text' as const, text: 'Accommodation not found.' }], isError: true };
    const accommodation = this.days.updateAccommodation(accommodationId, existing, { place_id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes });
    safeBroadcast(tripId, 'accommodation:updated', { accommodation });
    return ok({ accommodation });
  }

  @Tool({
    name: 'delete_accommodation',
    description: 'Delete an accommodation from a trip.',
    inputSchema: {
      tripId: z.number().int().positive(),
      accommodationId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'trips', mode: 'write' },
  })
  async deleteAccommodation({ tripId, accommodationId }: { tripId: number; accommodationId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.days.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    if (!this.days.getAccommodation(accommodationId, tripId)) return { content: [{ type: 'text' as const, text: 'Accommodation not found.' }], isError: true };
    const { linkedReservationId } = this.days.deleteAccommodation(accommodationId);
    safeBroadcast(tripId, 'accommodation:deleted', { id: accommodationId, linkedReservationId });
    return ok({ success: true, linkedReservationId });
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

  @ResourceTemplate({
    name: 'trip-accommodations',
    uriTemplate: 'trek://trips/{tripId}/accommodations',
    description: 'Accommodations (hotels, rentals) for a trip with check-in/out details',
    mimeType: 'application/json',
    access: { group: 'trips', mode: 'read' },
  })
  async tripAccommodationsResource(uri: URL, { tripId }: { tripId: string | string[] }, ctx: McpContext) {
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
    const accommodations = this.days.listAccommodations(id);
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(accommodations, null, 2),
      }],
    };
  }
}
