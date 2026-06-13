import type { AirtrailImportResult } from '@trek/shared';
import { db } from '../../db/database';
import { broadcast } from '../../websocket';
import { createReservation } from '../reservationService';
import { getAirtrailCredentials } from './airtrailService';
import { AirtrailRequestError, listFlights } from './airtrailClient';
import { canonicalHash, mapFlightToReservation } from './airtrailMapper';

interface ExistingFlightRow {
  id: number;
  reservation_time: string | null;
  metadata: string | null;
  from_code: string | null;
  to_code: string | null;
}

function depDate(t: string | null): string | null {
  return t && /^\d{4}-\d{2}-\d{2}/.test(t) ? t.slice(0, 10) : null;
}

/** A loose "same physical flight" key: flight number + date, else route + date. */
function softSignature(
  date: string | null,
  flightNumber: string | null,
  fromCode: string | null,
  toCode: string | null,
): string | null {
  if (!date) return null;
  if (flightNumber) return `fn:${flightNumber.toUpperCase()}@${date}`;
  if (fromCode && toCode) return `rt:${fromCode.toUpperCase()}-${toCode.toUpperCase()}@${date}`;
  return null;
}

/**
 * Import the given AirTrail flights into a trip as reservations (type:'flight'),
 * recording the AirTrail linkage for two-way sync and broadcasting each one live.
 *
 * Dedup: a flight already linked to this trip is skipped ('already-imported'); a
 * flight that looks like one already in the trip — e.g. the same flight another
 * member already imported from their own AirTrail — is skipped ('already-in-trip').
 * The server re-fetches the flights by id with the caller's own key, so the client
 * cannot inject arbitrary flight data.
 */
export async function importAirtrailFlights(
  tripId: string | number,
  userId: number,
  flightIds: string[],
  socketId: string | undefined,
): Promise<AirtrailImportResult> {
  const creds = getAirtrailCredentials(userId);
  if (!creds) throw new AirtrailRequestError('AirTrail is not connected', 400);

  const wanted = new Set(flightIds.map(String));
  const selected = (await listFlights(creds)).filter(f => wanted.has(String(f.id)));

  const result: AirtrailImportResult = { imported: [], skipped: [] };

  const linkedIds = new Set(
    (db.prepare("SELECT external_id FROM reservations WHERE trip_id = ? AND external_source = 'airtrail'").all(tripId) as {
      external_id: string | null;
    }[])
      .map(r => r.external_id)
      .filter((v): v is string => !!v),
  );

  const existing = db
    .prepare(
      `SELECT r.id, r.reservation_time, r.metadata,
              (SELECT code FROM reservation_endpoints WHERE reservation_id = r.id AND role = 'from' LIMIT 1) AS from_code,
              (SELECT code FROM reservation_endpoints WHERE reservation_id = r.id AND role = 'to' LIMIT 1) AS to_code
       FROM reservations r WHERE r.trip_id = ? AND r.type = 'flight'`,
    )
    .all(tripId) as ExistingFlightRow[];

  const existingSigs = new Set<string>();
  for (const row of existing) {
    let fn: string | null = null;
    try {
      fn = row.metadata ? (JSON.parse(row.metadata).flight_number ?? null) : null;
    } catch {
      /* malformed metadata — ignore */
    }
    const sig = softSignature(depDate(row.reservation_time), fn, row.from_code, row.to_code);
    if (sig) existingSigs.add(sig);
  }

  for (const flight of selected) {
    const fid = String(flight.id);
    if (linkedIds.has(fid)) {
      result.skipped.push({ flightId: fid, reason: 'already-imported' });
      continue;
    }

    const mapped = mapFlightToReservation(flight);
    const sig = softSignature(
      depDate(mapped.reservation_time),
      (mapped.metadata.flight_number as string) ?? null,
      mapped.endpoints.find(e => e.role === 'from')?.code ?? null,
      mapped.endpoints.find(e => e.role === 'to')?.code ?? null,
    );
    if (sig && existingSigs.has(sig)) {
      result.skipped.push({ flightId: fid, reason: 'already-in-trip', detail: mapped.title });
      continue;
    }

    try {
      const { reservation } = createReservation(tripId, mapped as any);
      const now = new Date().toISOString();
      db.prepare(
        `UPDATE reservations SET external_source = 'airtrail', external_id = ?, external_owner_user_id = ?,
                sync_enabled = 1, external_hash = ?, external_synced_at = ? WHERE id = ?`,
      ).run(fid, userId, canonicalHash(flight), now, reservation.id);

      // Carry the linkage on the broadcast payload so members see the badge live.
      reservation.external_source = 'airtrail';
      reservation.external_id = fid;
      reservation.external_owner_user_id = userId;
      reservation.sync_enabled = 1;
      reservation.external_synced_at = now;

      broadcast(tripId, 'reservation:created', { reservation }, socketId);
      if (sig) existingSigs.add(sig);
      linkedIds.add(fid);
      result.imported.push(fid);
    } catch (err) {
      console.error('[airtrail-import] failed to import flight', fid, err instanceof Error ? err.message : err);
      result.skipped.push({ flightId: fid, reason: 'invalid', detail: err instanceof Error ? err.message : undefined });
    }
  }

  return result;
}
