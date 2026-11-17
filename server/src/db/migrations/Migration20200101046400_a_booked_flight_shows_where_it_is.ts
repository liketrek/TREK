import { Migration } from '@mikro-orm/migrations';

/**
 * Live flight status: what the open ADS-B feeds last said about one flight on
 * one day, keyed by the callsign it transmits, its local departure date and
 * its two airports. A through flight keeps one flight number over two sectors
 * (FRA to BOM to SIN as LH 754 on one day), and each sector has a state of its own.
 * One row serves every trip that booked the same flight, so the feeds are asked
 * once per flight, not once per traveller. Next to the derived state sit the
 * poll's bookkeeping (when to ask next, how often it failed) and whether each
 * notification already went out, so a departure is announced once.
 *
 * No foreign key: the row describes a flight in the air, not a booking, and is
 * found again from the bookings by its key.
 */
export class Migration20200101046400_a_booked_flight_shows_where_it_is extends Migration {
  override name = 'Migration20200101046400_a_booked_flight_shows_where_it_is';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS flight_live_states (
        callsign TEXT NOT NULL,
        service_date TEXT NOT NULL,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        phase TEXT NOT NULL DEFAULT 'scheduled',
        departed_at DATETIME,
        landed_at DATETIME,
        lat REAL,
        lng REAL,
        altitude_ft REAL,
        ground_speed_kt REAL,
        track_deg REAL,
        vertical_rate_fpm REAL,
        on_ground INTEGER,
        registration TEXT,
        aircraft_type TEXT,
        source TEXT,
        first_seen_at DATETIME,
        last_seen_at DATETIME,
        fetched_at DATETIME,
        next_poll_at DATETIME,
        fail_count INTEGER NOT NULL DEFAULT 0,
        departed_notified INTEGER NOT NULL DEFAULT 0,
        landed_notified INTEGER NOT NULL DEFAULT 0,
        delay_notified INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (callsign, service_date, origin, destination)
      )
    `);
  }
}
