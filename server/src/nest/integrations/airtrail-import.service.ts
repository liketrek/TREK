import { Days } from '../../db/entities/Days.entity';
import { ReservationEndpoints } from '../../db/entities/ReservationEndpoints.entity';
import { Reservations } from '../../db/entities/Reservations.entity';
import { RESERVATION_METADATA } from '../../db/json-columns';
import { DaysRepository } from '../../db/repositories/Days.repository';
import { ReservationEndpointsRepository } from '../../db/repositories/ReservationEndpoints.repository';
import { ReservationsRepository } from '../../db/repositories/Reservations.repository';
import { decodeJson } from '../../utils/json-column';
import { UnitOfWork } from '../database/unit-of-work';
import { RealtimeService } from '../realtime/realtime.service';
import { ReservationsService } from '../reservations/reservations.service';
import { AirtrailRequestError, type AirtrailFlightRaw } from './airtrail.client';
import { AirtrailClient } from './airtrail.client';
import {
  canonicalHash,
  mapFlightToReservation,
  mapFlightsToMultiLegReservation,
  normalizeFlight,
} from './airtrail.mapper';
import { AirtrailService } from './airtrail.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { AirtrailImportResult } from '@trek/shared';

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
    mapped.endpoints.find((e) => e.role === 'from')?.code ?? null,
    mapped.endpoints.find((e) => e.role === 'to')?.code ?? null,
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
  const norm = group.map((raw) => ({ raw, n: normalizeFlight(raw) }));
  const depMs = (n: (typeof norm)[number]['n']): number => (n.departure ? Date.parse(n.departure) : Number.NaN);
  if (norm.some((x) => Number.isNaN(depMs(x.n)))) return null;
  norm.sort((a, b) => depMs(a.n) - depMs(b.n));
  const origin = norm[0].n.fromCode;
  for (let i = 1; i < norm.length; i++) {
    const prev = norm[i - 1].n;
    const next = norm[i].n;
    if (!prev.toCode || !next.fromCode || prev.toCode.toUpperCase() !== next.fromCode.toUpperCase()) return null;
    if (origin && next.toCode && next.toCode.toUpperCase() === origin.toUpperCase()) return null;
    const arrMs = prev.arrival ? Date.parse(prev.arrival) : Number.NaN;
    if (Number.isNaN(arrMs)) return null;
    const gap = depMs(next) - arrMs;
    if (gap < 0 || gap > 24 * 3600 * 1000) return null;
  }
  return norm.map((x) => x.raw);
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

/**
 * Importing selected AirTrail flights into a trip.
 *
 * Folded out of services/airtrail/airtrailImport.ts. The dedupe pipeline, the
 * connection-chain detection and the day matching are unchanged; the db
 * singleton, the raw websocket broadcast and the reservations bridge are
 * injected now.
 */
@Injectable()
export class AirtrailImportService {
  constructor(
    @InjectRepository(Reservations) private readonly reservationsRepo: ReservationsRepository,
    @InjectRepository(ReservationEndpoints) private readonly endpointsRepo: ReservationEndpointsRepository,
    @InjectRepository(Days) private readonly daysRepo: DaysRepository,
    private readonly realtime: RealtimeService,
    private readonly reservations: ReservationsService,
    private readonly client: AirtrailClient,
    private readonly airtrail: AirtrailService,
    private readonly uow: UnitOfWork,
  ) {}

  /**
   * `tripId` arrives as `string | number` (route param vs. internal caller);
   * `DaysRepository.listByTrip`'s typed filter needs a genuine `number`
   * (rule 23) — same coercion shape as `ReservationsService.rowIdNum`.
   * `-1` never matches a real trip id, so an already-impossible `tripId`
   * degrades to "no days", never a `NaN` reaching the query.
   */
  private rowIdNum(value: string | number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : -1;
  }

