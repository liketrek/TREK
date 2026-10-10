import { Migration } from '@mikro-orm/migrations';

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

/** A manually-marked sub-national region carrying a possibly-stale code. */
interface VisitedRegion {
  id: number;
  region_code: string;
  region_name: string;
  country_code: string;
}

interface Admin1Feature {
  properties?: { iso_a2?: string; iso_3166_2?: string; name?: string };
}

/**
 * Curated crosswalk for regions absorbed into a *renamed* successor (the
 * name-match step cannot catch these, because the name changed). Norway's
 * 2018/2020 reforms; extend as the pinned geoBoundaries dataset gains further
 * reforms.
 */
const MERGE_CROSSWALK: Record<string, string> = {
  'NO-04': 'NO-34',
  'NO-05': 'NO-34', // Hedmark, Oppland → Innlandet
  'NO-12': 'NO-46',
  'NO-14': 'NO-46', // Hordaland, Sogn og Fjordane → Vestland
  'NO-09': 'NO-42',
  'NO-10': 'NO-42', // Aust-/Vest-Agder → Agder
  'NO-01': 'NO-30',
  'NO-02': 'NO-30',
  'NO-06': 'NO-30', // Østfold/Akershus/Buskerud → Viken
  'NO-07': 'NO-38',
  'NO-08': 'NO-38', // Vestfold, Telemark → Vestfold og Telemark
  'NO-19': 'NO-54',
  'NO-20': 'NO-54', // Troms, Finnmark → Troms og Finnmark
  'NO-16': 'NO-50',
  'NO-17': 'NO-50', // Sør-/Nord-Trøndelag → Trøndelag
};

/**
 * Legacy migration step 135 (`db/migrations.ts`).
 *
 * Atlas dropped Natural Earth for geoBoundaries. Manually-marked sub-national
 * regions (`visited_regions`) stored the OLD Natural Earth ISO-3166-2 codes;
 * some no longer match any polygon in the new bundle and would stop
 * highlighting. Reconcile every row against the ACTUAL shipped admin-1 bundle so
 * this covers *all* countries, not just one hand-listed reform:
 *   1. code still present in the new bundle      → leave it (already correct);
 *   2. else a region in the same country shares  → adopt that region's code+name
 *      the stored region_name (case-insensitive)   (handles code re-spellings,
 *                                                   e.g. ES-AN → ES_AND);
 *   3. else a curated merge crosswalk maps it    → adopt the merged region;
 *   4. else → leave as-is (cannot be resolved; the client's name fallback may
 *      still highlight it, and nothing is destroyed).
 *
 * Other Atlas tables need NO remap: `visited_countries` / `bucket_list` hold
 * only ISO-3166-1 alpha-2 codes (invariant across the swap), `bucket_list.name`
 * is free text we must not auto-rewrite, and `place_regions` is a re-derivable
 * Nominatim cache.
 */
export class Migration20200101021500_atlas_dropped_natural_earth_for_geoboundaries extends Migration {
  override name = 'Migration20200101021500_atlas_dropped_natural_earth_for_geoboundaries';

  override async up(): Promise<void> {
    const rows = (await this.execute(
      `SELECT id, region_code, region_name, country_code FROM visited_regions`,
    )) as VisitedRegion[];
    if (rows.length === 0) return; // nothing marked → skip the bundle read entirely

    // Index the shipped admin-1 bundle: valid codes, name→code per country,
    // code→name. `__dirname` resolves ../../../assets under both dist
    // (dist/db/migrations) and ts-node/vitest (src/db/migrations).
    let features: Admin1Feature[];
    try {
      const file = path.join(__dirname, '..', '..', '..', 'assets', 'atlas', 'admin1.geojson.gz');
      features = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8')).features || [];
    } catch {
      features = []; // bundle missing → degrade to the curated crosswalk below
    }

    const validCodes = new Set<string>();
    const nameToCode = new Map<string, string>(); // `${A2}|${nameLower}` → code
    const codeToName = new Map<string, string>();
    for (const f of features) {
      const a2 = (f.properties?.iso_a2 || '').toUpperCase();
      const code = f.properties?.iso_3166_2 || '';
      const name = f.properties?.name || '';
      if (!code) continue;
      validCodes.add(code);
      if (!codeToName.has(code)) codeToName.set(code, name);
      if (a2 && name) nameToCode.set(`${a2}|${name.toLowerCase()}`, code);
    }

    const resolve = (row: VisitedRegion): string | null => {
      if (validCodes.has(row.region_code)) return null; // already valid
      const a2 = (row.country_code || '').toUpperCase();
      const byName = nameToCode.get(`${a2}|${(row.region_name || '').toLowerCase()}`);
      if (byName) return byName;
      const merged = MERGE_CROSSWALK[row.region_code];
      // Only trust the crosswalk target if it actually exists in the bundle (or
      // the bundle was unreadable, in which case apply the curated map blindly).
      if (merged && (validCodes.size === 0 || validCodes.has(merged))) return merged;
      return null;
    };

    for (const row of rows) {
      const newCode = resolve(row);
      if (!newCode || newCode === row.region_code) continue;
      const newName = codeToName.get(newCode) || row.region_name;

      await this.execute(`UPDATE OR IGNORE visited_regions SET region_code = ?, region_name = ? WHERE id = ?`, [
        newCode,
        newName,
        row.id,
      ]);

      // UNIQUE(user_id, region_code): if the user already had the target code the
      // UPDATE was IGNORED and this row still carries the old code → drop the
      // duplicate.
      const after = (await this.execute(`SELECT region_code FROM visited_regions WHERE id = ?`, [row.id])) as {
        region_code: string;
      }[];
      if (after[0]?.region_code === row.region_code) {
        await this.execute(`DELETE FROM visited_regions WHERE id = ?`, [row.id]);
      }
    }
  }
}
