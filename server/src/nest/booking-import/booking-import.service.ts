import { ADDON_IDS } from '../../addons';
import { Days } from '../../db/entities/Days.entity';
import { Reservations } from '../../db/entities/Reservations.entity';
import { DaysRepository } from '../../db/repositories/Days.repository';
import { ReservationsRepository } from '../../db/repositories/Reservations.repository';
import type { User } from '../../types';
import { AddonsService } from '../addons/addons.service';
import { BudgetService } from '../budget/budget.service';
import { DomainError } from '../common/domain-error';
import { UnitOfWork } from '../database/unit-of-work';
import { imageMimeType } from '../llm-parse/image-input';
import { LlmParseService } from '../llm-parse/llm-parse.service';
import { MapsService } from '../maps/maps.service';
import { PermissionsService } from '../permissions/permissions.service';
import { PlacesService } from '../places/places.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ReservationsService } from '../reservations/reservations.service';
import { KitineraryExtractorService } from './kitinerary-extractor.service';
import { mapReservations } from './kitinerary-mapper';
import type { ParsedBookingItem, KiReservation } from './kitinerary.types';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { normalizePlaceWebsite, typeToCostCategory } from '@trek/shared';
import type {
  BookingImportPreviewItem,
  BookingImportPreviewResponse,
  BookingImportConfirmResponse,
  BookingImportMode,
  BookingImportFileReport,
  Reservation,
} from '@trek/shared';

@Injectable()
export class BookingImportService {
  constructor(
    private readonly extractor: KitineraryExtractorService,
    private readonly llmParse: LlmParseService,
    @InjectRepository(Days) private readonly daysRepo: DaysRepository,
    @InjectRepository(Reservations) private readonly reservationsRepo: ReservationsRepository,
    private readonly reservations: ReservationsService,
    private readonly permissions: PermissionsService,
    private readonly budget: BudgetService,
    private readonly addons: AddonsService,
    private readonly realtime: RealtimeService,
    private readonly maps: MapsService,
    private readonly places: PlacesService,
    private readonly uow: UnitOfWork,
  ) {}

  /**
   * BI1/BI2 — `SELECT id FROM days WHERE trip_id = ? AND date = ? LIMIT 1`
   * then, on a miss, `SELECT id FROM days WHERE trip_id = ? ORDER BY
   * ABS(JULIANDAY(date) - JULIANDAY(?)) ASC, date ASC LIMIT 1`. The SAME
   * two-statement shape `ReservationsService#resolveDayIdFromTime` already
   * converted (RS10/RS11) — `DaysRepository.findByTripAndDate` for the exact
   * match, `ReservationsRepository.findNearestDayId` (which already wraps
   * `dayDistance`, R4/BI2's own "not a new SQL helper" resolution) for the
   * nearest-day fallback — reused here rather than re-derived, per the
   * project's single-source-of-truth rule.
   */
  private async resolveDayId(tripId: string, iso: string | null | undefined): Promise<number | null> {
    if (!iso) return null;
    const date = iso.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const tripIdNum = this.rowIdNum(tripId);
    const exact = await this.daysRepo.findByTripAndDate(tripIdNum, date);
    if (exact) return exact.id;
    // Clamp to the nearest trip day so an out-of-range / unmatched check-in still
    // resolves and the accommodation row is inserted.
    const nearestId = await this.reservationsRepo.findNearestDayId(tripIdNum, date);
    return nearestId ?? null;
  }

