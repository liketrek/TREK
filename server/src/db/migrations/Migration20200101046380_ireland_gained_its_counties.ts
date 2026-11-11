import { Migration } from '@mikro-orm/migrations';

interface RegionRow {
  id: number;
  user_id: number;
  region_code: string;
  region_name: string;
}

/** The 26 counties the Atlas now ships for Ireland: ISO 3166-2:IE code, name, province. */
const COUNTIES: ReadonlyArray<readonly [code: string, name: string, province: string]> = [
  ['IE-CW', 'Carlow', 'IE-L'],
  ['IE-D', 'Dublin', 'IE-L'],
  ['IE-KE', 'Kildare', 'IE-L'],
  ['IE-KK', 'Kilkenny', 'IE-L'],
  ['IE-LS', 'Laois', 'IE-L'],
  ['IE-LD', 'Longford', 'IE-L'],
  ['IE-LH', 'Louth', 'IE-L'],
  ['IE-MH', 'Meath', 'IE-L'],
  ['IE-OY', 'Offaly', 'IE-L'],
  ['IE-WH', 'Westmeath', 'IE-L'],
  ['IE-WX', 'Wexford', 'IE-L'],
  ['IE-WW', 'Wicklow', 'IE-L'],
  ['IE-CE', 'Clare', 'IE-M'],
  ['IE-CO', 'Cork', 'IE-M'],
  ['IE-KY', 'Kerry', 'IE-M'],
  ['IE-LK', 'Limerick', 'IE-M'],
  ['IE-TA', 'Tipperary', 'IE-M'],
  ['IE-WD', 'Waterford', 'IE-M'],
  ['IE-G', 'Galway', 'IE-C'],
  ['IE-LM', 'Leitrim', 'IE-C'],
  ['IE-MO', 'Mayo', 'IE-C'],
  ['IE-RN', 'Roscommon', 'IE-C'],
  ['IE-SO', 'Sligo', 'IE-C'],
  ['IE-CN', 'Cavan', 'IE-U'],
  ['IE-DL', 'Donegal', 'IE-U'],
  ['IE-MN', 'Monaghan', 'IE-U'],
];

/** "County Dublin", "Co. Dublin" and "dublin" all name Dublin. */
const countyKey = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/^(county|co\.?)\s+/, '');

/**
 * Ireland gained its counties (#2922).
 *
 * geoBoundaries has no county layer for Ireland, so the Atlas showed the four
 * provinces (IE-C, IE-L, IE-M, IE-U) next to a UK of counties. The bundle now ships
 * Tailte Éireann's 26 counties under their ISO 3166-2:IE codes. What exists already:
 *
 * `place_regions` is a re-derivable cache full of province rows that nothing would
 * ever re-derive, so Ireland's rows are cleared and come back as counties on the next
 * Atlas load, as Great Britain's did when it gained its counties.
 *
 * `visited_regions` holds what a user marked by hand. A marked province stays as it
 * is: which of its counties the user saw is not ours to guess. A row whose name is a
 * county under another code (a Natural Earth or geocoder code from older versions)
 * takes the county's code, and is dropped where the user already holds that county.
 *
 * `hidden_regions` remembers a region the user switched off. A hidden province hid
 * every place in it, so each of its counties is hidden in its place; the province row
 * stays and keeps hiding a marked province.
 *
 * `bucket_list` is a wish, not a polygon, and is left alone.
 */
export class Migration20200101046380_ireland_gained_its_counties extends Migration {
  override name = 'Migration20200101046380_ireland_gained_its_counties';

  override async up(): Promise<void> {
    await this.execute(`DELETE FROM place_regions WHERE UPPER(COALESCE(country_code, '')) = 'IE'`);

    // Queued in order, run after the reads below: the codes come from the table
    // above and the row ids from the database, nothing a user typed.
    for (const [code, , province] of COUNTIES) {
      this.addSql(
        `INSERT INTO hidden_regions (user_id, region_code, country_code)
         SELECT h.user_id, '${code}', h.country_code FROM hidden_regions h
         WHERE h.region_code = '${province}' AND UPPER(h.country_code) = 'IE'
           AND NOT EXISTS (SELECT 1 FROM hidden_regions x WHERE x.user_id = h.user_id AND x.region_code = '${code}')`,
      );
    }

    const rows = (await this.execute(
      `SELECT id, user_id, region_code, region_name FROM visited_regions
       WHERE UPPER(COALESCE(country_code, '')) = 'IE' ORDER BY id`,
    )) as RegionRow[];
    const counties = new Map(COUNTIES.map(([code, name]) => [countyKey(name), { code, name }]));
    const countyCodes = new Set(COUNTIES.map(([code]) => code));
    const held = new Set(rows.map((r) => `${r.user_id}|${r.region_code}`));

    for (const row of rows) {
      if (countyCodes.has(row.region_code)) continue;
      const county = counties.get(countyKey(row.region_name || ''));
      if (!county) continue;
      const target = `${row.user_id}|${county.code}`;
      const id = Number(row.id);
      if (!Number.isInteger(id)) continue;
      if (held.has(target)) {
        this.addSql(`DELETE FROM visited_regions WHERE id = ${id}`);
      } else {
        this.addSql(
          `UPDATE visited_regions SET region_code = '${county.code}', region_name = '${county.name}' WHERE id = ${id}`,
        );
        held.add(target);
      }
    }
  }
}
