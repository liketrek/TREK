import { entityCode } from './airtrail.mapper';
import { flightPassengers, ownPassenger } from './airtrail.client';
import type { AirtrailFlightRaw, AirtrailPassengerWrite, AirtrailSavePayload } from './airtrail.client';

/**
 * The pure half of the AirTrail push: turning a TREK reservation plus the flight
 * as AirTrail currently has it into a save body.
 *
 * Free functions rather than methods, and in their own file, because
 * buildSavePayload is the part with the real rules and its unit test drives it
 * directly with fixture objects — no database, no HTTP, no container.
 */
function splitLocal(dt: string | null | undefined): { date: string | null; time: string | null } {
  if (!dt) return { date: null, time: null };
  const date = dt.slice(0, 10);
  const m = dt.slice(10).match(/(\d{2}:\d{2})/);
  return { date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null, time: m ? m[1] : null };
}

/**
 * Build the POST /flight/save body. AirTrail's save fully overwrites the flight,
 * so we start from the flight as AirTrail currently has it (`existing`, the raw
 * GET object) and overwrite ONLY the fields TREK manages. Everything else —
 * terminal, gate, scheduled/actual times, customFields, track, and any field
 * AirTrail may add later — passes through untouched. We deliberately do NOT model
 * those fields; spreading the raw object keeps us decoupled from AirTrail's schema
 * (#1240).
 */
export function buildSavePayload(reservation: any, existing: AirtrailFlightRaw): AirtrailSavePayload | null {
  let meta: Record<string, any>;
  try {
    meta = reservation.metadata ? JSON.parse(reservation.metadata) : {};
  } catch {
    meta = {};
  }
  const endpoints: any[] = reservation.endpoints || [];
  const fromEp = endpoints.find((e) => e.role === 'from');
  const toEp = endpoints.find((e) => e.role === 'to');
  const fromCode = fromEp?.code || existing.from?.iata || existing.from?.icao || null;
  const toCode = toEp?.code || existing.to?.iata || existing.to?.icao || null;
  if (!fromCode || !toCode) return null;

  const dep = splitLocal(reservation.reservation_time);
  const arr = splitLocal(reservation.reservation_end_time);
  if (!dep.date) return null;

  // Preserve the existing passenger manifest (an update replaces all of them);
  // fall back to the key-owner placeholder so AirTrail attributes it to the
  // connecting user. 3.12.0 renamed the list from seats to passengers, so read
  // whichever one this instance sent.
  const seats: AirtrailPassengerWrite[] = flightPassengers(existing).map((s) => ({
    userId: s.userId,
    guestName: s.guestName,
    seat: s.seat,
    seatNumber: s.seatNumber,
    seatClass: s.seatClass,
    ...(s.flightReason !== undefined ? { flightReason: s.flightReason } : {}),
  }));
  if (seats.length === 0) {
    seats.push({ userId: '<USER_ID>', guestName: null, seat: null, seatNumber: null, seatClass: null });
  }

  // Push the seat the user set in TREK onto their own AirTrail entry (the one
  // with a userId), leaving any co-passenger seats untouched.
  const seatNumber = typeof meta.seat === 'string' && meta.seat.trim() ? meta.seat.trim() : null;
  const ownSeat = seats.find((s) => s.userId) ?? seats[0];
  if (seatNumber && ownSeat) ownSeat.seatNumber = seatNumber;

  // The reason lives on the flight up to 3.11.x and on the passenger from 3.12.0.
  // Resolve it once from whichever place this instance kept it, then write it to
  // both — the version that does not know a key drops it.
  const reason =
    (meta.flight_reason as string | undefined) ??
    existing.flightReason ??
    ownPassenger(existing)?.flightReason ??
    null;
  if (ownSeat) ownSeat.flightReason = reason;

  // Spread the existing flight first to preserve every AirTrail-owned field, then
  // overwrite only what TREK manages. `from`/`to`/`airline`/`aircraft` come back
  // from GET as objects but the save shape wants codes — those are exactly the
  // keys we override, so the spread never ships an object where a code is wanted.
  return {
    // Cast so the spread carries through the AirTrail-owned keys we deliberately
    // don't model (terminal, gate, scheduled/actual times, customFields, track, …).
    ...(existing as unknown as Record<string, unknown>),
    id: Number(reservation.external_id),
    from: fromCode,
    to: toCode,
    departure: dep.date,
    departureTime: dep.time,
    arrival: arr.date,
    arrivalTime: arr.time,
    // Import reads the SCHEDULED time, so a TREK edit must write back there too —
    // otherwise the next pull (scheduled-wins) would revert it. AirTrail rebuilds the
    // instant from a full-ISO date carrier + the HH:MM time, so pass a date carrier.
    departureScheduled: dep.date ? `${dep.date}T00:00:00.000Z` : null,
    departureScheduledTime: dep.time,
    arrivalScheduled: arr.date ? `${arr.date}T00:00:00.000Z` : null,
    arrivalScheduledTime: arr.time,
    // These are AirTrail-owned details TREK doesn't surface in its edit UI — a TREK
    // edit can leave them out of `metadata`. Preserve AirTrail's current value when
    // TREK has none rather than nulling it out (#1240). Use airline_code (not the
    // display name in metadata.airline, #1334); both it and entityCode mirror the
    // import/hash code-selection so a writeback stays a no-op for the hash.
    airline: meta.airline_code ?? entityCode(existing.airline) ?? null,
    flightNumber: meta.flight_number ?? existing.flightNumber ?? null,
    aircraft: meta.aircraft ?? entityCode(existing.aircraft) ?? null,
    aircraftReg: meta.aircraft_reg ?? existing.aircraftReg ?? null,
    // Flight-level up to 3.11.x, per-passenger from 3.12.0. Write both; each
    // version keeps the one it knows and strips the other.
    flightReason: reason,
    note: reservation.notes ?? existing.note ?? null,
    seats,
    passengers: seats,
  } as AirtrailSavePayload;
}
