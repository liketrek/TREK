import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { InjectRepository } from '@mikro-orm/nestjs';
import { PermissionsService } from '../permissions/permissions.service';
import { QueryHelpersService } from '../query-helpers/query-helpers.service';
import { PlacePhotoCacheService } from '../place-photos/place-photo-cache.service';
import { SettingsService } from '../settings/settings.service';
import { UnitOfWork } from '../database/unit-of-work';
import type { User } from '../../types';
import { Reservations } from '../../db/entities/Reservations.entity';
import type { ReservationsRepository } from '../../db/repositories/Reservations.repository';
import { ShareTokens } from '../../db/entities/ShareTokens.entity';
import type { ShareTokensRepository } from '../../db/repositories/ShareTokens.repository';
import { Trips } from '../../db/entities/Trips.entity';
import type { TripsRepository, TripAccess } from '../../db/repositories/Trips.repository';
import { Days } from '../../db/entities/Days.entity';
import type { DaysRepository } from '../../db/repositories/Days.repository';
import { DayAssignments } from '../../db/entities/DayAssignments.entity';
import type { DayAssignmentsRepository } from '../../db/repositories/DayAssignments.repository';
import { DayNotes } from '../../db/entities/DayNotes.entity';
import type { DayNotesRepository } from '../../db/repositories/DayNotes.repository';
import { Places } from '../../db/entities/Places.entity';
import type { PlacesRepository } from '../../db/repositories/Places.repository';
import { PackingItems } from '../../db/entities/PackingItems.entity';
import type { PackingItemsRepository } from '../../db/repositories/PackingItems.repository';
import { BudgetItems } from '../../db/entities/BudgetItems.entity';
import type { BudgetItemsRepository } from '../../db/repositories/BudgetItems.repository';
import { Categories } from '../../db/entities/Categories.entity';
import type { CategoriesRepository } from '../../db/repositories/Categories.repository';
import { CollabMessages } from '../../db/entities/CollabMessages.entity';
import type { CollabMessagesRepository } from '../../db/repositories/CollabMessages.repository';
import { travelOnly, withoutImages } from './share-view.helpers';

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
  share_travel_only?: boolean;
  share_hide_images?: boolean;
}

export interface ShareTokenInfo {
  token: string;
  created_at: string;
  share_map: boolean;
  share_bookings: boolean;
  share_packing: boolean;
  share_budget: boolean;
  share_collab: boolean;
  share_travel_only: boolean;
  share_hide_images: boolean;
}

/**
 * Public share links — `share_tokens` and its cross-domain public reads
 * through repositories (Plan 3h Task 6; 3d Task 4 already converted the
 * reservations-related reads). Trip access and the 'share_manage' permission
 * gate create/delete; the shared read is public.
 */
/**
 * What a place shows the public: where it is, what it is, how to reach it.
 *
 * Left out on purpose: the owner's booking notes and status on the place, the
 * Google identifiers, the routing bookkeeping and the fill figures a road trip
 * keeps for itself. `notes` stays — it is the note somebody wrote to be read
 * on the plan, and the plan is what a link shares.
 *
 * The exact column list now lives as {@link PlacesRepository.listPublicForShare}'s
 * own docstring (Plan 3h Task 6) — this file no longer spells the SQL, so
 * keeping a second copy of the allow-list here would drift from the one the
 * query actually runs.
 */

// What a booking/stay shows the public — never the confirmation number, the
// import trail, or who is travelling — now lives as the exact column list in
// `ReservationsRepository.listPublicForShare`/`listPublicAccommodationsForShare`'s
// own docstrings (Plan 3d Task 4): this file no longer spells the SQL, so
// keeping a second copy of the allow-list here would drift from the one the
// query actually runs.

/**
 * The parts of a booking's metadata that describe the journey rather than the
 * ticket. Legs keep their route, carrier and times; the record locator on a
 * leg, the seat, the price and anything this list does not name stay behind.
 * An allow-list rather than a block-list, because the import writes whatever a
 * provider's confirmation carried, and a new field must not become public by
 * appearing.
 */
