import { Migration } from '@mikro-orm/migrations';

/**
 * The tables whose `lng` a click on a repeated world copy could have written, and
 * the outbox that would still hand such a place on to the shared places index.
 */
const TABLES = ['places', 'reservation_endpoints', 'collection_places', 'place_contrib_outbox'] as const;

interface LngRow {
  id: number;
  lng: number;
}

/** Into [-180, 180], the same arithmetic as wrapLongitude in @trek/shared, kept here so this body never changes. */
function onTheRealWorld(lng: number): number {
  const wrapped = ((((lng + 180) % 360) + 360) % 360) - 180;
  return wrapped === 0 ? 0 : wrapped;
}

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

  override async up(): Promise<void> {
    for (const table of TABLES) {
      const rows = (await this.execute(
        `SELECT id, lng FROM ${table} WHERE lng IS NOT NULL AND (lng < -180 OR lng > 180)`,
      )) as LngRow[];
      for (const row of rows) {
        await this.execute(`UPDATE ${table} SET lng = ? WHERE id = ?`, [onTheRealWorld(row.lng), row.id]);
      }
    }
  }
}
