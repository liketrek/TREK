import { avatarUrl } from '../common/avatarUrl';
import { DatabaseService } from '../database/database.service';
import type { ReservationRow, ReservationEndpoint, ReservationTraveler } from './reservations.service';
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
 */
@Injectable()
export class ReservationsReadRepository {
  constructor(private readonly db: DatabaseService) {}

  getReservationWithJoins(id: string | number): ReservationRow | undefined {
    const row = this.db.get<ReservationRow>(
      `
    SELECT r.*, d.day_number, p.name as place_name, r.assignment_id,
      ap.place_id as accommodation_place_id, acc_p.name as accommodation_name,
      ap.start_day_id as accommodation_start_day_id, ap.end_day_id as accommodation_end_day_id
    FROM reservations r
    LEFT JOIN days d ON r.day_id = d.id
    LEFT JOIN places p ON r.place_id = p.id
    LEFT JOIN day_accommodations ap ON r.accommodation_id = ap.id
    LEFT JOIN places acc_p ON ap.place_id = acc_p.id
    WHERE r.id = ?
  `,
      id,
    );
    if (!row) return undefined;
    row.endpoints = this.loadEndpoints(row.id);
    row.travelers = this.loadTravelers(row.id);
    // accommodation_id is a TEXT column; the integer FK reads back as a numeric
    // string (e.g. "14.0"). Normalize to an int so clients can parse it.
    row.accommodation_id = row.accommodation_id == null ? null : Math.trunc(Number(row.accommodation_id));
    return row;
  }

  loadEndpoints(reservationId: number): ReservationEndpoint[] {
    return this.db.all<ReservationEndpoint>(
      'SELECT * FROM reservation_endpoints WHERE reservation_id = ? ORDER BY sequence',
      reservationId,
    );
  }

  loadTravelers(reservationId: number | string): ReservationTraveler[] {
    const rows = this.db.all<ReservationTraveler>(
      `
    SELECT rt.user_id, COALESCE(u.display_name, u.username) AS username, u.avatar, u.is_guest
    FROM reservation_travelers rt
    JOIN users u ON rt.user_id = u.id
    WHERE rt.reservation_id = ?
  `,
      reservationId,
    );
    return rows.map((r) => toTraveler(r));
  }
}