  /** `tripId` arrives as a route-param string; both repository calls above need a genuine `number` (rule 23) — same coercion shape as `ReservationsService.rowIdNum`. */
  private rowIdNum(value: string): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : -1;
  }

  isAvailable(): boolean {
    return this.extractor.isAvailable();
  }

  /** True when the LLM fallback is enabled and configured for this user. */
  async aiAvailable(userId: number): Promise<boolean> {
    return this.llmParse.isAvailable(userId);
  }

  /** Whether a photo this user imports can be read (see LlmParseService.readsImages). */
  readsImages(userId: number): Promise<boolean> {
    return this.llmParse.readsImages(userId);
  }

  /**
   * Parse uploaded files and return a preview list. Does NOT persist anything.
   * Runs kitinerary first; depending on `mode`, falls back to the LLM:
   *  - no-ai:             kitinerary only
   *  - fallback-on-empty: LLM for files kitinerary returns nothing for
   *  - force-ai:          LLM on every file (kitinerary skipped)
   * LLM-derived items are flagged needs_review. Per-file AI usage is reported.
   */
  /**
   * Give a transport's endpoints coordinates, so they survive the save.
   *
   * kitinerary and the LLM name stations, stops, terminals and rental desks but
   * rarely geo-locate them — only airports come with coordinates, from the
   * mapper's own airport table. `reservation_endpoints.lat`/`lng` are NOT NULL,
   * so `saveEndpoints` drops anything without them. That guard is right; what
   * was missing is this step on the path the clients actually take.
   *
   * It lived in confirm() alone, which nothing calls: both the desktop planner
   * and mobile go preview -> review form -> ordinary save. So an endpoint the
   * extractor had named appeared in the review step's From -> To summary and
   * then vanished on save, with nothing shown and nothing logged (#1969).
   *
   * The query ladder matches the venue lookup above: name plus the booking's
   * location first, then the location alone, then the bare name. Name-only is
   * exactly what fails for a desk label like "Curbside Pickup Counter 7", so it
   * comes last rather than first.
   *
   * Answers are cached for the length of one preview: a multi-leg train repeats
   * its station names, and this lane is rate limited to roughly one request a
   * second. Returns the names it could not place, for the caller to warn about
   * rather than dropping them silently.
   */
  private async geocodeEndpoints(
    endpoints: { name?: string | null; lat?: number | null; lng?: number | null }[] | undefined,
    context: { location?: string | null; address?: string | null },
    cache: Map<string, { lat: number; lng: number } | null>,
  ): Promise<string[]> {
    if (!Array.isArray(endpoints)) return [];
    const unresolved: string[] = [];

    for (const ep of endpoints) {
      if (ep.lat != null && ep.lng != null) continue;
      if (!ep.name) continue;

      const key = ep.name.toLowerCase();
      if (cache.has(key)) {
        const hit = cache.get(key);
        if (hit) {
          ep.lat = hit.lat;
          ep.lng = hit.lng;
        } else {
          unresolved.push(ep.name);
        }
        continue;
      }

      const queries = [
        context.location ? `${ep.name} ${context.location}` : null,
        context.address ? `${ep.name} ${context.address}` : null,
        ep.name,
      ].filter((q): q is string => !!q);

      let found: { lat: number; lng: number } | null = null;
      try {
        for (const q of queries) {
          const hit = await this.maps.geocodeQuery(q);
          if (hit) {
            found = hit;
            break;
          }
        }
      } catch {
        // geocoding failure is non-fatal — the endpoint stays, and is warned about
      }

      cache.set(key, found);
      if (found) {
        ep.lat = found.lat;
        ep.lng = found.lng;
      } else {
        unresolved.push(ep.name);
      }
    }

    return unresolved;
  }

  async preview(
    files: Express.Multer.File[],
    mode: BookingImportMode,
    userId: number,
    onProgress?: (done: number, total: number, fileName: string) => void,
  ): Promise<BookingImportPreviewResponse> {
    const kitineraryAvailable = this.extractor.isAvailable();
    const aiAvailable = await this.llmParse.isAvailable(userId);
    if (!kitineraryAvailable && !aiAvailable) {
      throw new DomainError(503, 'KItinerary extractor is not available on this server');
    }

    const allItems: ParsedBookingItem[] = [];
    const allWarnings: string[] = [];
    // One lookup per distinct endpoint name across the whole preview: a
    // multi-leg train repeats its stations, and this lane allows about one
    // request a second.
    const geoCache = new Map<string, { lat: number; lng: number } | null>();
    const fileReports: BookingImportFileReport[] = [];

    let processed = 0;
    for (const file of files) {
      let kiItems: KiReservation[] = [];
      let aiUsed = false;

      // Stage 1: kitinerary (skipped entirely when forcing AI, and for a photo,
      // which only a model can read).
      const photo = imageMimeType(file.originalname) !== null;
      if (mode !== 'force-ai' && kitineraryAvailable && !photo) {
        try {
          kiItems = await this.extractor.extract(file.buffer, file.originalname);
        } catch (err) {
          allWarnings.push(
            `${file.originalname}: extraction failed — ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      // Stage 1b: LLM fallback.
      const runLlm = aiAvailable && (mode === 'force-ai' || (mode === 'fallback-on-empty' && kiItems.length === 0));
      if (runLlm) {
        aiUsed = true;
        const llm = await this.llmParse.parse({ buffer: file.buffer, originalName: file.originalname }, userId);
        kiItems = llm.kiItems;
        allWarnings.push(...llm.warnings);
      }

      fileReports.push({ fileName: file.originalname, aiAvailable, aiUsed });

      if (kiItems.length === 0) {
        allWarnings.push(`${file.originalname}: no reservations found`);
      } else {
        const { items, warnings } = mapReservations(kiItems, file.originalname);
        // LLM extraction is less certain than kitinerary — always flag for review.
        if (aiUsed) for (const it of items) it.needs_review = true;

        // Locate the endpoints here, on the path the clients take, rather than
        // in confirm() where the code used to sit and nothing reached it.
        for (const it of items) {
          const missed = await this.geocodeEndpoints(
            (it as { endpoints?: { name?: string | null; lat?: number | null; lng?: number | null }[] }).endpoints,
            {
              location: (it as { location?: string | null }).location,
              address: (it as { _venue?: { address?: string | null } })._venue?.address,
            },
            geoCache,
          );
          // Kept on the item rather than filtered, so it is still editable in the
          // review form, and said out loud rather than disappearing on save.
          for (const name of missed) {
            allWarnings.push(`${file.originalname}: could not locate "${name}" — set it manually before saving`);
          }
        }

        allItems.push(...items);
        allWarnings.push(...warnings);
      }

      // Report per-file progress so a background import can drive a live widget.
      onProgress?.(++processed, files.length, file.originalname);
    }

    return { items: allItems, warnings: allWarnings, files: fileReports };
  }

  /**
   * The linked cost an extracted price becomes (Costs addon), so the booking shows
   * up as an expense and not just a price in metadata, or undefined when there is
   * none to write. The live FX rate of a foreign-currency price is frozen here, so
   * a settled position isn't re-opened when live rates drift (#1445). A rate that
   * cannot be frozen leaves the booking without its cost, as before.
   */
  private async linkedCost(
    tripId: string,
    item: BookingImportPreviewItem,
  ): Promise<{ total_price: number; category: string; currency?: string | null; exchange_rate?: number } | undefined> {
    if (!(await this.addons.isAddonEnabled(ADDON_IDS.BUDGET))) return undefined;
    const meta = item.metadata && typeof item.metadata === 'object' ? (item.metadata as Record<string, unknown>) : null;
    const price = meta && meta.price != null ? Number(meta.price) : Number.NaN;
    if (!Number.isFinite(price) || price <= 0) return undefined;
    const entry: { total_price: number; category: string; currency?: string | null; exchange_rate?: number } = {
      total_price: price,
      category: typeToCostCategory(item.type),
      currency: meta && typeof meta.priceCurrency === 'string' ? meta.priceCurrency : null,
    };
    try {
      await this.budget.freezeForeignRate(tripId, entry);
    } catch (err) {
      console.error(
        `[booking-import] Failed to create cost for "${item.title}":`,
        err instanceof Error ? err.message : err,
      );
      return undefined;
    }
    return entry;
  }

  /**
   * Persist a confirmed list of parsed items.
   * Per item, the network work runs first (venue and endpoint geocoding, the cost's
   * frozen rate). Then the venue's place row, the booking and its linked cost are one
   * transaction, so a booking that fails leaves no stray place behind. place:created,
   * reservation:created, accommodation:created and the cost go out after the commit.
   *
   * @txIndependent one transaction per imported item: each booking lands whole with its
   * venue and cost, and one that fails is skipped without undoing the ones before it.
   */
  async confirm(
    tripId: string,
    items: BookingImportPreviewItem[],
    socketId: string | undefined,
  ): Promise<BookingImportConfirmResponse> {
    const created: Reservation[] = [];
    const confirmGeoCache = new Map<string, { lat: number; lng: number } | null>();

    for (const item of items) {
      try {
        const { _venue, _accommodation, source: _src, ...reservationData } = item;

        // A place row for venue-based reservations, written with the booking below.
        let venue: Parameters<PlacesService['create']>[1] | undefined;
        if (_venue?.name) {
          // Geocode before creating so the broadcast carries the coordinates
          let lat = _venue.lat;
          let lng = _venue.lng;
          if (lat == null && (_venue.address || _venue.name)) {
            try {
              const queries = [
                _venue.address ? `${_venue.name} ${_venue.address}` : null,
                _venue.address ?? null,
                _venue.name,
              ].filter((q): q is string => !!q);

              for (const q of queries) {
                const hit = await this.maps.geocodeQuery(q);
                if (hit) {
                  lat = hit.lat;
                  lng = hit.lng;
                  break;
                }
              }
            } catch {
              // geocoding failure is non-fatal
            }
          }

          venue = {
            name: _venue.name,
            lat,
            lng,
            address: _venue.address,
            // A booking mail gives the venue's site however its sender wrote it;
            // it lands as https or not at all (#2483).
            website: normalizePlaceWebsite(_venue.website) ?? undefined,
            phone: _venue.phone,
          };
        }

        // The same lookup preview() runs, through the same helper. On anything
        // that came from a preview this is a no-op, since the endpoints already
        // carry coordinates; it stays because this route can also be called
        // with items that never went through one.
        if (Array.isArray(reservationData.endpoints)) {
          await this.geocodeEndpoints(
            reservationData.endpoints,
            { location: (reservationData as { location?: string | null }).location, address: _venue?.address },
            confirmGeoCache,
          );
          // Persist only coord'd endpoints (reservation_endpoints needs lat/lng);
          // ungeocodable ones still appeared in the preview's From→To.
          reservationData.endpoints = reservationData.endpoints.filter((ep) => ep.lat != null && ep.lng != null);
        }

        // Build create_accommodation for hotel reservations.
        // start_day_id / end_day_id are resolved from check-in/out ISO dates so
        // the accommodation row is actually inserted (createReservation gates on them).
        let createAccommodation:
          | {
              place_id?: number;
              start_day_id?: number;
              end_day_id?: number;
              check_in?: string;
              check_out?: string;
              confirmation?: string;
            }
          | undefined;
        if (item.type === 'hotel' && _accommodation) {
          const startDayId = await this.resolveDayId(tripId, _accommodation.check_in);
          const endDayId = await this.resolveDayId(tripId, _accommodation.check_out);
          createAccommodation = {
            start_day_id: startDayId ?? undefined,
            end_day_id: endDayId ?? undefined,
            check_in: _accommodation.check_in,
            check_out: _accommodation.check_out,
            confirmation: _accommodation.confirmation,
          };
        }

        // The venue, the booking and its linked cost are one write; the booking goes
        // through the same service core REST, MCP and the plugin RPC take. The cost's
        // rate is frozen first, outside that write, since it can fetch rates over the network.
        const cost = await this.linkedCost(tripId, item);
        const { place, reservation, accommodationCreated, costEvents, stayMirror } = await this.uow.transactional(
          async () => {
            const placeRow = venue ? await this.places.create(tripId, venue) : null;
            const placeId = placeRow?.id;
            const written = await this.reservations.createWithCostInTx(
              tripId,
              {
                ...reservationData,
                place_id: placeId,
                create_accommodation: createAccommodation && { ...createAccommodation, place_id: placeId },
              } as never,
              cost,
            );
            return { place: placeRow, ...written };
          },
        );

        if (place) this.realtime.broadcast(tripId, 'place:created', { place }, socketId);
        this.realtime.broadcast(tripId, 'reservation:created', { reservation }, socketId);
        if (accommodationCreated) {
          this.realtime.broadcast(tripId, 'accommodation:created', {}, socketId);
        }
        await this.reservations.announceStayMirror(tripId, stayMirror);
        this.reservations.announceCost(tripId, costEvents, socketId);

        created.push(reservation);
      } catch (err) {
        console.error(
          `[booking-import] Failed to create reservation "${item.title}":`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    return { created };
  }
}
