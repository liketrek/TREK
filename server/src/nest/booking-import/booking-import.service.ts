import { Injectable, HttpException } from '@nestjs/common';
import { broadcast } from '../../websocket';
import { checkPermission } from '../../services/permissions';
import { verifyTripAccess } from '../../services/tripAccess';
import { createReservation } from '../../services/reservationService';
import { createPlace } from '../../services/placeService';
import { createBudgetItem, freezeForeignRate } from '../../services/budgetService';
import { isAddonEnabled } from '../../services/adminService';
import { ADDON_IDS } from '../../addons';
import { searchNominatim } from '../../services/mapsService';
import { db } from '../../db/database';
import type { User } from '../../types';
import { KitineraryExtractorService } from './kitinerary-extractor.service';
import { LlmParseService } from '../llm-parse/llm-parse.service';
import { mapReservations } from './kitinerary-mapper';
import { typeToCostCategory } from '@trek/shared';
import type { BookingImportPreviewItem, BookingImportPreviewResponse, BookingImportConfirmResponse, BookingImportMode, BookingImportFileReport, Reservation } from '@trek/shared';
import type { ParsedBookingItem, KiReservation } from './kitinerary.types';

function resolveDayId(tripId: string, iso: string | null | undefined): number | null {
  if (!iso) return null;
  const date = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const exact = db.prepare('SELECT id FROM days WHERE trip_id = ? AND date = ? LIMIT 1').get(tripId, date) as { id: number } | undefined;
  if (exact) return exact.id;
  // Clamp to the nearest trip day so an out-of-range / unmatched check-in still
  // resolves and the accommodation row is inserted.
  const nearest = db.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY ABS(JULIANDAY(date) - JULIANDAY(?)) ASC, date ASC LIMIT 1').get(tripId, date) as { id: number } | undefined;
  return nearest?.id ?? null;
}

@Injectable()
export class BookingImportService {
  constructor(
    private readonly extractor: KitineraryExtractorService,
    private readonly llmParse: LlmParseService,
  ) {}

  isAvailable(): boolean {
    return this.extractor.isAvailable();
  }

  /** True when the LLM fallback is enabled and configured for this user. */
  aiAvailable(userId: number): boolean {
    return this.llmParse.isAvailable(userId);
  }

  verifyTripAccess(tripId: string, userId: number) {
    return verifyTripAccess(tripId, userId);
  }

