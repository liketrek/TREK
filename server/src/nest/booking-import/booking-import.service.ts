import { Injectable, HttpException } from '@nestjs/common';
import { broadcast } from '../../websocket';
import { checkPermission } from '../../services/permissions';
import { verifyTripAccess } from '../../services/tripAccess';
import { createReservation } from '../../services/reservationService';
import { createPlace } from '../../services/placeService';
import { searchNominatim } from '../../services/mapsService';
import { db } from '../../db/database';
import type { User } from '../../types';
import { KitineraryExtractorService } from './kitinerary-extractor.service';
import { mapReservations } from './kitinerary-mapper';
import type { BookingImportPreviewItem, BookingImportPreviewResponse, BookingImportConfirmResponse, Reservation } from '@trek/shared';
import type { ParsedBookingItem } from './kitinerary.types';

function resolveDayId(tripId: string, iso: string | null | undefined): number | null {
  if (!iso) return null;
  const date = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const row = db.prepare('SELECT id FROM days WHERE trip_id = ? AND date = ? LIMIT 1').get(tripId, date) as { id: number } | undefined;
  return row?.id ?? null;
}

@Injectable()
export class BookingImportService {
  constructor(private readonly extractor: KitineraryExtractorService) {}

  isAvailable(): boolean {
    return this.extractor.isAvailable();
  }

  verifyTripAccess(tripId: string, userId: number) {
    return verifyTripAccess(tripId, userId);
  }

  canEdit(trip: NonNullable<ReturnType<typeof verifyTripAccess>>, user: User): boolean {
    return checkPermission('reservation_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  /**
   * Parse uploaded files through kitinerary-extractor and return a preview list.
   * Does NOT persist anything.
   */
  async preview(files: Express.Multer.File[]): Promise<BookingImportPreviewResponse> {
    if (!this.extractor.isAvailable()) {
      throw new HttpException({ error: 'KItinerary extractor is not available on this server' }, 503);
    }

    const allItems: ParsedBookingItem[] = [];
    const allWarnings: string[] = [];

    for (const file of files) {
      let kiItems;
      try {
        kiItems = await this.extractor.extract(file.buffer, file.originalname);
      } catch (err) {
        allWarnings.push(`${file.originalname}: extraction failed — ${err instanceof Error ? err.message : String(err)}`);
        continue;
      }

      if (kiItems.length === 0) {
        allWarnings.push(`${file.originalname}: no reservations found`);
        continue;
      }

      const { items, warnings } = mapReservations(kiItems, file.originalname);
      allItems.push(...items);
      allWarnings.push(...warnings);
    }

    return { items: allItems, warnings: allWarnings };
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

        created.push(reservation);
      } catch (err) {
        console.error(`[booking-import] Failed to create reservation "${item.title}":`, err instanceof Error ? err.message : err);
      }
    }

    return { created };
  }
}
