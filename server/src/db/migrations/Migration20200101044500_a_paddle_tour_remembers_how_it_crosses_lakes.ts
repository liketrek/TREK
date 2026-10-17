import { Migration } from '@mikro-orm/migrations';

/**
 * PAD-11: how a paddle tour crosses its lakes, as the router planned it:
 * `direct` (straight over, also what NULL means) or `shore` (along the
 * shore, for wind). Kept with the tour so it routes the same when opened again.
 */
export class Migration20200101044500_a_paddle_tour_remembers_how_it_crosses_lakes extends Migration {
  override name = 'Migration20200101044500_a_paddle_tour_remembers_how_it_crosses_lakes';

  override up(): void {
    this.addSql(
      `ALTER TABLE tours ADD COLUMN paddle_lake_style TEXT CHECK (paddle_lake_style IS NULL OR paddle_lake_style IN ('direct', 'shore'))`,
    );
  }
}
