import { columnRef, maxOf } from '../dialect/sql-functions';
import type { RoadtripVias } from '../entities/RoadtripVias.entity';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';
import type { RoadtripVia } from '@trek/shared';
import type { AnchoredVia } from '@trek/shared/roadtrip';

const _roadtripViaRowKeys: AssertRowKeys<RoadtripVia, RoadtripVias> = true;

/** RT18/AC13 — the OLD anchor a re-anchor reads before any write. */
export interface RoadtripViaAnchorRow {
  id: number;
  after_order_index: number;
  sequence: number;
}

/** RT21 — the same day's vias without `sequence` (the renumber pass reads it separately). */
export interface RoadtripViaLegRow {
  id: number;
  after_order_index: number;
}

/**
 * `roadtrip_vias` — the points a day's drive is routed through without stopping.
 *
 * `RT2` (`listForDay`) is the ONE copy of that projection: `AccommodationsService`
 * (AC16, Task 3) and `AssignmentsService` (AS23, `listDayVias`) both call it now,
 * retiring the "deliberate duplicate" the legacy `AssignmentsService` docstring
 * used to carry.
 */
export class RoadtripViasRepository extends TrekRepository<RoadtripVias> {
  /** RT2/AC16/AS23 — `SELECT id, day_id, after_order_index, sequence, lat, lng, created_at FROM roadtrip_vias WHERE day_id = ? ORDER BY after_order_index, sequence, id`. */
  async listForDay(day_id: number): Promise<RoadtripVia[]> {
    const vias = await this.find(
      { day: day_id },
      { orderBy: { after_order_index: 'asc', sequence: 'asc', id: 'asc' } },
    );
    return vias.map((v) => toRow(v) as RoadtripVia);
  }

  /**
   * RT3 — `SELECT v.id, v.day_id, v.after_order_index, v.sequence, v.lat, v.lng,
   * v.created_at FROM roadtrip_vias v JOIN days d ON d.id = v.day_id WHERE
   * d.trip_id = ? ORDER BY v.day_id, v.after_order_index, v.sequence, v.id`.
   *
   * Ordered by `d.id` rather than the joined table's own `v.day_id` (always the
   * same value, by the join condition): `v.day_id` is a `persist(false)` mirror
   * of the `day` relation and selecting or ordering by it directly, alongside an
   * active join on that same relation, is the exact trap `PlaceRatingsRepository
   * .listForPlaces`'s docstring documents (the column silently aliases off the
   * JOINED entity instead) — `columnRef` below sidesteps it for the SELECT list
   * the same way `AssignmentWithPlaceRow`'s `category_id` does; ordering by
   * `d.id` sidesteps it for the ORDER BY without needing a third mechanism.
   */
  async listForTrip(trip_id: number): Promise<RoadtripVia[]> {
    const platform = this.getEntityManager().getPlatform();
    return await this.qb('v')
      .join('v.day', 'd')
      .select([
        'v.id',
        columnRef(platform, 'v.day_id'),
        'v.after_order_index',
        'v.sequence',
        'v.lat',
        'v.lng',
        'v.created_at',
      ])
      .where({ 'd.trip': trip_id })
      .orderBy({ 'd.id': 'asc', 'v.after_order_index': 'asc', 'v.sequence': 'asc', 'v.id': 'asc' })
      .execute<RoadtripVia[]>('all', false);
  }

  /**
   * RT4/RT10 — `SELECT COALESCE(MAX(sequence) + 1, 0) AS next FROM
   * roadtrip_vias WHERE day_id = ? AND after_order_index = ?`, read as a plain
   * `MAX()` (`maxOf`) folded to the same result in JS: no rows (or an
   * all-`NULL` `sequence`, impossible here since the column is `NOT NULL
   * DEFAULT 0`) reads back `null`, and `(null ?? -1) + 1 === 0`, matching
   * `COALESCE(MAX(sequence) + 1, 0)`'s own null branch; a real max `m` reads
   * back `m`, and `(m ?? -1) + 1 === m + 1`, matching `MAX(sequence) + 1`.
   */
  async nextSequence(day_id: number, after_order_index: number): Promise<number> {
    const platform = this.getEntityManager().getPlatform();
    const row = await this.qb('v')
      .select([maxOf(platform, 'v.sequence', 'max_seq')])
      .where({ day: day_id, after_order_index })
      .execute<{ max_seq: number | null } | undefined>('get', false);
    return (row?.max_seq ?? -1) + 1;
  }

  /** RT5/RT11/TP43 — `INSERT INTO roadtrip_vias (day_id, after_order_index, sequence, lat, lng) VALUES (?×5)`, returning the new id. */
  async insertVia(input: {
    day_id: number;
    after_order_index: number;
    sequence: number;
    lat: number;
    lng: number;
  }): Promise<number> {
    return await this.insert({
      day: input.day_id,
      after_order_index: input.after_order_index,
      sequence: input.sequence,
      lat: input.lat,
      lng: input.lng,
    });
  }

