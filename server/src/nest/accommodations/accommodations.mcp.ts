import {
  McpController, Tool, ResourceTemplate, type McpContext,
  TOOL_ANNOTATIONS_WRITE, TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, ok,
} from '../../nest-mcp';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { placeWebsiteSchema } from '@trek/shared';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service';
import { PlacesService } from '../places/places.service';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import { DatabaseService } from '../database/database.service';
import { AccommodationsService, type MirrorSender } from './accommodations.service';

function parseId(value: string | string[]): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Accommodation MCP surface. The four tools and the
 * trek://trips/{tripId}/accommodations resource moved here verbatim from
 * DaysMcp when accommodations became their own domain; names, descriptions,
 * schemas, annotations, error shapes and broadcasts are unchanged.
 *
 * It keeps DatabaseService and PlacesService because create_place_accommodation
 * creates the place and the stay in one transaction. That is also what let
 * DaysMcp drop both of them, and DaysModule its PlacesModule import.
 */
@McpController()
export class AccommodationsMcp {
  constructor(
    private readonly accommodations: AccommodationsService,
    private readonly db: DatabaseService,
    private readonly places: PlacesService,
    private readonly auth: AuthService,
    private readonly guards: McpToolGuardsService,
  ) {}

  /** The tools' own broadcast, handed to announceMirror so the day stop a booking
   *  writes is announced exactly as the REST route announces it. */
  private mirrorSender(tripId: number): MirrorSender {
    return (event, payload) => this.guards.safeBroadcast(tripId, event, payload as Record<string, unknown>);
  }

  @Tool({
    name: 'create_accommodation',
    description: 'Add an accommodation (hotel, Airbnb, etc.) to a trip, linked to a place and a date range. This also puts the place on its check-in day, so the stay shows up as a stop on the route.',
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
    if (!this.accommodations.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    const errors = this.accommodations.validateAccommodationRefs(tripId, place_id, start_day_id, end_day_id);
    if (errors.length > 0) return { content: [{ type: 'text' as const, text: errors.map(e => e.message).join(', ') }], isError: true };
    const { accommodation, mirror } = this.accommodations.createAccommodation(tripId, { place_id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes });
    this.guards.safeBroadcast(tripId, 'accommodation:created', { accommodation });
    this.accommodations.announceMirror(tripId, mirror, this.mirrorSender(tripId));
    return ok({ accommodation, assignment: mirror.created });
  }

  @Tool({
    name: 'create_place_accommodation',
    description: 'Create a new place, set it as an accommodation for a date range and put it on its check-in day, in one atomic operation. Use place details from search_place results. Only use when the place does not yet exist — if it already exists, use create_accommodation directly. Set price + currency to record the accommodation cost so it shows on the item.',
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
    if (!this.accommodations.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    const dayErrors = this.accommodations.validateAccommodationRefs(tripId, undefined, start_day_id, end_day_id);
    if (dayErrors.length > 0) return { content: [{ type: 'text' as const, text: dayErrors.map(e => e.message).join(', ') }], isError: true };
    // The website takes the place contract create_place uses, so a bare host
    // gains https (#2483). A value that contract refuses is left off instead of
    // failing the booking: this tool always took any text here, '' as none.
    const site = website ? placeWebsiteSchema.safeParse(website) : null;
    try {
      const result = this.db.transaction(() => {
        const place = this.places.create(String(tripId), { name, description, lat, lng, address, category_id, google_place_id, google_ftid, osm_id, notes: place_notes, website: site?.success ? site.data : undefined, phone, price, currency });
        const { accommodation, mirror } = this.accommodations.createAccommodation(tripId, { place_id: place.id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes: accommodation_notes });
        return { place, accommodation, mirror };
      });
      // The stamped copy, not the one create() returned: booking the night types the
      // place as lodging, and place:created is the only announcement it gets here.
      const place = result.mirror.stamped ?? result.place;
      this.guards.safeBroadcast(tripId, 'place:created', { place });
      this.guards.safeBroadcast(tripId, 'accommodation:created', { accommodation: result.accommodation });
      this.accommodations.announceMirror(tripId, { ...result.mirror, stamped: null }, this.mirrorSender(tripId));
      return ok({ place, accommodation: result.accommodation, assignment: result.mirror.created });
    } catch {
      return { content: [{ type: 'text' as const, text: 'Failed to create place and accommodation.' }], isError: true };
    }
  }

  @Tool({
    name: 'update_accommodation',
    description: 'Update fields on an existing accommodation. Moving it to another check-in day or place moves the stop it put on the route with it.',
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
    if (!this.accommodations.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    const existing = this.accommodations.getAccommodation(accommodationId, tripId);
    if (!existing) return { content: [{ type: 'text' as const, text: 'Accommodation not found.' }], isError: true };
    const { accommodation, mirror } = this.accommodations.updateAccommodation(accommodationId, existing, { place_id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes });
    this.guards.safeBroadcast(tripId, 'accommodation:updated', { accommodation });
    this.accommodations.announceMirror(tripId, mirror, this.mirrorSender(tripId));
    // movedAssignment rather than a delete/create pair: an edit carries the booking's
    // own stop across instead of rebuilding it, so the caller sees the same row.
    return ok({ accommodation, assignment: mirror.created, movedAssignment: mirror.moved, removedAssignments: mirror.removed });
  }

  @Tool({
    name: 'delete_accommodation',
    description: 'Delete an accommodation from a trip. The stop this booking put on its check-in day goes with it; a stop that was already there stays.',
    inputSchema: {
      tripId: z.number().int().positive(),
      accommodationId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'trips', mode: 'write' },
  })
  async deleteAccommodation({ tripId, accommodationId }: { tripId: number; accommodationId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.accommodations.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    if (!this.accommodations.getAccommodation(accommodationId, tripId)) return { content: [{ type: 'text' as const, text: 'Accommodation not found.' }], isError: true };
    // linkedReservationId stays the first one so the tool's answer keeps its shape;
    // linkedReservationIds carries the rest for a block that had more than one booking.
    const { linkedReservationId, linkedReservationIds, mirror } = this.accommodations.deleteAccommodation(accommodationId);
    this.accommodations.announceMirror(tripId, mirror, this.mirrorSender(tripId));
    this.guards.safeBroadcast(tripId, 'accommodation:deleted', { id: accommodationId, linkedReservationId, linkedReservationIds });
    return ok({ success: true, linkedReservationId, linkedReservationIds, removedAssignments: mirror.removed });
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
    if (id === null || !this.accommodations.verifyTripAccess(id, ctx.userId)) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Trip not found or access denied' }),
        }],
      };
    }
    const accommodations = this.accommodations.listAccommodations(id);
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(accommodations, null, 2),
      }],
    };
  }
}