  canEdit(trip: NonNullable<ReturnType<typeof verifyTripAccess>>, user: User): boolean {
    return checkPermission('reservation_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  /**
   * Parse uploaded files and return a preview list. Does NOT persist anything.
   * Runs kitinerary first; depending on `mode`, falls back to the LLM:
   *  - no-ai:             kitinerary only
   *  - fallback-on-empty: LLM for files kitinerary returns nothing for
   *  - force-ai:          LLM on every file (kitinerary skipped)
   * LLM-derived items are flagged needs_review. Per-file AI usage is reported.
   */
  async preview(
    files: Express.Multer.File[],
    mode: BookingImportMode,
    userId: number,
    onProgress?: (done: number, total: number, fileName: string) => void,
  ): Promise<BookingImportPreviewResponse> {
    const kitineraryAvailable = this.extractor.isAvailable();
    const aiAvailable = this.llmParse.isAvailable(userId);
    if (!kitineraryAvailable && !aiAvailable) {
      throw new HttpException({ error: 'KItinerary extractor is not available on this server' }, 503);
    }

    const allItems: ParsedBookingItem[] = [];
    const allWarnings: string[] = [];
    const fileReports: BookingImportFileReport[] = [];

    let processed = 0;
    for (const file of files) {
      let kiItems: KiReservation[] = [];
      let aiUsed = false;

      // Stage 1: kitinerary (skipped entirely when forcing AI).
      if (mode !== 'force-ai' && kitineraryAvailable) {
        try {
          kiItems = await this.extractor.extract(file.buffer, file.originalname);
        } catch (err) {
          allWarnings.push(`${file.originalname}: extraction failed — ${err instanceof Error ? err.message : String(err)}`);
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
        allItems.push(...items);
        allWarnings.push(...warnings);
      }

      // Report per-file progress so a background import can drive a live widget.
      onProgress?.(++processed, files.length, file.originalname);
    }

    return { items: allItems, warnings: allWarnings, files: fileReports };
  }

  /**
   * Persist a confirmed list of parsed items.
   * Creates place rows for hotel/restaurant/event venues, then calls createReservation.
   * Broadcasts reservation:created (and accommodation:created if applicable) per item.
   */
  async confirm(
    tripId: string,
    items: BookingImportPreviewItem[],
    socketId: string | undefined,
  ): Promise<BookingImportConfirmResponse> {
    const created: Reservation[] = [];

    for (const item of items) {
      try {
        const { _venue, _accommodation, source: _src, ...reservationData } = item;

        // Auto-create a place row for venue-based reservations
        let placeId: number | undefined;
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
                const results = await searchNominatim(q);
                const hit = results[0];
                if (hit?.lat != null && hit?.lng != null) {
                  lat = hit.lat;
                  lng = hit.lng;
                  break;
                }
              }
            } catch {
              // geocoding failure is non-fatal
            }
          }

          const place = createPlace(tripId, {
            name: _venue.name,
            lat,
            lng,
            address: _venue.address,
            website: _venue.website,
            phone: _venue.phone,
          });
          placeId = (place as any).id;
          broadcast(tripId, 'place:created', { place }, socketId);
        }

        // Geocode transport endpoints (stations/stops/terminals/rental desks) that
        // arrived without coords, so the route draws and map pins appear. The LLM
        // and kitinerary rarely supply geo for non-airport endpoints.
        if (Array.isArray(reservationData.endpoints)) {
          for (const ep of reservationData.endpoints) {
            if ((ep.lat == null || ep.lng == null) && ep.name) {
              try {
                const hit = (await searchNominatim(ep.name))[0];
                if (hit?.lat != null && hit?.lng != null) {
                  ep.lat = hit.lat;
                  ep.lng = hit.lng;
                }
              } catch {
                // geocoding failure is non-fatal
              }
            }
          }
          // Persist only coord'd endpoints (reservation_endpoints needs lat/lng);
          // ungeocodable ones still appeared in the preview's From→To.
          reservationData.endpoints = reservationData.endpoints.filter((ep) => ep.lat != null && ep.lng != null);
        }

        // Build create_accommodation for hotel reservations.
        // start_day_id / end_day_id are resolved from check-in/out ISO dates so
        // the accommodation row is actually inserted (createReservation gates on them).
        let createAccommodation: { place_id?: number; start_day_id?: number; end_day_id?: number; check_in?: string; check_out?: string; confirmation?: string } | undefined;
        if (item.type === 'hotel' && _accommodation) {
          const startDayId = resolveDayId(tripId, _accommodation.check_in);
          const endDayId   = resolveDayId(tripId, _accommodation.check_out);
          createAccommodation = {
            place_id: placeId,
            start_day_id: startDayId ?? undefined,
            end_day_id:   endDayId   ?? undefined,
            check_in:     _accommodation.check_in,
            check_out:    _accommodation.check_out,
            confirmation: _accommodation.confirmation,
          };
        }

        const { reservation, accommodationCreated } = createReservation(tripId, {
          ...reservationData,
          place_id: placeId,
          create_accommodation: createAccommodation,
        } as any);

        broadcast(tripId, 'reservation:created', { reservation }, socketId);
        if (accommodationCreated) {
          broadcast(tripId, 'accommodation:created', {}, socketId);
        }

        // Turn an extracted price into a real linked cost (Costs addon), so the
        // booking shows up as an expense — not just a price in metadata.
        if (isAddonEnabled(ADDON_IDS.BUDGET)) {
          const meta =
            reservationData.metadata && typeof reservationData.metadata === 'object'
              ? (reservationData.metadata as Record<string, unknown>)
              : null;
          const price = meta && meta.price != null ? Number(meta.price) : NaN;
          if (Number.isFinite(price) && price > 0) {
            try {
              const budgetData = {
                category: typeToCostCategory(item.type),
                name: item.title,
                total_price: price,
                currency: meta && typeof meta.priceCurrency === 'string' ? meta.priceCurrency : null,
                reservation_id: reservation.id,
              };
              // Freeze the live FX rate for a foreign-currency booking price so a
              // settled position isn't re-opened when live rates drift (#1445).
              await freezeForeignRate(tripId, budgetData);
              const budgetItem = createBudgetItem(tripId, budgetData);
              broadcast(tripId, 'budget:created', { item: budgetItem }, socketId);
            } catch (err) {
              console.error(
                `[booking-import] Failed to create cost for "${item.title}":`,
                err instanceof Error ? err.message : err,
              );
            }
          }
        }

        created.push(reservation);
      } catch (err) {
        console.error(`[booking-import] Failed to create reservation "${item.title}":`, err instanceof Error ? err.message : err);
      }
    }

    return { created };
  }
}