const PUBLIC_METADATA_KEYS = new Set([
  'airline', 'flight_number', 'departure_airport', 'arrival_airport',
  'train_number', 'platform', 'operator', 'from', 'to',
  'check_in_time', 'check_in_end_time', 'check_out_time', 'hotel',
  'pickup_location', 'dropoff_location', 'vehicle',
]);
const PUBLIC_LEG_KEYS = new Set([
  'from', 'to', 'airline', 'flight_number', 'train_number', 'platform', 'operator',
  'dep_day_id', 'dep_time', 'arr_day_id', 'arr_time',
]);

function pickKeys(source: Record<string, unknown>, keys: Set<string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
}

/** The public face of a booking's metadata, as the JSON string the row stores. */
export function publicReservationMetadata(raw: unknown): string | null {
  if (raw == null) return null;
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const source = parsed as Record<string, unknown>;
  const out = pickKeys(source, PUBLIC_METADATA_KEYS);
  if (Array.isArray(source.legs)) {
    out.legs = source.legs
      .filter((leg): leg is Record<string, unknown> => !!leg && typeof leg === 'object' && !Array.isArray(leg))
      .map(leg => pickKeys(leg, PUBLIC_LEG_KEYS));
  }
  return JSON.stringify(out);
}

/**
 * A link the page may render as one: http or https, nothing else.
 *
 * The owner types these, and a `javascript:` or `data:` value would otherwise
 * become an anchor on a page anyone with the link can open.
 */
export function publicHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? trimmed : null;
  } catch {
    return null;
  }
}

@Injectable()
export class ShareService {
  constructor(
    private readonly settings: SettingsService,
    private readonly permissions: PermissionsService,
    private readonly queryHelpers: QueryHelpersService,
    private readonly photoCache: PlacePhotoCacheService,
    private readonly uow: UnitOfWork,
    @InjectRepository(Reservations) private readonly reservationsRepo: ReservationsRepository,
    @InjectRepository(ShareTokens) private readonly shareTokens: ShareTokensRepository,
    @InjectRepository(Trips) private readonly trips: TripsRepository,
    @InjectRepository(Days) private readonly days: DaysRepository,
    @InjectRepository(DayAssignments) private readonly dayAssignments: DayAssignmentsRepository,
    @InjectRepository(DayNotes) private readonly dayNotes: DayNotesRepository,
    @InjectRepository(Places) private readonly places: PlacesRepository,
    @InjectRepository(PackingItems) private readonly packingItems: PackingItemsRepository,
    @InjectRepository(BudgetItems) private readonly budgetItems: BudgetItemsRepository,
    @InjectRepository(Categories) private readonly categories: CategoriesRepository,
    @InjectRepository(CollabMessages) private readonly collabMessages: CollabMessagesRepository,
  ) {}

  /** SH-AP1 — the same `TripsRepository.findAccessible` every other access-primitive call in this plan reuses. */
  async verifyTripAccess(tripId: string, userId: number): Promise<Trip | undefined> {
    return await this.trips.findAccessible(tripId, userId);
  }

