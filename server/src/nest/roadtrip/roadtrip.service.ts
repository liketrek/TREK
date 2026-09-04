import { Injectable } from '@nestjs/common';
import type { RoadtripDayTrack, RoadtripVia } from '@trek/shared';
import { DatabaseService } from '../database/database.service';

/**
 * Via points: the places a day's drive is made to pass through without stopping.
 *
 * Kept apart from `day_assignments` on purpose. A stop is somewhere you go — it takes a
 * number in the chain, an arrival time and a line in the itinerary. A via only bends the
 * route. Modelling one as a place would put a numbered stop in the middle of the day for
 * a spot nobody stops at, and it would show up in the PDF, the map pins and the schedule.
 */
@Injectable()
export class RoadtripService {
  constructor(private readonly db: DatabaseService) {}

  /** The day exists and belongs to this trip. 404 material, checked before every write. */
  dayExists(dayId: string | number, tripId: string | number): boolean {
    return !!this.db.get<{ id: number }>(
      'SELECT id FROM days WHERE id = ? AND trip_id = ?',
      dayId,
      tripId,
    );
  }

  listForDay(dayId: string | number): RoadtripVia[] {
    return this.db.all<RoadtripVia>(
      `SELECT id, day_id, after_order_index, sequence, lat, lng, created_at
         FROM roadtrip_vias
        WHERE day_id = ?
        ORDER BY after_order_index, sequence, id`,
      dayId,
    );
  }

  /** Every via of a trip, so the client can route all days without one request per day. */
  listForTrip(tripId: string | number): RoadtripVia[] {
    return this.db.all<RoadtripVia>(
      `SELECT v.id, v.day_id, v.after_order_index, v.sequence, v.lat, v.lng, v.created_at
         FROM roadtrip_vias v
         JOIN days d ON d.id = v.day_id
        WHERE d.trip_id = ?
        ORDER BY v.day_id, v.after_order_index, v.sequence, v.id`,
      tripId,
    );
  }

  create(dayId: string | number, input: { after_order_index: number; lat: number; lng: number; sequence?: number }): RoadtripVia {
    // Appended after whatever already follows that stop, unless the caller says where.
    const sequence = input.sequence ?? (
      this.db.get<{ next: number }>(
        'SELECT COALESCE(MAX(sequence) + 1, 0) AS next FROM roadtrip_vias WHERE day_id = ? AND after_order_index = ?',
        dayId,
        input.after_order_index,
      )?.next ?? 0
    );
    const result = this.db.run(
      'INSERT INTO roadtrip_vias (day_id, after_order_index, sequence, lat, lng) VALUES (?, ?, ?, ?, ?)',
      dayId,
      input.after_order_index,
      sequence,
      input.lat,
      input.lng,
    );
    return this.byId(Number(result.lastInsertRowid))!;
  }

  /**
   * Lay a chain of vias on one day in a single transaction.
   *
   * One transaction for the same reason `reanchor` uses one: a half-written chain steers
   * the drive onto a road nobody chose, along a stretch of the way and not along the rest.
   * The sequence is the position within the leg, so points arriving in order keep it.
   *
   * `replace_legs` clears by leg rather than by day, so vias the traveller placed by hand
   * on other legs survive a track being laid on this one.
   */
  createMany(
    dayId: string | number,
    input: {
      vias: { after_order_index: number; lat: number; lng: number }[];
      replace_legs?: number[];
      track?: { place_id: number; stray_km?: number | null } | null;
    },
  ): RoadtripVia[] {
    return this.db.transaction(() => {
      // Inside the same transaction as the chain it describes. A day that says it follows
      // a road whose vias never landed is worse than a day that says nothing.
      if (input.track === null) {
        this.db.run('DELETE FROM roadtrip_day_tracks WHERE day_id = ?', dayId);
      } else if (input.track) {
        this.db.run(
          `INSERT INTO roadtrip_day_tracks (day_id, place_id, stray_km) VALUES (?, ?, ?)
             ON CONFLICT(day_id) DO UPDATE SET place_id = excluded.place_id, stray_km = excluded.stray_km`,
          dayId,
          input.track.place_id,
          input.track.stray_km ?? null,
        );
      }
      for (const leg of input.replace_legs ?? []) {
        this.db.run('DELETE FROM roadtrip_vias WHERE day_id = ? AND after_order_index = ?', dayId, leg);
      }
      // Per leg, because sequence only orders the vias that follow the same stop. Read
      // once up front rather than per insert: the loop is inside the transaction, and a
      // MAX() per point over a hundred points is a hundred scans of the same rows.
      const nextSeq = new Map<number, number>();
      for (const via of input.vias) {
        let seq = nextSeq.get(via.after_order_index);
        if (seq === undefined) {
          seq = this.db.get<{ next: number }>(
            'SELECT COALESCE(MAX(sequence) + 1, 0) AS next FROM roadtrip_vias WHERE day_id = ? AND after_order_index = ?',
            dayId,
            via.after_order_index,
          )?.next ?? 0;
        }
        this.db.run(
          'INSERT INTO roadtrip_vias (day_id, after_order_index, sequence, lat, lng) VALUES (?, ?, ?, ?, ?)',
          dayId,
          via.after_order_index,
          seq,
          via.lat,
          via.lng,
        );
        nextSeq.set(via.after_order_index, seq + 1);
      }
      return this.listForDay(dayId);
    });
  }

