import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { DatabaseService } from '../database/database.service';
import type { TripAccess } from '../database/database.service';
import { PermissionsService } from '../permissions/permissions.service';
import { QueryHelpersService } from '../query-helpers/query-helpers.service';
import { PlacePhotoCacheService } from '../place-photos/place-photo-cache.service';
import { SettingsService } from '../settings/settings.service';
import type { User } from '../../types';

type Trip = TripAccess;

const PLACE_PHOTO_PROXY_PREFIX = '/api/maps/place-photo/';

/**
 * Place photo proxy URLs (`/api/maps/place-photo/<id>/bytes`) are served by the
 * JWT-guarded MapsController, so they 401 for an unauthenticated shared-trip
 * viewer. Rewrite them to the public, token-scoped equivalent
 * (`/api/shared/<token>/place-photo/<id>/bytes`) so thumbnails load in a shared
 * link. A simple prefix swap keeps the already-encoded placeId segment intact, so
 * the URL round-trips. Non-proxy URLs (data:, /uploads/, null) pass through.
 */
function rewritePlacePhotoUrl(url: string | null | undefined, token: string): string | null {
  if (typeof url === 'string' && url.startsWith(PLACE_PHOTO_PROXY_PREFIX)) {
    return `/api/shared/${token}/place-photo/${url.slice(PLACE_PHOTO_PROXY_PREFIX.length)}`;
  }
  return url ?? null;
}

export interface SharePermissions {
  share_map?: boolean;
  share_bookings?: boolean;
  share_packing?: boolean;
  share_budget?: boolean;
  share_collab?: boolean;
}

export interface ShareTokenInfo {
  token: string;
  created_at: string;
  share_map: boolean;
  share_bookings: boolean;
  share_packing: boolean;
  share_budget: boolean;
  share_collab: boolean;
}

/**
 * Public share links — the legacy shareService SQL folded in over the injected
 * DatabaseService. Trip access and the 'share_manage' permission gate
 * create/delete; the shared read is public.
 */
@Injectable()
export class ShareService {
  constructor(
    private readonly dbs: DatabaseService,
    private readonly settings: SettingsService,
    private readonly permissions: PermissionsService,
    private readonly queryHelpers: QueryHelpersService,
    private readonly photoCache: PlacePhotoCacheService,
  ) {}

  verifyTripAccess(tripId: string, userId: number) {
    return this.dbs.canAccessTrip(tripId, userId);
  }

