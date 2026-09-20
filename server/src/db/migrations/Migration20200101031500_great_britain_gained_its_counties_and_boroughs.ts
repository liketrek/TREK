import { Migration } from '@mikro-orm/migrations';

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

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
 * Legacy migration step 195 (`db/migrations.ts`).
 *
 * Great Britain gained its counties and boroughs back (#1974).
 *
 * geoBoundaries' GBR ADM1 is the four constituent countries, so since 3.1.0 the
 * atlas had no polygon below "England" and a London borough marked as visited
 * had nothing to light up. The bundle now ships GB at ADM2, which is the
 * granularity the rest of the world gets and the granularity the pre-3.1.0
 * Natural Earth layer had.
 *
 * Two things need saying to the data that already exists:
 *
 * `visited_regions` rows marked before 3.1.0 hold the old Natural Earth borough
 * codes. They are reconciled by name within the same country, exactly as the
 * 3.1.1 step does for every other country — a row that still cannot be resolved
 * is left alone rather than destroyed, and the client's name fallback may well
 * still highlight it.
 *
 * `place_regions` is a re-derivable cache, and it is full of GB-ENG rows that
 * were correct under the old bundle. Nothing re-derives a row that is already
 * there, so without clearing them every English place would keep reporting
 * "England" forever.
 */
export class Migration20200101031500_great_britain_gained_its_counties_and_boroughs extends Migration {
  override name = 'Migration20200101031500_great_britain_gained_its_counties_and_boroughs';

  override async up(): Promise<void> {
    await this.execute(`DELETE FROM place_regions WHERE UPPER(COALESCE(country_code, '')) = 'GB'`);

    const rows = (await this.execute(
      `SELECT id, region_code, region_name, country_code FROM visited_regions WHERE UPPER(COALESCE(country_code, '')) = 'GB'`,
    )) as VisitedRegion[];
    if (rows.length === 0) return;

    let features: Admin1Feature[];
    try {
      const file = path.join(__dirname, '..', '..', '..', 'assets', 'atlas', 'admin1.geojson.gz');
      features = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8')).features || [];
    } catch {
      return; // bundle unreadable — leave the rows untouched rather than guessing
    }

    const validCodes = new Set<string>();
    const nameToCode = new Map<string, string>();
    for (const f of features) {
      const p = f.properties || {};
      if ((p.iso_a2 || '').toUpperCase() !== 'GB' || !p.iso_3166_2) continue;
      validCodes.add(p.iso_3166_2);
      if (p.name) nameToCode.set(p.name.toLowerCase(), p.iso_3166_2);
    }
    if (validCodes.size === 0) return;

    for (const row of rows) {
      if (validCodes.has(row.region_code)) continue;
      const byName = nameToCode.get((row.region_name || '').toLowerCase());
      if (byName) {
        await this.execute(`UPDATE OR IGNORE visited_regions SET region_code = ? WHERE id = ?`, [byName, row.id]);
      }
    }
  }
}
