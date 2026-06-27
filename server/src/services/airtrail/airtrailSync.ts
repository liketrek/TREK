import { ADDON_IDS } from '../../addons';
import { db } from '../../db/database';
import { broadcast } from '../../websocket';
import { isAddonEnabled } from '../adminService';
import { logError, logInfo } from '../auditLog';
import { getReservation, getReservationWithJoins, updateReservation } from '../reservationService';
import {
  AirtrailAuthError,
  AirtrailCreds,
  AirtrailFlightRaw,
  AirtrailSavePayload,
  getFlight,
  listFlights,
  saveFlight,
} from './airtrailClient';
import { canonicalHash, entityCode, mapFlightToReservation } from './airtrailMapper';
import { getAirtrailCredentials, isAirtrailWriteEnabled } from './airtrailService';

/** Global on/off: the addon must be enabled and sync not explicitly turned off. */
export function syncGloballyEnabled(): boolean {
  if (!isAddonEnabled(ADDON_IDS.AIRTRAIL)) return false;
  const row = db.prepare("SELECT value FROM app_settings WHERE key = 'airtrail_sync_enabled'").get() as
    | { value: string }
    | undefined;
  return row?.value !== 'false';
}

function broadcastUpdated(tripId: number, reservationId: number): void {
  try {
    const reservation = getReservationWithJoins(reservationId);
    if (reservation) broadcast(tripId, 'reservation:updated', { reservation });
  } catch {
    /* broadcast failure is non-fatal */
  }
}

function detach(tripId: number, reservationId: number): void {
  db.prepare('UPDATE reservations SET sync_enabled = 0 WHERE id = ?').run(reservationId);
  broadcastUpdated(tripId, reservationId);
}

// ── AirTrail → TREK (poll) ───────────────────────────────────────────────────

/**
 * Reconcile one owner's linked reservations against their current AirTrail
 * flights: apply field changes (detected by snapshot hash, since AirTrail has no
 * updated_at) and, when a flight is gone from AirTrail, keep the TREK row but
 * stop syncing it. Only already-imported flights are touched — new AirTrail
 * flights are never auto-added to a trip. Returns how many rows changed.
 */
async function syncOwner(uid: number): Promise<number> {
  const creds = getAirtrailCredentials(uid);
  if (!creds) return 0; // owner disconnected — leave their linked rows as-is

  let flights: AirtrailFlightRaw[];
  try {
    flights = await listFlights(creds);
  } catch (err) {
    if (err instanceof AirtrailAuthError) logError(`AirTrail sync: invalid API key for user ${uid}`);
    return 0;
  }
  const byId = new Map(flights.map((f) => [String(f.id), f]));

  const linked = db
    .prepare(
      "SELECT id, trip_id, external_id, external_hash FROM reservations WHERE external_source = 'airtrail' AND sync_enabled = 1 AND external_owner_user_id = ?",
    )
    .all(uid) as { id: number; trip_id: number; external_id: string; external_hash: string | null }[];

  let changed = 0;
  for (const row of linked) {
    const flight = byId.get(String(row.external_id));
    if (!flight) {
      detach(row.trip_id, row.id); // deleted in AirTrail → keep row, stop syncing
      changed++;
      continue;
    }

    const hash = canonicalHash(flight);
    if (hash === row.external_hash) continue;

    const current = getReservation(row.id, row.trip_id);
    if (!current) continue;
    try {
      updateReservation(row.id, row.trip_id, mapFlightToReservation(flight) as any, current as any);
      db.prepare('UPDATE reservations SET external_hash = ?, external_synced_at = ? WHERE id = ?').run(
        hash,
        new Date().toISOString(),
        row.id,
      );
      broadcastUpdated(row.trip_id, row.id);
      changed++;
    } catch (err) {
      logError(`AirTrail sync: failed to update reservation ${row.id}: ${err instanceof Error ? err.message : err}`);
    }
  }
  return changed;
}

let running = false;

/** Background poll across every connected owner (scheduler). */
export async function runAirtrailSync(): Promise<void> {
  if (running) return;
  if (!syncGloballyEnabled()) return;
  running = true;
  let changed = 0;
  try {
    const owners = db
      .prepare(
        "SELECT DISTINCT external_owner_user_id AS uid FROM reservations WHERE external_source = 'airtrail' AND sync_enabled = 1 AND external_owner_user_id IS NOT NULL",
      )
      .all() as { uid: number }[];
    for (const { uid } of owners) changed += await syncOwner(uid);
    if (changed > 0) logInfo(`AirTrail sync: applied ${changed} change(s)`);
  } catch (err) {
    logError(`AirTrail sync failed: ${err instanceof Error ? err.message : err}`);
  } finally {
    running = false;
  }
}

