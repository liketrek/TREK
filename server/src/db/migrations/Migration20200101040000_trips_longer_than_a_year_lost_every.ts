import { Migration } from '@mikro-orm/migrations';

/** A trip whose day rows were clipped at the old 365-day limit. */
interface ClippedTrip {
  id: number;
  start_date: string;
  end_date: string;
  span: number;
}

/** The date `n` days after `start`, as YYYY-MM-DD. */
function dayAfter(start: string, n: number): string {
  const [y, m, d] = start.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * 86400000).toISOString().slice(0, 10);
}

/**
 * Legacy migration step 240 (`db/migrations.ts`).
 *
 * Trips longer than a year lost every day past the 365th: generateDays clipped
 * the day rows at the old limit while the trip kept its full end date, so the
 * last days had a date but nothing to plan on (#2403). The limit is 999 now, and
 * this gives the affected trips their missing days.
 *
 * Only a range whose dated days still run unbroken from the start date is
 * extended; a trip that was re-dated by hand or lost a day in the middle is left
 * as it is. Dateless days that still hold content stay behind the dated ones,
 * where generateDays keeps them. The two-phase renumbering is the same dance
 * generateDays does around UNIQUE(trip_id, day_number).
 */
export class Migration20200101040000_trips_longer_than_a_year_lost_every extends Migration {
  override name = 'Migration20200101040000_trips_longer_than_a_year_lost_every';

  override async up(): Promise<void> {
    const trips = (await this.execute(`
      SELECT id, start_date, end_date,
        CAST(julianday(end_date) - julianday(start_date) + 1 AS INTEGER) AS span
      FROM trips
      WHERE start_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
        AND end_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
        AND julianday(end_date) - julianday(start_date) + 1 BETWEEN 366 AND 999
    `)) as ClippedTrip[];

    for (const trip of trips) {
      const rows = (await this.execute(`SELECT id, date FROM days WHERE trip_id = ? ORDER BY day_number`, [
        trip.id,
      ])) as { id: number; date: string | null }[];

      const dated = rows.filter((r) => r.date);
      if (dated.length >= trip.span) continue;
      if (dated.some((r, i) => r.date !== dayAfter(trip.start_date, i))) continue;
      const dateless = rows.filter((r) => !r.date);

      // Phase one: park every row on a negative number so the renumbering below
      // cannot collide with UNIQUE(trip_id, day_number).
      for (const [i, r] of rows.entries()) {
        await this.execute(`UPDATE days SET day_number = ? WHERE id = ?`, [-(i + 1), r.id]);
      }
      for (const [i, r] of dated.entries()) {
        await this.execute(`UPDATE days SET day_number = ? WHERE id = ?`, [i + 1, r.id]);
      }
      for (let i = dated.length; i < trip.span; i++) {
        await this.execute(`INSERT INTO days (trip_id, day_number, date) VALUES (?, ?, ?)`, [
          trip.id,
          i + 1,
          dayAfter(trip.start_date, i),
        ]);
      }
      for (const [i, r] of dateless.entries()) {
        await this.execute(`UPDATE days SET day_number = ? WHERE id = ?`, [trip.span + i + 1, r.id]);
      }
    }
  }
}
