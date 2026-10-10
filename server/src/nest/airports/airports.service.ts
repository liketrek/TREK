import { ReservationEndpoints } from '../../db/entities/ReservationEndpoints.entity';
import { Reservations } from '../../db/entities/Reservations.entity';
import { RESERVATION_METADATA } from '../../db/json-columns';
import { ReservationEndpointsRepository } from '../../db/repositories/ReservationEndpoints.repository';
import { ReservationsRepository } from '../../db/repositories/Reservations.repository';
import { decodeJsonResult, logJsonFailure } from '../../utils/json-column';
import { UnitOfWork } from '../database/unit-of-work';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { searchAirports, findByIata, load } from './airports.data';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import type { Airport } from '@trek/shared';

/**
 * The in-container face of the airport dataset, plus the flight-endpoint
 * backfill that needs the database.
 *
 * The backfill used to run from db/database.ts at module load, through a
 * require() back into services/ — a cycle that only held because `db` happened
 * to be initialised by then. It runs on application bootstrap now: it repairs
 * rows, nothing boots on it, and the container is fully built by that point.
 *
 * task-6-rereview.md M1: raw SQL only today, but this is the same boot-sweep
 * shape C1 found repository-backed elsewhere, so it goes through the one
 * choke point (`CronRegistrarService.runOnBoot`) every other one-off boot
 * sweep uses now, rather than running outside a request context directly.
 * `runOnBoot` has no `isEnabled()` gate (unlike `register()`), so — parity
 * with the pre-existing behavior — the backfill still runs in every test
 * harness that boots this service with a MikroORM, exactly as it did before.
 *
 * task-6-rereview2.md M3: the pre-change code could never reject —
 * `onApplicationBootstrap` awaited one `try`/`catch` around the whole thing.
 * Putting the `try`/`catch` only INSIDE the `runOnBoot` callback left a gap:
 * `runOnBoot` itself (its `RequestContext.create`/context machinery) has no
 * catch of its own, so anything it throws before the callback runs would
 * propagate out of `onApplicationBootstrap` and abort `app.init()` — a total
 * boot refusal where the old code swallowed everything. The outer
 * `try`/`catch` below restores that parity while the inner one stays for its
 * own reason: `backfillFlightEndpoints` failing must not surface as a
 * `runOnBoot`-level error.
 */
@Injectable()
export class AirportsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Reservations) private readonly reservationsRepo: ReservationsRepository,
    @InjectRepository(ReservationEndpoints) private readonly endpointsRepo: ReservationEndpointsRepository,
    private readonly registrar: CronRegistrarService,
    private readonly uow: UnitOfWork,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.registrar.runOnBoot('airports-flight-endpoints-boot', async () => {
        try {
          await this.backfillFlightEndpoints();
        } catch (err) {
          console.error('[DB] Flight endpoint backfill failed:', err);
        }
      });
    } catch (err) {
      console.error('[DB] Flight endpoint backfill failed:', err);
    }
  }

  search(query: string): Airport[] {
    return searchAirports(query) as Airport[];
  }

  findByIata(code: string): Airport | null {
    return findByIata(code) as Airport | null;
  }

  /**
   * Endpoints for every flight booked before they existed, from the IATA codes in
   * its metadata; a flight without usable codes is flagged for review instead.
   *
   * @txIndependent one transaction per flight: its two endpoints land together or
   * not at all (half a pair hid the flight from every later run), and a flight that
   * failed is picked up again on the next boot.
   */
  async backfillFlightEndpoints(): Promise<void> {
    const pending = await this.reservationsRepo.listFlightsMissingEndpoints();

    if (pending.length === 0) return;

    load();

    let filled = 0;
    let flagged = 0;
    for (const r of pending) {
      if (await this.uow.transactional(() => this.backfillOne(r))) filled++;
      else flagged++;
    }

    console.log(`[airports] Backfill: ${filled} filled, ${flagged} flagged for review`);
  }

  /** One flight's endpoints, or its review flag. True when it was filled. */
  private async backfillOne(r: {
    id: number;
    metadata: string | null;
    reservation_time: string | null;
    reservation_end_time: string | null;
  }): Promise<boolean> {
    if (!r.metadata) {
      await this.reservationsRepo.markNeedsReview(r.id);
      return false;
    }
    const decoded = decodeJsonResult(RESERVATION_METADATA, r.metadata);
    if (!decoded.ok) {
      logJsonFailure(RESERVATION_METADATA, decoded.reason, `reservation ${r.id}`);
      await this.reservationsRepo.markNeedsReview(r.id);
      return false;
    }
    const meta = decoded.value;

    const dep = meta.departure_airport ? findByIata(String(meta.departure_airport).slice(0, 3)) : null;
    const arr = meta.arrival_airport ? findByIata(String(meta.arrival_airport).slice(0, 3)) : null;

    if (!dep || !arr) {
      await this.reservationsRepo.markNeedsReview(r.id);
      return false;
    }

    const split = (iso: string | null) => {
      if (!iso) return { date: null as string | null, time: null as string | null };
      const [date, time] = iso.split('T');
      return { date: date || null, time: time ? time.slice(0, 5) : null };
    };
    const depParts = split(r.reservation_time);
    const arrParts = split(r.reservation_end_time);

    await this.endpointsRepo.insertEndpoint({
      reservation_id: r.id,
      role: 'from',
      sequence: 0,
      name: dep.city ? `${dep.city} (${dep.iata})` : dep.name,
      code: dep.iata,
      lat: dep.lat,
      lng: dep.lng,
      timezone: dep.tz,
      local_time: depParts.time,
      local_date: depParts.date,
    });
    await this.endpointsRepo.insertEndpoint({
      reservation_id: r.id,
      role: 'to',
      sequence: 1,
      name: arr.city ? `${arr.city} (${arr.iata})` : arr.name,
      code: arr.iata,
      lat: arr.lat,
      lng: arr.lng,
      timezone: arr.tz,
      local_time: arrParts.time,
      local_date: arrParts.date,
    });
    return true;
  }
}