  canManage(trip: Trip, user: User): boolean {
    return this.permissions.checkPermission('share_manage', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  /**
   * Creates a new share link or updates the permissions on an existing one.
   * Returns an object with the token string and whether it was newly created.
   *
   * Share links carry a 90-day TTL; updating an existing link renews it, so a
   * link the owner is actively managing never expires under them. Rows created
   * before the expires_at migration keep NULL until touched and remain valid
   * indefinitely; an explicit update moves them onto the TTL.
   */
  createOrUpdate(tripId: string, userId: number, permissions: SharePermissions): { token: string; created: boolean } {
    const {
      share_map = true,
      share_bookings = true,
      share_packing = false,
      share_budget = false,
      share_collab = false,
    } = permissions;

    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    return this.dbs.transaction(() => {
      const existing = this.dbs.get<{ token: string }>('SELECT token FROM share_tokens WHERE trip_id = ?', tripId);
      if (existing) {
        this.dbs.run(
          'UPDATE share_tokens SET share_map = ?, share_bookings = ?, share_packing = ?, share_budget = ?, share_collab = ?, expires_at = ? WHERE trip_id = ?',
          share_map ? 1 : 0, share_bookings ? 1 : 0, share_packing ? 1 : 0, share_budget ? 1 : 0, share_collab ? 1 : 0, expiresAt, tripId,
        );
        return { token: existing.token, created: false };
      }

      const token = crypto.randomBytes(24).toString('base64url');
      this.dbs.run(
        'INSERT INTO share_tokens (trip_id, token, created_by, share_map, share_bookings, share_packing, share_budget, share_collab, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        tripId, token, userId, share_map ? 1 : 0, share_bookings ? 1 : 0, share_packing ? 1 : 0, share_budget ? 1 : 0, share_collab ? 1 : 0, expiresAt,
      );
      return { token, created: true };
    });
  }

  /**
   * Returns share token info for a trip, or null if no share link exists.
   */
  get(tripId: string): ShareTokenInfo | null {
    const row = this.dbs.get<any>('SELECT * FROM share_tokens WHERE trip_id = ?', tripId);
    if (!row) return null;
    return {
      token: row.token,
      created_at: row.created_at,
      share_map: !!row.share_map,
      share_bookings: !!row.share_bookings,
      share_packing: !!row.share_packing,
      share_budget: !!row.share_budget,
      share_collab: !!row.share_collab,
    };
  }

  /**
   * Deletes the share token for a trip.
   */
  remove(tripId: string): void {
    this.dbs.run('DELETE FROM share_tokens WHERE trip_id = ?', tripId);
  }

  /**
   * Loads the full public trip data for a share token, filtered by the token's
   * permission flags. Returns null if the token is invalid or the trip is gone.
   *
   * Every share flag is honoured server-side — the client gates these too, but
   * it must not rely on that (mirrors journeyShareService). A withheld section
   * is never even queried. share_map covers the whole itinerary: days, their
   * assignments/notes, and the place list with coordinates, addresses and notes.
   */
  getSharedTripData(token: string): Record<string, any> | null {
    const shareRow = this.dbs.get<any>(
      "SELECT * FROM share_tokens WHERE token = ? AND (expires_at IS NULL OR expires_at > datetime('now'))",
      token,
    );
    if (!shareRow) return null;

    const tripId = shareRow.trip_id;

    // Trip
    const trip = this.dbs.get(
      'SELECT id, title, description, start_date, end_date, cover_image, currency FROM trips WHERE id = ?',
      tripId,
    );
    if (!trip) return null;

    const permissions = {
      share_map: !!shareRow.share_map,
      share_bookings: !!shareRow.share_bookings,
      share_packing: !!shareRow.share_packing,
      share_budget: !!shareRow.share_budget,
      share_collab: !!shareRow.share_collab,
    };

    // Itinerary — days with assignments/notes, and the place pool
    let days: any[] = [];
    let assignments: Record<number, any[]> = {};
    let dayNotes: Record<number, any[]> = {};
    let places: any[] = [];
    if (permissions.share_map) {
      days = this.dbs.all<any>('SELECT * FROM days WHERE trip_id = ? ORDER BY day_number ASC', tripId);
      const dayIds = days.map(d => d.id);

      if (dayIds.length > 0) {
        const ph = dayIds.map(() => '?').join(',');
        const allAssignments = this.dbs.all<any>(`
          SELECT da.*, p.id as place_id, p.name as place_name, p.description as place_description,
            p.lat, p.lng, p.address, p.category_id, p.price, p.currency as place_currency,
            COALESCE(da.assignment_time, p.place_time) as place_time,
            COALESCE(da.assignment_end_time, p.end_time) as end_time,
            p.duration_minutes, p.notes as place_notes, p.image_url, p.transport_mode,
            c.name as category_name, c.color as category_color, c.icon as category_icon
          FROM day_assignments da
          JOIN places p ON da.place_id = p.id
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE da.day_id IN (${ph})
          ORDER BY da.order_index ASC, da.created_at ASC
        `, ...dayIds);

        const placeIds = [...new Set(allAssignments.map((a: any) => a.place_id))];
        const tagsByPlace = this.queryHelpers.loadTagsByPlaceIds(placeIds, { compact: true });

        const byDay: Record<number, any[]> = {};
        for (const a of allAssignments as any[]) {
          if (!byDay[a.day_id]) byDay[a.day_id] = [];
          byDay[a.day_id].push({
            id: a.id, day_id: a.day_id, order_index: a.order_index, notes: a.notes,
            place: {
              id: a.place_id, name: a.place_name, description: a.place_description,
              lat: a.lat, lng: a.lng, address: a.address, category_id: a.category_id,
              price: a.price, place_time: a.place_time, end_time: a.end_time,
              image_url: rewritePlacePhotoUrl(a.image_url, token), transport_mode: a.transport_mode,
              category: a.category_id ? { id: a.category_id, name: a.category_name, color: a.category_color, icon: a.category_icon } : null,
              tags: tagsByPlace[a.place_id] ?? [],
            }
          });
        }
        assignments = byDay;

        const allNotes = this.dbs.all<any>(`SELECT * FROM day_notes WHERE day_id IN (${ph}) ORDER BY sort_order ASC, created_at ASC`, ...dayIds);
        const notesByDay: Record<number, any[]> = {};
        for (const n of allNotes as any[]) {
          if (!notesByDay[n.day_id]) notesByDay[n.day_id] = [];
          notesByDay[n.day_id].push(n);
        }
        dayNotes = notesByDay;
      }

      places = this.dbs.all<any>(`
        SELECT p.*, c.name as category_name, c.color as category_color, c.icon as category_icon
        FROM places p LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.trip_id = ? ORDER BY p.created_at DESC
      `, tripId).map((p) => ({ ...p, image_url: rewritePlacePhotoUrl(p.image_url, token) }));
    }

    // Bookings — reservations carry per-day positions so the client can render
    // the same order as the planner
    let reservations: any[] = [];
    let accommodations: unknown[] = [];
    if (permissions.share_bookings) {
      const dayPositions = this.dbs.all<{ reservation_id: number; day_id: number; position: number }>(`
        SELECT rdp.reservation_id, rdp.day_id, rdp.position
        FROM reservation_day_positions rdp
        JOIN reservations r ON rdp.reservation_id = r.id
        WHERE r.trip_id = ?
      `, tripId);

      const posMap = new Map<number, Record<number, number>>();
      for (const dp of dayPositions) {
        if (!posMap.has(dp.reservation_id)) posMap.set(dp.reservation_id, {});
        posMap.get(dp.reservation_id)![dp.day_id] = dp.position;
      }
      reservations = this.dbs.all<any>('SELECT * FROM reservations WHERE trip_id = ? ORDER BY reservation_time ASC', tripId)
        .map((r) => ({ ...r, day_positions: posMap.get(r.id) ?? null }));

      accommodations = this.dbs.all(`
        SELECT a.*, p.name as place_name, p.address as place_address, p.lat as place_lat, p.lng as place_lng
        FROM day_accommodations a JOIN places p ON a.place_id = p.id
        WHERE a.trip_id = ?
      `, tripId);
    }

    // Packing — a public viewer is neither owner nor recipient, so only Common items
    // may surface; never a co-member's private/personal packing items (#858).
    const packing = permissions.share_packing
      ? this.dbs.all('SELECT * FROM packing_items WHERE trip_id = ? AND is_private = 0 ORDER BY sort_order ASC', tripId)
      : [];

    // Budget
    const budget = permissions.share_budget
      ? this.dbs.all('SELECT * FROM budget_items WHERE trip_id = ? ORDER BY category ASC', tripId)
      : [];

    // Categories are a shared global pool (the authed /api/categories list is
    // equally unscoped), so the public payload returns them all too.
    const categories = this.dbs.all('SELECT * FROM categories');

    // Collab messages (only if owner chose to share)
    const collabMessages = permissions.share_collab
      ? this.dbs.all('SELECT m.*, u.username, u.avatar FROM collab_messages m JOIN users u ON m.user_id = u.id WHERE m.trip_id = ? AND m.deleted = 0 ORDER BY m.created_at', tripId)
      : [];

    // Display currency the share owner sees in their Costs view. A public viewer has
    // no logged-in user, so the owner's per-user `default_currency` (with the admin
    // instance default already merged in by getUserSettings) is embedded in the
    // payload and used by the client to convert every expense — otherwise guests
    // fall back to the trip's base currency and see the wrong totals (#1361).
    // getUserSettings merges admin defaults under the user's own settings, so this
    // honours per-user → admin-default; we then fall back to trip currency → EUR
    // (`||` on purpose: an empty-string trip currency also falls back).
    let baseCurrency = (trip as { currency?: string }).currency || 'EUR';
    const ownerSettings: Record<string, unknown> = shareRow.created_by != null
      ? this.settings.getUserSettings(shareRow.created_by)
      : {};
    const ownerDefault = ownerSettings['default_currency'];
    if (typeof ownerDefault === 'string' && ownerDefault.trim()) {
      baseCurrency = ownerDefault.trim();
    }

    // CARTO stamps an "API KEY REQUIRED" watermark into every tile fetched without
    // a key (#2054), and a public viewer has no settings of their own to hold one,
    // so the owner's key travels in this payload. Nothing without a valid share
    // token reaches it, and the key is public in the browser anyway. getUserSettings
    // is the right accessor here even though it is the client-facing one:
    // carto_api_key is encrypted at rest but deliberately unmasked (same as the
    // Mapbox token, both have to reach a browser), and it is the only accessor that
    // composes per-user value → admin instance default → managed-instance key.
    const ownerCartoKey = ownerSettings['carto_api_key'];
    const cartoApiKey = typeof ownerCartoKey === 'string' ? ownerCartoKey.trim() : '';

    return {
      trip, baseCurrency, cartoApiKey, categories, permissions,
      days, assignments, dayNotes, places,
      reservations, accommodations,
      packing, budget,
      collab: collabMessages,
    };
  }

  /**
   * Resolves the storage name (category 'photos-google') for a cached place
   * photo requested through a public share link. Validates that the token is
   * valid + unexpired and that the place actually belongs to that token's trip
   * (matched via the stored proxy URL, which covers both Google `placeId` and
   * Wikimedia `coords:` pseudo-IDs without depending on google_place_id).
   * Returns null — never throws — so the caller answers a plain miss,
   * mirroring the authenticated bytes endpoint.
   */
  async getSharedPlacePhotoKey(token: string, placeId: string): Promise<string | null> {
    const shareRow = this.dbs.get<{ trip_id: string; share_map: number }>(
      "SELECT trip_id, share_map FROM share_tokens WHERE token = ? AND (expires_at IS NULL OR expires_at > datetime('now'))",
      token,
    );
    if (!shareRow) return null;
    // Place photos belong to the map/itinerary section — withhold them when the
    // owner disabled the map, matching getSharedTripData which no longer returns
    // the places (and thus their ids) in that case.
    if (!shareRow.share_map) return null;

    const expectedUrl = `${PLACE_PHOTO_PROXY_PREFIX}${encodeURIComponent(placeId)}/bytes`;
    const place = this.dbs.get('SELECT 1 FROM places WHERE trip_id = ? AND image_url = ?', shareRow.trip_id, expectedUrl);
    if (!place) return null;

    return this.photoCache.serveKey(placeId);
  }
}
