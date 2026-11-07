import { Migration } from '@mikro-orm/migrations';

/**
 * The tables whose `lng` a click on a repeated world copy could have written, and
 * the outbox that would still hand such a place on to the shared places index.
 */
const TABLES = ['places', 'reservation_endpoints', 'collection_places', 'place_contrib_outbox'] as const;

/**
 * How many whole worlds `lng` lies east of the real one: floor((lng + 180) / 360),
 * spelled with CAST, which truncates towards zero, because SQLite has no floor()
 * without its math extension.
 */
const WORLDS = '(CAST((lng + 180) / 360.0 AS INTEGER) - ((lng + 180) / 360.0 < CAST((lng + 180) / 360.0 AS INTEGER)))';

/**
 * Brings every stored longitude back onto the real world.
 *
 * The map repeats the world sideways, and a right-click or a drag on one of the
 * copies reported its longitude as it is on that copy: 274.9 instead of -85.1.
 * Saved like that, a place sat on its copy for good, out of reach of the
 * geocoder, and a day route to it ran across the whole map (#2976). New writes
 * are wrapped on the way in; this moves the ones already stored to the same
 * point on the real world. Only rows outside [-180, 180] are touched.
 */
export class Migration20200101046350_a_place_lies_on_the_real_world extends Migration {
  override name = 'Migration20200101046350_a_place_lies_on_the_real_world';

  override up(): void {
    for (const table of TABLES) {
      this.addSql(`UPDATE ${table} SET lng = lng - 360 * ${WORLDS} WHERE lng < -180 OR lng > 180`);
    }
  }
}
