import { ReservationEndpoints } from '../../db/entities/ReservationEndpoints.entity';
import { ReservationTravelers } from '../../db/entities/ReservationTravelers.entity';
import { Reservations } from '../../db/entities/Reservations.entity';
import type { ReservationEndpointsRepository } from '../../db/repositories/ReservationEndpoints.repository';
import type { ReservationTravelersRepository } from '../../db/repositories/ReservationTravelers.repository';
import type { ReservationsRepository } from '../../db/repositories/Reservations.repository';
import { avatarUrl } from '../common/avatarUrl';
import type { ReservationRow, ReservationEndpoint, ReservationTraveler } from './reservations.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

/** The one traveler projection every reservation read shares (avatar_url included). */
export function toTraveler(r: {
  user_id: number;
  username: string;
  avatar: string | null;
  is_guest?: number | null;
}): ReservationTraveler {
  return {
    user_id: r.user_id,
    username: r.username,
    avatar: r.avatar,
    is_guest: r.is_guest ?? null,
    avatar_url: avatarUrl(r),
  };
}

/**
 * The single-reservation hydration reads, split out of ReservationsService (the
 * trek_photos repository precedent) so consumers outside ReservationsModule can
 * reach them without importing the module. The concrete case: the AirTrail
 * write-back (AirtrailLinkService) needs the hydrated row for its payload and
 * its update broadcast, and injecting ReservationsService there would close
 * ReservationsModule → AirtrailCoreModule → ReservationsModule — the cycle
 * that used to force airtrail.bridge. ReservationsService injects this and
 * delegates, so there is exactly one copy of each query.
 *
 * Renamed from `ReservationsReadRepository` (Plan 3d Task 0, R11 — inventory
 * §18.3): this is a plain Nest `@Injectable`, not a MikroORM repository
 * extending `TrekRepository`, so it must not carry the `Repository` suffix —
 * that name is reserved for the ORM layer's "one repository per entity"
 * convention (D4). Its three statements (RR1-RR3) now delegate to
 * `ReservationsRepository.findWithJoins`/`ReservationEndpointsRepository
 * .listForReservation`/`ReservationTravelersRepository.listForReservation`
 * (Plan 3d Task 2, §18.3 option (b) — the class stays a thin facade rather
 * than being deleted: `AirtrailCoreModule`/its own test suites reach it by
 * this exact public shape, and Task 0's rename already committed to keeping
 * it). Zero behaviour change beyond the SQL leaving this file.
 */
@Injectable()
export class ReservationsReadService {
  constructor(
    @InjectRepository(Reservations) private readonly reservationsRepo: ReservationsRepository,
    @InjectRepository(ReservationEndpoints) private readonly endpointsRepo: ReservationEndpointsRepository,
    @InjectRepository(ReservationTravelers) private readonly travelersRepo: ReservationTravelersRepository,
  ) {}

  async getReservationWithJoins(id: string | number): Promise<ReservationRow | undefined> {
    // RR1
    const row = await this.reservationsRepo.findWithJoins(id);
    if (!row) return undefined;
    const result: ReservationRow = { ...row };
    result.endpoints = await this.loadEndpoints(row.id);
    result.travelers = await this.loadTravelers(row.id);
    // accommodation_id is a TEXT column; the integer FK reads back as a numeric
    // string (e.g. "14.0"). Normalize to an int so clients can parse it.
    result.accommodation_id = row.accommodation_id == null ? null : Math.trunc(Number(row.accommodation_id));
    return result;
  }

  async loadEndpoints(reservationId: number): Promise<ReservationEndpoint[]> {
    // RR2 — no ORDER BY difference: `ReservationEndpointsRepository
    // .listForReservation` already orders by `sequence` (RR2's own shape).
    return (await this.endpointsRepo.listForReservation(reservationId)) as ReservationEndpoint[];
  }

  async loadTravelers(reservationId: number | string): Promise<ReservationTraveler[]> {
    // RR3 — no ORDER BY (unlike RS6), matching the legacy statement's own row order.
    const rows = await this.travelersRepo.listForReservation(Number(reservationId));
    return rows.map((r) => toTraveler(r));
  }
}
