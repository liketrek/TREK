import type { ToolArgs } from '../card-types';
import { recordOf, type Row } from '../card-values';
import { rowsOf } from '../undo-snapshot';
import { bookingCard, bookingItemOf, travelersOf } from './booking-item';
import { idOf, rowOfReservation, rowOfStay, scopeOfPreview } from './booking-row';
import type { AssistantChangePreview, BookingBody, BookingItem, TrekCard } from '@trek/shared';

/**
 * The cards of applied booking writes, in place of the preview card: the
 * booking as it was saved (its real status, coordinates resolved, legs
 * normalised, the stay it links). Decisions run before any trip card is read,
 * so the days and the people come from what the preview card named; what the
 * saved row does not carry (a stay's times, a photo) is kept from the preview.
 */

interface AppliedInput {
  args: ToolArgs;
  result: unknown;
  preview: AssistantChangePreview | null;
}

function previewItem(preview: AssistantChangePreview | null): BookingItem | null {
  const card = preview?.card;
  return card?.kind === 'booking' ? (card.items[0] ?? null) : null;
}

type StayBody = Extract<BookingBody, { shape: 'stay' }>;

/** A saved stay, the times and the picture the saved row leaves out kept from the preview. */
function filledStay(saved: StayBody, shown: StayBody): StayBody {
  const checkIn = saved.checkIn && {
    ...saved.checkIn,
    from: saved.checkIn.from ?? shown.checkIn?.from ?? null,
    until: saved.checkIn.until ?? shown.checkIn?.until ?? null,
  };
  return {
    ...saved,
    address: saved.address ?? shown.address,
    lat: saved.lat ?? shown.lat,
    lng: saved.lng ?? shown.lng,
    photoKey: saved.photoKey ?? shown.photoKey,
    checkIn,
    checkOut: saved.checkOut && { ...saved.checkOut, by: saved.checkOut.by ?? shown.checkOut?.by ?? null },
    nights: saved.nights ?? shown.nights,
  };
}

/** The saved body, its gaps filled from what the preview showed. */
function filled(saved: BookingBody, shown: BookingBody | undefined): BookingBody {
  if (saved.shape === 'stay' && shown?.shape === 'stay') return filledStay(saved, shown);
  if (saved.shape === 'venue' && shown?.shape === 'venue') {
    return {
      ...saved,
      location: saved.location ?? shown.location,
      lat: saved.lat ?? shown.lat,
      lng: saved.lng ?? shown.lng,
    };
  }
  return saved;
}

function savedCard(shown: BookingItem | null, item: BookingItem | null): TrekCard | null {
  if (!item) return null;
  return bookingCard('none', [{ ...item, body: filled(item.body, shown?.body), changed: shown?.changed ?? [] }]);
}

function tripIdOf(shown: BookingItem | null, raw: Row): number | null {
  return shown?.tripId ?? idOf(raw.trip_id);
}

/** A booking a write answered with (`{ reservation }`). */
export function appliedReservation({ result, preview }: AppliedInput): TrekCard | null {
  const raw = recordOf(recordOf(result).reservation);
  const shown = previewItem(preview);
  const tripId = tripIdOf(shown, raw);
  if (idOf(raw.id) === null || tripId === null) return null;
  const scope = scopeOfPreview(shown ? [shown] : [], tripId);
  return savedCard(shown, bookingItemOf(rowOfReservation(raw, tripId), scope));
}

/**
 * A booking a file's import created. Its answer names the id alone (no route,
 * times or stay dates), so the card is the preview's, now saved: the id it got
 * and, with the id, the route it can show on the map.
 */
export function appliedImport({ result, preview }: AppliedInput): TrekCard | null {
  const shown = previewItem(preview);
  const id = idOf(recordOf(recordOf(result).reservation).id);
  if (!shown || id === null) return null;
  const body = shown.body;
  const located = body.shape === 'ticket' ? body.stops.filter((s) => s.lat !== null && s.lng !== null).length : 0;
  const saved = body.shape === 'ticket' ? { ...body, mappable: located >= 2 } : body;
  return bookingCard('none', [{ ...shown, reservationId: id, changed: [], body: saved }]);
}

/** A stay a write answered with (`{ accommodation }`, with `place` when the write created it too). */
export function appliedStay({ result, preview }: AppliedInput): TrekCard | null {
  const answer = recordOf(result);
  const raw = recordOf(answer.accommodation);
  const shown = previewItem(preview);
  const tripId = tripIdOf(shown, raw);
  if (idOf(raw.id) === null || tripId === null) return null;
  const place = answer.place && typeof answer.place === 'object' ? recordOf(answer.place) : null;
  const scope = scopeOfPreview(shown ? [shown] : [], tripId);
  const item = bookingItemOf(rowOfStay(raw, tripId, null, place), scope);
  // A stay row knows no booking; the preview's title and status stand where it named them.
  return savedCard(shown, item && shown ? { ...item, title: shown.title, status: item.status ?? shown.status } : item);
}

/** The travellers a write set (`{ travelers }`) on the booking the preview showed. */
export function appliedTravelers({ result, preview }: AppliedInput): TrekCard | null {
  const shown = previewItem(preview);
  if (!shown) return null;
  const { people, more } = travelersOf(rowsOf(recordOf(result).travelers));
  return bookingCard('none', [{ ...shown, travelers: people, moreTravelers: more }]);
}
