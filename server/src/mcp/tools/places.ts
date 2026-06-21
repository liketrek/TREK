import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import { canAccessTrip, db } from '../../db/database';
import { isDemoUser } from '../../services/authService';
import { deletePlacesMany, importGoogleList, importNaverList, listPlaces, createPlace, updatePlace, deletePlace } from '../../services/placeService';
import { createAssignment, dayExists } from '../../services/assignmentService';
import { onPlaceDeleted } from '../../services/journeyService';
import { listCategories } from '../../services/categoryService';
import { searchPlaces } from '../../services/mapsService';
import {
  safeBroadcast, TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE,
  TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, noAccess, ok, hasTripPermission, permissionDenied,
} from './_shared';
import { canRead, canWrite } from '../scopes';

export function registerPlaceTools(server: McpServer, userId: number, scopes: string[] | null): void {
  const R = canRead(scopes, 'places');
  const W = canWrite(scopes, 'places');

  // --- PLACES ---

  if (W) server.registerTool(
    'create_place',
    {
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
        website: z.string().max(500).optional(),
        phone: z.string().max(50).optional(),
        price: z.number().nonnegative().optional().describe('Cost of this place/activity (e.g. ticket price, entry fee)'),
        currency: z.string().length(3).optional().describe('ISO 4217 currency code (e.g. "EUR", "USD")'),
      },
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ tripId, name, description, lat, lng, address, category_id, google_place_id, google_ftid, osm_id, notes, website, phone, price, currency }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('place_edit', tripId, userId)) return permissionDenied();
      const place = createPlace(String(tripId), { name, description, lat, lng, address, category_id, google_place_id, google_ftid, osm_id, notes, website, phone, price, currency });
      safeBroadcast(tripId, 'place:created', { place });
      return ok({ place });
    }
  );

  if (W) server.registerTool(
    'create_and_assign_place',
    {
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
        website: z.string().max(500).optional(),
        phone: z.string().max(50).optional(),
        assignment_notes: z.string().max(500).optional().describe('Notes for this day assignment'),
        price: z.number().nonnegative().optional().describe('Cost of this place/activity (e.g. ticket price, entry fee)'),
        currency: z.string().length(3).optional().describe('ISO 4217 currency code (e.g. "EUR", "USD")'),
      },
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ tripId, dayId, name, description, lat, lng, address, category_id, google_place_id, google_ftid, osm_id, place_notes, website, phone, assignment_notes, price, currency }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('place_edit', tripId, userId)) return permissionDenied();
      if (!dayExists(dayId, tripId)) return { content: [{ type: 'text' as const, text: 'Day not found.' }], isError: true };
      try {
        const run = db.transaction(() => {
          const place = createPlace(String(tripId), { name, description, lat, lng, address, category_id, google_place_id, google_ftid, osm_id, notes: place_notes, website, phone, price, currency });
          const assignment = createAssignment(dayId, place.id, assignment_notes ?? null);
          return { place, assignment };
        });
        const result = run();
        safeBroadcast(tripId, 'place:created', { place: result.place });
        safeBroadcast(tripId, 'assignment:created', { assignment: result.assignment });
        return ok(result);
      } catch {
        return { content: [{ type: 'text' as const, text: 'Failed to create place and assignment.' }], isError: true };
      }
    }
  );

  if (W) server.registerTool(
    'update_place',
    {
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
        website: z.string().max(500).optional(),
        phone: z.string().max(50).optional(),
        transport_mode: z.enum(['walking', 'driving', 'cycling', 'transit', 'flight']).optional(),
        osm_id: z.string().optional().describe('OpenStreetMap ID (e.g. "way:12345")'),
        google_place_id: z.string().optional().describe('Google Place ID (e.g. "ChIJd8BlQ2BZwokRAFUEcm_qrcA")'),
        google_ftid: z.string().optional().describe('Google Maps feature ID (e.g. "0x89c259b7abdd4769:0x103aaf1c8bf8a050")'),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ tripId, placeId, name, description, lat, lng, address, category_id, price, currency, place_time, end_time, duration_minutes, notes, website, phone, transport_mode, osm_id, google_place_id, google_ftid }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('place_edit', tripId, userId)) return permissionDenied();
      const place = updatePlace(String(tripId), String(placeId), { name, description, lat, lng, address, category_id, price, currency, place_time, end_time, duration_minutes, notes, website, phone, transport_mode, osm_id, google_place_id, google_ftid });
      if (!place) return { content: [{ type: 'text' as const, text: 'Place not found.' }], isError: true };
      safeBroadcast(tripId, 'place:updated', { place });
      return ok({ place });
    }
  );

  if (W) server.registerTool(
    'delete_place',
    {
      description: 'Delete a place from a trip.',
      inputSchema: {
        tripId: z.number().int().positive(),
        placeId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_DELETE,
    },
    async ({ tripId, placeId }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('place_edit', tripId, userId)) return permissionDenied();
      const deleted = deletePlace(String(tripId), String(placeId));
      if (!deleted) return { content: [{ type: 'text' as const, text: 'Place not found.' }], isError: true };
      safeBroadcast(tripId, 'place:deleted', { placeId });
      return ok({ success: true });
    }
  );

  if (R) server.registerTool(
    'list_places',
    {
      description: 'List all places/POIs in a trip, optionally filtered by assignment status. Use assignment=unassigned to find orphan activities not yet scheduled on any day.',
      inputSchema: {
        tripId: z.number().int().positive(),
        search: z.string().optional(),
        category: z.string().optional(),
        tag: z.string().optional(),
        assignment: z.enum(['all', 'unassigned', 'assigned']).optional().default('all').describe('Filter by assignment status: "all" (default), "unassigned" (not on any day), or "assigned" (scheduled on a day)'),
      },
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async ({ tripId, search, category, tag, assignment }) => {
      if (!canAccessTrip(tripId, userId)) return noAccess();
      const places = listPlaces(String(tripId), { search, category, tag, assignment });
      return ok({ places });
    }
  );

  // --- CATEGORIES ---

  if (R) server.registerTool(
    'list_categories',
    {
      description: 'List all available place categories with their id, name, icon and color. Use category_id when creating or updating places.',
      inputSchema: {},
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async () => {
      const categories = listCategories();
      return ok({ categories });
    }
  );

  // --- SEARCH ---

  if (R) server.registerTool(
    'search_place',
    {
      description: 'Search for a real-world place by name or address. Returns results with osm_id (and google_place_id/google_ftid if configured). Use these IDs when calling create_place so the app can display opening hours, ratings, and map links.',
      inputSchema: {
        query: z.string().min(1).max(500).describe('Place name or address to search for'),
      },
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async ({ query }) => {
      try {
        const result = await searchPlaces(userId, query);
        return ok(result);
      } catch {
        return { content: [{ type: 'text' as const, text: 'Place search failed.' }], isError: true };
      }
    }
  );

  if (W) server.registerTool(
    'import_places_from_url',
    {
      description: 'Import places from a shared Google Maps or Naver Maps list URL. Returns the imported places and count. The list must be shared publicly.',
      inputSchema: {
        tripId: z.number().int().positive(),
        url: z.string().url().describe('Publicly shared Google Maps list URL (maps.app.goo.gl/...) or Naver Maps list URL'),
        source: z.enum(['google-list', 'naver-list']).describe('List source: "google-list" for Google Maps saved places, "naver-list" for Naver Maps'),
      },
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ tripId, url, source }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('place_edit', tripId, userId)) return permissionDenied();

      const result = source === 'google-list'
        ? await importGoogleList(String(tripId), url)
        : await importNaverList(String(tripId), url);

      if ('error' in result) {
        return { content: [{ type: 'text' as const, text: result.error }], isError: true };
      }

      for (const place of result.places) {
        safeBroadcast(tripId, 'place:created', { place });
      }
      return ok({ places: result.places, count: result.places.length, listName: result.listName, skipped: result.skipped });
    }
  );

  if (W) server.registerTool(
    'bulk_delete_places',
    {
      description: 'Delete multiple places from a trip at once. Removes all day assignments for each place as well. Warn the user before calling this — it cannot be undone.',
      inputSchema: {
        tripId: z.number().int().positive(),
        placeIds: z.array(z.number().int().positive()).min(1).max(200),
      },
      annotations: TOOL_ANNOTATIONS_DELETE,
    },
    async ({ tripId, placeIds }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('place_edit', tripId, userId)) return permissionDenied();

      const deleted = deletePlacesMany(String(tripId), placeIds);
      for (const id of deleted) {
        safeBroadcast(tripId, 'place:deleted', { placeId: id });
        try { onPlaceDeleted(id); } catch {}
      }
      return ok({ deleted, count: deleted.length });
    }
  );
}