  async canManage(trip: Trip, user: User): Promise<boolean> {
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
  async createOrUpdate(tripId: string, userId: number, permissions: SharePermissions): Promise<{ token: string; created: boolean }> {
    const {
      share_map = true,
      share_bookings = true,
      share_packing = false,
      share_budget = false,
      share_collab = false,
      share_travel_only = false,
      share_hide_images = false,
    } = permissions;

    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    return await this.uow.transactional(async () => {
      const existing = await this.shareTokens.findTokenByTrip(tripId);
      if (existing) {
        await this.shareTokens.updateFlagsByTrip(tripId, {
          share_map: share_map ? 1 : 0,
          share_bookings: share_bookings ? 1 : 0,
          share_packing: share_packing ? 1 : 0,
          share_budget: share_budget ? 1 : 0,
          share_collab: share_collab ? 1 : 0,
          share_travel_only: share_travel_only ? 1 : 0,
          share_hide_images: share_hide_images ? 1 : 0,
          expires_at: expiresAt,
        });
        return { token: existing.token, created: false };
      }

      const token = crypto.randomBytes(24).toString('base64url');
      await this.shareTokens.insertNew({
        trip_id: tripId,
        token,
        created_by: userId,
        share_map: share_map ? 1 : 0,
        share_bookings: share_bookings ? 1 : 0,
        share_packing: share_packing ? 1 : 0,
        share_budget: share_budget ? 1 : 0,
        share_collab: share_collab ? 1 : 0,
        share_travel_only: share_travel_only ? 1 : 0,
        share_hide_images: share_hide_images ? 1 : 0,
        expires_at: expiresAt,
      });
      return { token, created: true };
    });
  }

  /**
   * Returns share token info for a trip, or null if no share link exists.
   */
  async get(tripId: string): Promise<ShareTokenInfo | null> {
    const row = await this.shareTokens.findRawByTrip(tripId);
    if (!row) return null;
    return {
      token: row.token,
      created_at: row.created_at ?? '',
      share_map: !!row.share_map,
      share_bookings: !!row.share_bookings,
      share_packing: !!row.share_packing,
      share_budget: !!row.share_budget,
      share_collab: !!row.share_collab,
      share_travel_only: !!row.share_travel_only,
      share_hide_images: !!row.share_hide_images,
    };
  }

  /**
   * Deletes the share token for a trip.
   */
  async remove(tripId: string): Promise<void> {
    await this.shareTokens.deleteByTrip(tripId);
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
  /**
   * The ordered stops of every public booking on the trip, by booking id.
   *
   * One query for the lot rather than one per booking: the map draws the
   * route from these, and a trip with forty bookings is not forty round trips
   * to the database.
   */
  private async publicEndpointsByReservation(tripId: number): Promise<Map<number, Array<Record<string, unknown>>>> {
    const rows = await this.reservationsRepo.listEndpointsForShare(tripId);
    const out = new Map<number, Array<Record<string, unknown>>>();
    for (const { reservation_id, ...endpoint } of rows) {
      if (!out.has(reservation_id)) out.set(reservation_id, []);
      out.get(reservation_id)!.push(endpoint);
    }
    return out;
  }

  async getSharedTripData(token: string): Promise<Record<string, any> | null> {
    const shareRow = await this.shareTokens.findValidByToken(token);
    if (!shareRow) return null;

    const tripId = shareRow.trip_id;

    // Trip
    const trip = await this.trips.findPublicForShare(tripId);
    if (!trip) return null;

    const permissions = {
      share_map: !!shareRow.share_map,
      share_bookings: !!shareRow.share_bookings,
      share_packing: !!shareRow.share_packing,
      share_budget: !!shareRow.share_budget,
      share_collab: !!shareRow.share_collab,
      share_travel_only: !!shareRow.share_travel_only,
      share_hide_images: !!shareRow.share_hide_images,
    };

    // Itinerary — days with assignments/notes, and the place pool
    let days: any[] = [];
    let assignments: Record<number, any[]> = {};
    let dayNotes: Record<number, any[]> = {};
    let places: any[] = [];
    if (permissions.share_map) {
      days = await this.days.listByTrip(tripId);
      const dayIds = days.map(d => d.id);

      if (dayIds.length > 0) {
        const allAssignments = await this.dayAssignments.listPublicForShare(dayIds);

        const placeIds = [...new Set(allAssignments.map((a) => a.place_id))];
        const tagsByPlace = await this.queryHelpers.loadTagsByPlaceIds(placeIds, { compact: true });

        const byDay: Record<number, any[]> = {};
        for (const a of allAssignments) {
          if (!byDay[a.day_id]) byDay[a.day_id] = [];
          byDay[a.day_id].push({
            id: a.id, day_id: a.day_id, order_index: a.order_index, notes: a.notes,
            // The shared page shows the booking as its own chip on the day, so it needs
            // to know which stop is that booking and leave it out of the list.
            accommodation_id: a.accommodation_id ?? null,
            place: {
              id: a.place_id, name: a.place_name, description: a.place_description,
              lat: a.lat, lng: a.lng, address: a.address, category_id: a.category_id,
              price: a.price, place_time: a.place_time, end_time: a.end_time,
              duration_minutes: a.duration_minutes, notes: a.place_notes,
              website: publicHttpUrl(a.website), phone: a.phone,
              image_url: rewritePlacePhotoUrl(a.image_url, token), transport_mode: a.transport_mode,
              category: a.category_id ? { id: a.category_id, name: a.category_name, color: a.category_color, icon: a.category_icon } : null,
              tags: tagsByPlace[a.place_id] ?? [],
            }
          });
        }
        assignments = byDay;

        const allNotes = await this.dayNotes.listByDayIds(dayIds);
        const notesByDay: Record<number, any[]> = {};
        for (const n of allNotes) {
          if (!notesByDay[n.day_id]) notesByDay[n.day_id] = [];
          notesByDay[n.day_id].push(n);
        }
        dayNotes = notesByDay;
      }

      // Named columns, not p.*: the pool used to travel whole, which put the
      // owner's booking notes on the place, the Google ids and the import
      // bookkeeping in front of anybody holding the link (#2320).
      places = (await this.places.listPublicForShare(tripId)).map((p) => ({
        ...p,
        image_url: rewritePlacePhotoUrl(p.image_url, token),
        website: publicHttpUrl(p.website),
      }));
    }

    // Bookings — reservations carry per-day positions so the client can render
    // the same order as the planner
    let reservations: any[] = [];
    let accommodations: unknown[] = [];
    if (permissions.share_bookings) {
      const dayPositions = await this.reservationsRepo.listDayPositionsForShare(tripId);

      const posMap = new Map<number, Record<number, number>>();
      for (const dp of dayPositions) {
        if (!posMap.has(dp.reservation_id)) posMap.set(dp.reservation_id, {});
        posMap.get(dp.reservation_id)![dp.day_id] = dp.position;
      }
      // The alias is not cosmetic: the visibility predicate qualifies its column,
      // and this query had no alias to qualify against.
      // Named columns here too. r.* carried the confirmation number, the
      // import bookkeeping and the raw metadata — and the metadata is where
      // an imported ticket keeps its seat and its record locator. A public
      // link shows what the booking is, not what it would take to change it
      // (#2320). The endpoints ride along, since the map draws from them.
      const endpoints = await this.publicEndpointsByReservation(tripId);
      reservations = (await this.reservationsRepo.listPublicForShare(tripId))
        .map((r) => ({
          ...r,
          url: publicHttpUrl(r.url),
          metadata: publicReservationMetadata(r.metadata),
          endpoints: endpoints.get(r.id) ?? [],
          day_positions: posMap.get(r.id) ?? null,
        }));

      accommodations = await this.reservationsRepo.listPublicAccommodationsForShare(tripId);
    }

    // Packing — a public viewer is neither owner nor recipient, so only Common items
    // may surface; never a co-member's private/personal packing items (#858).
    const packing = permissions.share_packing
      ? await this.packingItems.listPublicForShare(tripId)
      : [];

    // Budget
    const budget = permissions.share_budget
      ? await this.budgetItems.listPublicForShare(tripId)
      : [];

    // Categories are a shared global pool (the authed /api/categories list is
    // equally unscoped), so the public payload returns them all too.
    const categories = await this.categories.listAllUnordered();

    // Collab messages (only if owner chose to share)
    const collabMessages = permissions.share_collab
      ? await this.collabMessages.listPublicForShare(tripId)
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
      ? await this.settings.getUserSettings(shareRow.created_by)
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

    // The owner's narrowing options (#1712) apply last, over what the flags
    // above already let through.
    let view = { assignments, dayNotes, places, reservations };
    if (permissions.share_travel_only) {
      const stayPlaceIds = new Set(await this.reservationsRepo.listPublicStayPlaceIdsForShare(tripId));
      view = travelOnly(view, stayPlaceIds);
    }
    if (permissions.share_hide_images) view = withoutImages(view);

    return {
      trip, baseCurrency, cartoApiKey, categories, permissions,
      days, ...view, accommodations,
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
    const shareRow = await this.shareTokens.findTripAndShareMapByToken(token);
    if (!shareRow) return null;
    // A link that leaves the photos out (#1712) does not serve them either.
    if (shareRow.share_hide_images) return null;
    // Place photos belong to the map/itinerary section — withhold them when the
    // owner disabled the map, matching getSharedTripData which no longer returns
    // the places (and thus their ids) in that case.
    if (!shareRow.share_map) return null;

    const expectedUrl = `${PLACE_PHOTO_PROXY_PREFIX}${encodeURIComponent(placeId)}/bytes`;
    const exists = await this.places.existsByTripAndImageUrl(shareRow.trip_id, expectedUrl);
    if (!exists) return null;

    return this.photoCache.serveKey(placeId);
  }
}