/**
 * On-demand sync of just this user's linked flights — called when the user opens
 * a trip so AirTrail-side edits show up immediately instead of waiting for the
 * background poll.
 */
export async function runAirtrailSyncForUser(userId: number): Promise<{ changed: number }> {
  if (!syncGloballyEnabled()) return { changed: 0 };
  try {
    return { changed: await syncOwner(userId) };
  } catch (err) {
    logError(`AirTrail sync (user ${userId}) failed: ${err instanceof Error ? err.message : err}`);
    return { changed: 0 };
  }
}

// ── TREK → AirTrail (push) ───────────────────────────────────────────────────

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

  // Preserve the existing seat manifest (an update replaces all seats); fall back
  // to the key-owner placeholder so AirTrail attributes it to the connecting user.
  const seats = (existing.seats ?? []).map((s) => ({
    userId: s.userId,
    guestName: s.guestName,
    seat: s.seat,
    seatNumber: s.seatNumber,
    seatClass: s.seatClass,
  }));
  if (seats.length === 0) {
    seats.push({ userId: '<USER_ID>', guestName: null, seat: null, seatNumber: null, seatClass: null });
  }

  // Push the seat the user set in TREK onto their own AirTrail seat (the one with
  // a userId), leaving any co-passenger seats untouched.
  const seatNumber = typeof meta.seat === 'string' && meta.seat.trim() ? meta.seat.trim() : null;
  if (seatNumber) {
    const ownSeat = seats.find((s) => s.userId) ?? seats[0];
    if (ownSeat) ownSeat.seatNumber = seatNumber;
  }

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
    flightReason: meta.flight_reason ?? existing.flightReason ?? null,
    note: reservation.notes ?? existing.note ?? null,
    seats,
  } as AirtrailSavePayload;
}

/**
 * Push a locally-edited linked reservation back to AirTrail using the importer's
 * (owner's) credentials — even if a different member made the edit. If the owner
 * is gone or the flight no longer exists in AirTrail, the link is detached so the
 * next pull's AirTrail-wins policy can't silently revert the local edit.
 */
export async function pushReservationToAirtrail(reservationId: number, tripId: number): Promise<void> {
  if (!syncGloballyEnabled()) return;

  const row = db
    .prepare(
      "SELECT id, trip_id, external_id, external_owner_user_id, sync_enabled FROM reservations WHERE id = ? AND external_source = 'airtrail'",
    )
    .get(reservationId) as
    | { id: number; trip_id: number; external_id: string; external_owner_user_id: number | null; sync_enabled: number }
    | undefined;
  if (!row || !row.sync_enabled) return;

  // AirTrail is read-only by default (#1240). Only push when the flight's owner has
  // explicitly opted in. A no-op skip (not a detach): the link stays active so the
  // inbound, AirTrail-wins pull keeps the reservation up to date.
  if (!row.external_owner_user_id || !isAirtrailWriteEnabled(row.external_owner_user_id)) return;

  const creds: AirtrailCreds | null = getAirtrailCredentials(row.external_owner_user_id);
  if (!creds) {
    detach(tripId, row.id); // owner disconnected — cannot push, so stop syncing
    return;
  }

  let existing: AirtrailFlightRaw | null;
  try {
    existing = await getFlight(creds, Number(row.external_id));
  } catch (err) {
    if (err instanceof AirtrailAuthError) detach(tripId, row.id);
    else logError(`AirTrail push: get failed for reservation ${row.id}: ${err instanceof Error ? err.message : err}`);
    return;
  }
  if (!existing) {
    detach(tripId, row.id); // gone in AirTrail → treat like a remote delete
    return;
  }

  const reservation = getReservationWithJoins(row.id);
  if (!reservation) return;

  const payload = buildSavePayload(reservation, existing);
  if (!payload) return;

  try {
    await saveFlight(creds, payload);
    // Self-write suppression: re-read the saved flight and store its hash so the
    // next poll doesn't treat our own write as an inbound change.
    const saved = await getFlight(creds, Number(row.external_id));
    if (saved) {
      db.prepare('UPDATE reservations SET external_hash = ?, external_synced_at = ? WHERE id = ?').run(
        canonicalHash(saved),
        new Date().toISOString(),
        row.id,
      );
    }
  } catch (err) {
    logError(`AirTrail push failed for reservation ${row.id}: ${err instanceof Error ? err.message : err}`);
  }
}
