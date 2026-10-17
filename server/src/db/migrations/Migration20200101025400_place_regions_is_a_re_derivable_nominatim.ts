import { execUnlessTableMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 174 (`db/migrations.ts`).
 *
 * `place_regions` is a re-derivable Nominatim cache, only ever populated for a
 * place ID that isn't already cached — so a wrong row, once written, was
 * permanent. Region resolution now resolves a place's lat/lng directly against
 * the bundled admin1 polygons (the same ones the client renders) instead of
 * trusting Nominatim's address level, which could name a subdivision level the
 * bundle doesn't carry (Barcelona's ES-B province vs the bundle's ES-CT
 * autonomous community) and never highlight. That fix only helps places
 * re-resolved after it, so clear the cache once and let every place re-resolve
 * on the next Atlas load. The country_code stored alongside is cleared too,
 * which also drops the old wrong-country rows a US-state-abbreviation address
 * used to produce.
 */
export class Migration20200101025400_place_regions_is_a_re_derivable_nominatim extends Migration {
  override name = 'Migration20200101025400_place_regions_is_a_re_derivable_nominatim';

  override async up(): Promise<void> {
    // place_regions is created by an earlier migration; tolerate its absence on
    // an unusual partial DB rather than aborting startup.
    await execUnlessTableMissing(this, `DELETE FROM place_regions`);
  }
}
