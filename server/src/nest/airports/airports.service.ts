import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import type { Airport } from '@trek/shared';
import { searchAirports, findByIata, load } from './airports.data';
import { DatabaseService } from '../database/database.service';

/**
 * The in-container face of the airport dataset, plus the flight-endpoint
 * backfill that needs the database.
 *
 * The backfill used to run from db/database.ts at module load, through a
 * require() back into services/ — a cycle that only held because `db` happened
 * to be initialised by then. It runs on application bootstrap now: it repairs
 * rows, nothing boots on it, and the container is fully built by that point.
 */
@Injectable()
export class AirportsService implements OnApplicationBootstrap {
  constructor(private readonly db: DatabaseService) {}

  onApplicationBootstrap(): void {
    try {
      this.backfillFlightEndpoints();
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

  backfillFlightEndpoints(): void {
    const pending = this.db.prepare(`
      SELECT r.id, r.metadata, r.reservation_time, r.reservation_end_time
      FROM reservations r
      WHERE r.type = 'flight'
        AND NOT EXISTS (SELECT 1 FROM reservation_endpoints e WHERE e.reservation_id = r.id)
    `).all() as { id: number; metadata: string | null; reservation_time: string | null; reservation_end_time: string | null }[];

    if (pending.length === 0) return;

    load();
    const insert = this.db.prepare(`
      INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, code, lat, lng, timezone, local_time, local_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const markReview = this.db.prepare('UPDATE reservations SET needs_review = 1 WHERE id = ?');

    let filled = 0;
    let flagged = 0;
    for (const r of pending) {
      if (!r.metadata) { markReview.run(r.id); flagged++; continue; }
      let meta: any;
      try { meta = JSON.parse(r.metadata); } catch { markReview.run(r.id); flagged++; continue; }

      const dep = meta.departure_airport ? findByIata(String(meta.departure_airport).slice(0, 3)) : null;
      const arr = meta.arrival_airport ? findByIata(String(meta.arrival_airport).slice(0, 3)) : null;

      if (!dep || !arr) { markReview.run(r.id); flagged++; continue; }

      const split = (iso: string | null) => {
        if (!iso) return { date: null as string | null, time: null as string | null };
        const [date, time] = iso.split('T');
        return { date: date || null, time: time ? time.slice(0, 5) : null };
      };
      const depParts = split(r.reservation_time);
      const arrParts = split(r.reservation_end_time);

      insert.run(r.id, 'from', 0, dep.city ? `${dep.city} (${dep.iata})` : dep.name, dep.iata, dep.lat, dep.lng, dep.tz, depParts.time, depParts.date);
      insert.run(r.id, 'to', 1, arr.city ? `${arr.city} (${arr.iata})` : arr.name, arr.iata, arr.lat, arr.lng, arr.tz, arrParts.time, arrParts.date);
      filled++;
    }

    console.log(`[airports] Backfill: ${filled} filled, ${flagged} flagged for review`);
  }
}