  /**
   * The tracks this trip's days follow.
   *
   * Read with the vias in one go: both are wanted on every load of road-trip mode, and a
   * second route for a handful of rows would be a second round trip for nothing.
   */
  tracksForTrip(tripId: string | number): RoadtripDayTrack[] {
    return this.db.all<RoadtripDayTrack>(
      `SELECT t.day_id, t.place_id, t.stray_km
         FROM roadtrip_day_tracks t
         JOIN days d ON d.id = t.day_id
        WHERE d.trip_id = ?
        ORDER BY t.day_id`,
      tripId,
    );
  }

  /** Whether a place is on this trip, and is a track rather than an ordinary place. */
  trackExists(placeId: number, tripId: string | number): boolean {
    return !!this.db.get<{ id: number }>(
      "SELECT id FROM places WHERE id = ? AND trip_id = ? AND route_geometry IS NOT NULL AND route_geometry != ''",
      placeId,
      tripId,
    );
  }

  /** Moving a via is the whole edit; where it sits in the chain does not change. */
  move(id: string | number, dayId: string | number, lat: number, lng: number): RoadtripVia | null {
    const existing = this.db.get<{ id: number }>(
      'SELECT id FROM roadtrip_vias WHERE id = ? AND day_id = ?',
      id,
      dayId,
    );
    if (!existing) return null;
    this.db.run('UPDATE roadtrip_vias SET lat = ?, lng = ? WHERE id = ?', lat, lng, id);
    return this.byId(Number(id));
  }

  /**
   * Re-pin a day's vias in one go, after its stops changed shape.
   *
   * One transaction, because the numbers only mean anything as a set: applying half of a
   * shift leaves two vias claiming the same leg and a third pinned past the end of the
   * day. `AND day_id = ?` on every statement is what stops an id from another day — or
   * another trip — being renumbered through a day the caller does happen to reach.
   *
   * Silent about ids it does not find. The caller computed this list from a snapshot of
   * the day, and a via somebody else deleted in the meantime is not a failure of the
   * re-anchoring; failing the batch over it would leave the rest of the day mis-pinned.
   */
  reanchor(
    dayId: string | number,
    input: { vias: { id: number; after_order_index: number }[]; remove?: number[] },
  ): RoadtripVia[] {
    return this.db.transaction(() => {
      for (const id of input.remove ?? []) {
        this.db.run('DELETE FROM roadtrip_vias WHERE id = ? AND day_id = ?', id, dayId);
      }
      for (const via of input.vias) {
        this.db.run(
          'UPDATE roadtrip_vias SET after_order_index = ? WHERE id = ? AND day_id = ?',
          via.after_order_index,
          via.id,
          dayId,
        );
      }
      return this.listForDay(dayId);
    });
  }

  remove(id: string | number, dayId: string | number): boolean {
    const result = this.db.run('DELETE FROM roadtrip_vias WHERE id = ? AND day_id = ?', id, dayId);
    return result.changes > 0;
  }

  private byId(id: number): RoadtripVia | null {
    return this.db.get<RoadtripVia>(
      'SELECT id, day_id, after_order_index, sequence, lat, lng, created_at FROM roadtrip_vias WHERE id = ?',
      id,
    ) ?? null;
  }
}
