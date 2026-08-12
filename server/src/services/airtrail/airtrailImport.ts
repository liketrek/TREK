import type { AirtrailImportResult } from '@trek/shared';
import { db } from '../../db/database';
import { broadcast } from '../../websocket';
import { createReservation } from '../reservationService';
import { getAirtrailCredentials } from './airtrailService';
import { AirtrailRequestError, listFlights } from './airtrailClient';
import type { AirtrailFlightRaw } from './airtrailClient';
import { canonicalHash, mapFlightToReservation, mapFlightsToMultiLegReservation, normalizeFlight } from './airtrailMapper';

interface ExistingFlightRow {
  id: number;
  reservation_time: string | null;
  metadata: string | null;
}

interface EndpointRow {
  reservation_id: number;
  code: string | null;
  local_date: string | null;
  sequence: number;
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

/** The signature a single AirTrail flight would get as its own reservation. */
function flightSignature(flight: AirtrailFlightRaw): string | null {
  const mapped = mapFlightToReservation(flight);
  return softSignature(
    depDate(mapped.reservation_time),
    (mapped.metadata.flight_number as string) ?? null,
    mapped.endpoints.find(e => e.role === 'from')?.code ?? null,
    mapped.endpoints.find(e => e.role === 'to')?.code ?? null,
  );
}

/**
 * Order a requested join group by departure and verify it forms a real
 * connection chain: each flight leaves the airport the previous one arrived at,
 * onward in time and within 24 h — the same window the booking import applies
 * to same-PNR legs. A leg landing back at the chain's origin is a return
 * flight, never a connection. Flights without usable instants can't prove any
 * of this, so they don't chain. Returns the ordered chain, or null when the
 * flights don't chain; the members then import individually, exactly as if no
 * join had been requested.
 */
function orderConnectionChain(group: AirtrailFlightRaw[]): AirtrailFlightRaw[] | null {
  if (group.length < 2) return null;
  const norm = group.map(raw => ({ raw, n: normalizeFlight(raw) }));
  const depMs = (n: (typeof norm)[number]['n']): number => (n.departure ? Date.parse(n.departure) : NaN);
  if (norm.some(x => Number.isNaN(depMs(x.n)))) return null;
  norm.sort((a, b) => depMs(a.n) - depMs(b.n));
  const origin = norm[0].n.fromCode;
  for (let i = 1; i < norm.length; i++) {
    const prev = norm[i - 1].n;
    const next = norm[i].n;
    if (!prev.toCode || !next.fromCode || prev.toCode.toUpperCase() !== next.fromCode.toUpperCase()) return null;
    if (origin && next.toCode && next.toCode.toUpperCase() === origin.toUpperCase()) return null;
    const arrMs = prev.arrival ? Date.parse(prev.arrival) : NaN;
    if (Number.isNaN(arrMs)) return null;
    const gap = depMs(next) - arrMs;
    if (gap < 0 || gap > 24 * 3600 * 1000) return null;
  }
  return norm.map(x => x.raw);
}

/**
 * Import the given AirTrail flights into a trip as reservations (type:'flight'),
 * recording the AirTrail linkage for two-way sync and broadcasting each one live.
 *
 * `connections` names chains of selected flights to import as ONE multi-leg
 * reservation each, with the connection airports as layover stops (#1535). A
 * joined booking is created detached from live sync (sync_enabled = 0): AirTrail
 * has no multi-leg flight entity it could round-trip to, and a pull would
 * flatten the layover again. All member ids are kept in metadata.airtrail_ids
 * so none of the legs is offered for re-import.
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
  connections: string[][] = [],
): Promise<AirtrailImportResult> {
  const creds = getAirtrailCredentials(userId);
  if (!creds) throw new AirtrailRequestError('AirTrail is not connected', 400);

  const wanted = new Set(flightIds.map(String));
  const selected = (await listFlights(creds)).filter(f => wanted.has(String(f.id)));
  const byId = new Map(selected.map(f => [String(f.id), f]));

  const result: AirtrailImportResult = { imported: [], skipped: [] };

  // Every AirTrail id already linked to this trip: the external_id column plus
  // the metadata.airtrail_ids of joined multi-leg imports.
  const linkedIds = new Set<string>();
  const linkedRows = db
    .prepare("SELECT external_id, metadata FROM reservations WHERE trip_id = ? AND external_source = 'airtrail'")
    .all(tripId) as { external_id: string | null; metadata: string | null }[];
  for (const row of linkedRows) {
    if (row.external_id) linkedIds.add(row.external_id);
    try {
      const ids = row.metadata ? JSON.parse(row.metadata).airtrail_ids : null;
      if (Array.isArray(ids)) for (const id of ids) linkedIds.add(String(id));
    } catch {
      /* malformed metadata — ignore */
    }
  }

  const existing = db
    .prepare("SELECT r.id, r.reservation_time, r.metadata FROM reservations r WHERE r.trip_id = ? AND r.type = 'flight'")
    .all(tripId) as ExistingFlightRow[];
  const endpointsByReservation = new Map<number, EndpointRow[]>();
  const endpointRows = db
    .prepare(
      `SELECT e.reservation_id, e.code, e.local_date, e.sequence
       FROM reservation_endpoints e JOIN reservations r ON r.id = e.reservation_id
       WHERE r.trip_id = ? AND r.type = 'flight' ORDER BY e.sequence`,
    )
    .all(tripId) as EndpointRow[];
  for (const ep of endpointRows) {
    const list = endpointsByReservation.get(ep.reservation_id);
    if (list) list.push(ep);
    else endpointsByReservation.set(ep.reservation_id, [ep]);
  }

  const days = db.prepare('SELECT id, date FROM days WHERE trip_id = ?').all(tripId) as { id: number; date: string | null }[];
  const dayIdByDate = new Map<string, number>();
  const dayDateById = new Map<number, string>();
  for (const day of days) {
    if (!day.date) continue;
    if (!dayIdByDate.has(day.date)) dayIdByDate.set(day.date, day.id);
    dayDateById.set(day.id, day.date);
  }
  const resolveDayId = (date: string | null): number | null => (date ? (dayIdByDate.get(date) ?? null) : null);

  const existingSigs = new Set<string>();
  for (const row of existing) {
    let meta: Record<string, any> = {};
    try {
      meta = row.metadata ? JSON.parse(row.metadata) : {};
    } catch {
      /* malformed metadata — ignore */
    }
    const eps = endpointsByReservation.get(row.id) ?? [];
    const legs: any[] | null = Array.isArray(meta.legs) ? meta.legs : null;
    if (legs && legs.length > 1) {
      // One signature per leg. The leg's departure date comes from its own
      // dep_day_id when set; the positional endpoint fallback is only sound
      // while no endpoint was dropped (e.g. for missing coordinates) — a
      // misaligned date would produce a WRONG signature, worse than none.
      const aligned = eps.length === legs.length + 1;
      legs.forEach((leg, i) => {
        const legDate = (typeof leg?.dep_day_id === 'number' ? dayDateById.get(leg.dep_day_id) : null)
          ?? (aligned ? eps[i]?.local_date : null)
          ?? null;
        const sig = softSignature(legDate, leg?.flight_number ?? null, leg?.from ?? null, leg?.to ?? null);
        if (sig) existingSigs.add(sig);
      });
    } else {
      const from = eps[0]?.code ?? null;
      const to = eps.length > 1 ? eps[eps.length - 1].code : null;
      const sig = softSignature(depDate(row.reservation_time), meta.flight_number ?? null, from, to);
      if (sig) existingSigs.add(sig);
    }
  }

  // Resolve the requested joins into validated chains. A group that doesn't
  // chain, overlaps another, or contains an already-linked/duplicate flight
  // degrades to individual imports rather than failing the whole request.
  const groupedIds = new Set<string>();
  const chains: AirtrailFlightRaw[][] = [];
  for (const ids of connections) {
    const unique = [...new Set(ids.map(String))];
    const members = unique.map(id => byId.get(id)).filter((f): f is AirtrailFlightRaw => !!f);
    const chain = members.length === unique.length && !unique.some(id => groupedIds.has(id))
      ? orderConnectionChain(members)
      : null;
    if (!chain) {
      console.warn('[airtrail-import] join group is not a connection chain — importing flights individually');
      continue;
    }
    if (unique.some(id => linkedIds.has(id)) || chain.some(f => {
      const sig = flightSignature(f);
      return !!sig && existingSigs.has(sig);
    })) {
      continue; // a member already exists in the trip — let the single path sort it out
    }
    chains.push(chain);
    for (const id of unique) groupedIds.add(id);
  }

  for (const chain of chains) {
    const ids = chain.map(f => String(f.id));
    try {
      const mapped = mapFlightsToMultiLegReservation(chain, resolveDayId);
      const { reservation } = createReservation(tripId, mapped as any);
      const now = new Date().toISOString();
      db.prepare(
        `UPDATE reservations SET external_source = 'airtrail', external_id = ?, external_owner_user_id = ?,
                sync_enabled = 0, external_synced_at = ? WHERE id = ?`,
      ).run(ids[0], userId, now, reservation.id);

      reservation.external_source = 'airtrail';
      reservation.external_id = ids[0];
      reservation.external_owner_user_id = userId;
      reservation.sync_enabled = 0;
      reservation.external_synced_at = now;

      broadcast(tripId, 'reservation:created', { reservation }, socketId);
      for (const f of chain) {
        const sig = flightSignature(f);
        if (sig) existingSigs.add(sig);
      }
      ids.forEach(id => linkedIds.add(id));
      result.imported.push(...ids);
    } catch (err) {
      console.error('[airtrail-import] failed to import connection', ids.join('+'), err instanceof Error ? err.message : err);
      for (const id of ids) {
        result.skipped.push({ flightId: id, reason: 'invalid', detail: err instanceof Error ? err.message : undefined });
      }
    }
  }

  for (const flight of selected) {
    const fid = String(flight.id);
    if (groupedIds.has(fid)) continue;
    if (linkedIds.has(fid)) {
      result.skipped.push({ flightId: fid, reason: 'already-imported' });
      continue;
    }

    const mapped = mapFlightToReservation(flight);
    const sig = flightSignature(flight);
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