  /**
   * @txIndependent one transaction per imported booking: a flight or a joined
   * connection lands with its AirTrail link or not at all, and one that fails is
   * reported skipped while the others stay imported.
   */
  async importAirtrailFlights(
    tripId: string | number,
    userId: number,
    flightIds: string[],
    socketId: string | undefined,
    connections: string[][] = [],
  ): Promise<AirtrailImportResult> {
    const creds = await this.airtrail.getAirtrailCredentials(userId);
    if (!creds) throw new AirtrailRequestError('AirTrail is not connected', 400);

    const wanted = new Set(flightIds.map(String));
    const selected = (await this.client.listFlights(creds)).filter((f) => wanted.has(String(f.id)));
    const byId = new Map(selected.map((f) => [String(f.id), f]));

    const result: AirtrailImportResult = { imported: [], skipped: [] };
    const tripIdNum = this.rowIdNum(tripId);

    // Every AirTrail id already linked to this trip: the external_id column plus
    // the metadata.airtrail_ids of joined multi-leg imports.
    const linkedIds = new Set<string>();
    const linkedRows = await this.reservationsRepo.listAirtrailLinkedForTrip(tripIdNum);
    for (const row of linkedRows) {
      if (row.external_id) linkedIds.add(row.external_id);
      const ids = decodeJson(RESERVATION_METADATA, row.metadata, `airtrail ${row.external_id}`).airtrail_ids;
      if (Array.isArray(ids)) for (const id of ids) linkedIds.add(String(id));
    }

    const existing = await this.reservationsRepo.listFlightReservationsForTrip(tripIdNum);
    const endpointsByReservation = new Map<number, EndpointRow[]>();
    const endpointRows = await this.endpointsRepo.listFlightEndpointsForTrip(tripIdNum);
    for (const ep of endpointRows) {
      const list = endpointsByReservation.get(ep.reservation_id);
      if (list) list.push(ep);
      else endpointsByReservation.set(ep.reservation_id, [ep]);
    }

    const days = await this.daysRepo.listByTrip(tripIdNum);
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
      const meta = decodeJson(RESERVATION_METADATA, row.metadata, `reservation ${row.id}`);
      const eps = endpointsByReservation.get(row.id) ?? [];
      const legs: any[] | null = Array.isArray(meta.legs) ? meta.legs : null;
      if (legs && legs.length > 1) {
        // One signature per leg. The leg's departure date comes from its own
        // dep_day_id when set; the positional endpoint fallback is only sound
        // while no endpoint was dropped (e.g. for missing coordinates) — a
        // misaligned date would produce a WRONG signature, worse than none.
        const aligned = eps.length === legs.length + 1;
        legs.forEach((leg, i) => {
          const legDate =
            (typeof leg?.dep_day_id === 'number' ? dayDateById.get(leg.dep_day_id) : null) ??
            (aligned ? eps[i]?.local_date : null) ??
            null;
          const sig = softSignature(legDate, leg?.flight_number ?? null, leg?.from ?? null, leg?.to ?? null);
          if (sig) existingSigs.add(sig);
        });
      } else {
        const from = eps[0]?.code ?? null;
        const to = eps.length > 1 ? eps[eps.length - 1].code : null;
        const sig = softSignature(
          depDate(row.reservation_time),
          (meta.flight_number as string | null | undefined) ?? null,
          from,
          to,
        );
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
      const members = unique.map((id) => byId.get(id)).filter((f): f is AirtrailFlightRaw => !!f);
      const chain =
        members.length === unique.length && !unique.some((id) => groupedIds.has(id))
          ? orderConnectionChain(members)
          : null;
      if (!chain) {
        console.warn('[airtrail-import] join group is not a connection chain — importing flights individually');
        continue;
      }
      if (
        unique.some((id) => linkedIds.has(id)) ||
        chain.some((f) => {
          const sig = flightSignature(f);
          return !!sig && existingSigs.has(sig);
        })
      ) {
        continue; // a member already exists in the trip — let the single path sort it out
      }
      chains.push(chain);
      for (const id of unique) groupedIds.add(id);
    }

    for (const chain of chains) {
      const ids = chain.map((f) => String(f.id));
      try {
        const mapped = mapFlightsToMultiLegReservation(chain, resolveDayId);
        const now = new Date().toISOString();
        // The booking and its AirTrail link are one write: a failed link must not
        // leave a booking behind that this import then reports as skipped. The
        // flights were fetched above, so nothing in here waits on the network.
        const reservation = await this.uow.transactional(async () => {
          const created = (await this.reservations.create(tripId, mapped as any)).reservation;
          await this.reservationsRepo.linkAirtrailMultiLeg(Number(created.id), ids[0], userId, now);
          return created;
        });

        reservation.external_source = 'airtrail';
        reservation.external_id = ids[0];
        reservation.external_owner_user_id = userId;
        reservation.sync_enabled = 0;
        reservation.external_synced_at = now;

        this.realtime.broadcast(String(tripId), 'reservation:created', { reservation } as never, socketId);
        for (const f of chain) {
          const sig = flightSignature(f);
          if (sig) existingSigs.add(sig);
        }
        ids.forEach((id) => linkedIds.add(id));
        result.imported.push(...ids);
      } catch (err) {
        console.error(
          '[airtrail-import] failed to import connection',
          ids.join('+'),
          err instanceof Error ? err.message : err,
        );
        for (const id of ids) {
          result.skipped.push({
            flightId: id,
            reason: 'invalid',
            detail: err instanceof Error ? err.message : undefined,
          });
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
        const now = new Date().toISOString();
        // One write with its link, as for a joined connection above.
        const reservation = await this.uow.transactional(async () => {
          const created = (await this.reservations.create(tripId, mapped as any)).reservation;
          await this.reservationsRepo.linkAirtrailSingleFlight(
            Number(created.id),
            fid,
            userId,
            canonicalHash(flight),
            now,
          );
          return created;
        });

        // Carry the linkage on the broadcast payload so members see the badge live.
        reservation.external_source = 'airtrail';
        reservation.external_id = fid;
        reservation.external_owner_user_id = userId;
        reservation.sync_enabled = 1;
        reservation.external_synced_at = now;

        this.realtime.broadcast(String(tripId), 'reservation:created', { reservation } as never, socketId);
        if (sig) existingSigs.add(sig);
        linkedIds.add(fid);
        result.imported.push(fid);
      } catch (err) {
        console.error('[airtrail-import] failed to import flight', fid, err instanceof Error ? err.message : err);
        result.skipped.push({
          flightId: fid,
          reason: 'invalid',
          detail: err instanceof Error ? err.message : undefined,
        });
      }
    }

    return result;
  }
}