  /** RT9 — `DELETE FROM roadtrip_vias WHERE day_id = ? AND after_order_index = ?` (one leg's own vias, `replace_legs`). */
  async deleteLeg(day_id: number, after_order_index: number): Promise<void> {
    await this.nativeDelete({ day: day_id, after_order_index });
  }

  /** RT14 — `SELECT id FROM roadtrip_vias WHERE id = ? AND day_id = ?`, the scoping check `move`'s two un-transacted UPDATEs (R7) rely on. */
  async existsInDay(id: number, day_id: number): Promise<boolean> {
    const row = await this.qb('v')
      .select(['v.id'])
      .where({ id, day: day_id })
      .execute<{ id: number } | undefined>('get', false);
    return !!row;
  }

  /**
   * RT15 — `UPDATE roadtrip_vias SET lat = ?, lng = ? WHERE id = ?`. No
   * `day_id` scoping, matching the legacy statement exactly (R7 — an
   * un-transacted check-then-act behind {@link existsInDay}; flagged, not
   * fixed).
   */
  async moveCoordinates(id: number, lat: number, lng: number): Promise<void> {
    await this.nativeUpdate({ id }, { lat, lng });
  }

  /** RT16 — `UPDATE roadtrip_vias SET lat = ?, lng = ?, after_order_index = ? WHERE id = ?`. Same R7 scoping note as {@link moveCoordinates}. */
  async moveCoordinatesAndAnchor(id: number, lat: number, lng: number, after_order_index: number): Promise<void> {
    await this.nativeUpdate({ id }, { lat, lng, after_order_index });
  }

  /** RT18/AC13 — `SELECT id, after_order_index, sequence FROM roadtrip_vias WHERE day_id = ?` (no ORDER BY — matches the legacy statement). */
  async listAnchors(day_id: number): Promise<RoadtripViaAnchorRow[]> {
    return await this.qb('v')
      .select(['v.id', 'v.after_order_index', 'v.sequence'])
      .where({ day: day_id })
      .execute<RoadtripViaAnchorRow[]>('all', false);
  }

  /** RT21 — `SELECT id, after_order_index FROM roadtrip_vias WHERE day_id = ?` (no ORDER BY — the caller's own JS sort is total, §18's RT21 note). */
  async listLegs(day_id: number): Promise<RoadtripViaLegRow[]> {
    return await this.qb('v')
      .select(['v.id', 'v.after_order_index'])
      .where({ day: day_id })
      .execute<RoadtripViaLegRow[]>('all', false);
  }

  /** RT19/AS21 — `DELETE FROM roadtrip_vias WHERE id = ? AND day_id = ?`, silent on a miss (`reanchor`'s per-id remove). */
  async deleteInDay(id: number, day_id: number): Promise<void> {
    await this.nativeDelete({ id, day: day_id });
  }

  /** RT23 — the same statement as {@link deleteInDay}, but the caller (`remove`) needs the row count to answer 404 on a miss. */
  async deleteInDayCounted(id: number, day_id: number): Promise<number> {
    return await this.nativeDelete({ id, day: day_id });
  }

  /** RT20/AC15/AS22 — `UPDATE roadtrip_vias SET after_order_index = ? WHERE id = ? AND day_id = ?`, silent on a miss. */
  async setAnchor(id: number, day_id: number, after_order_index: number): Promise<void> {
    await this.nativeUpdate({ id, day: day_id }, { after_order_index });
  }

  /** RT22 — `UPDATE roadtrip_vias SET sequence = ? WHERE id = ? AND day_id = ?`, every row unconditionally (unlike AC17). */
  async setSequence(id: number, day_id: number, sequence: number): Promise<void> {
    await this.nativeUpdate({ id, day: day_id }, { sequence });
  }

  /** RT24 — `SELECT id, day_id, after_order_index, sequence, lat, lng, created_at FROM roadtrip_vias WHERE id = ?`. */
  async findById(id: number): Promise<RoadtripVia | null> {
    const via = await this.findOne({ id });
    return via ? (toRow(via) as RoadtripVia) : null;
  }

  /**
   * AS20 (`AssignmentsService.reanchorVias`) — `SELECT id, after_order_index,
   * lat, lng FROM roadtrip_vias WHERE day_id = ?`, the `AnchoredVia` shape
   * `reanchorByStopOrder` (`@trek/shared/roadtrip`) reads — a different
   * projection from {@link listAnchors} (which carries `sequence`, not
   * `lat`/`lng`), so it stays its own method rather than reusing one.
   */
  async listForReanchor(day_id: number): Promise<AnchoredVia[]> {
    return await this.qb('v')
      .select(['v.id', 'v.after_order_index', 'v.lat', 'v.lng'])
      .where({ day: day_id })
      .execute<AnchoredVia[]>('all', false);
  }
}
