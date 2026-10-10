import { Migration } from '@mikro-orm/migrations';

const OLD_MATCH = `(region_code = 'CN-GUANGZHOUPROVINCE' OR region_name = 'Guangzhou Province')`;

/**
 * Legacy migration step 210 (`db/migrations.ts`).
 *
 * Rename the misnamed Guangdong Province (shipped as "Guangzhou Province").
 *
 * geoBoundaries labelled the whole province with the name of its capital, so
 * every row a user collected under it carries the wrong code. All three tables
 * that key on a region are moved over: the two per-user ones with an
 * `UPDATE OR IGNORE` plus a `DELETE`, because a user who already holds the
 * correct region would otherwise hit the unique index and keep a duplicate, and
 * `place_regions` with a plain UPDATE, because place_id is its primary key and
 * nothing there can collide.
 */
export class Migration20200101033000_rename_the_misnamed_guangdong_province extends Migration {
  override name = 'Migration20200101033000_rename_the_misnamed_guangdong_province';

  override up(): void {
    this.addSql(`
      UPDATE OR IGNORE visited_regions
      SET region_code = 'CN-GUANGDONGPROVINCE', region_name = 'Guangdong Province'
      WHERE UPPER(country_code) = 'CN' AND ${OLD_MATCH}
    `);
    this.addSql(`DELETE FROM visited_regions WHERE UPPER(country_code) = 'CN' AND ${OLD_MATCH}`);

    this.addSql(`
      UPDATE OR IGNORE place_regions
      SET region_code = 'CN-GUANGDONGPROVINCE', region_name = 'Guangdong Province'
      WHERE UPPER(country_code) = 'CN' AND ${OLD_MATCH}
    `);

    // hidden_regions is the other direction: it remembers which derived region a
    // user switched off. Left behind, the tombstone stops matching and the region
    // a user deliberately hid comes back.
    this.addSql(`
      UPDATE OR IGNORE hidden_regions
      SET region_code = 'CN-GUANGDONGPROVINCE'
      WHERE UPPER(country_code) = 'CN' AND region_code = 'CN-GUANGZHOUPROVINCE'
    `);
    this.addSql(`DELETE FROM hidden_regions WHERE UPPER(country_code) = 'CN' AND region_code = 'CN-GUANGZHOUPROVINCE'`);
  }
}
