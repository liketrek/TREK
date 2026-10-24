import { Migration } from '@mikro-orm/migrations';

/**
 * MCP-T04: a step of a tour saved from a confirmed proposal (MCP-T03) can be
 * taken back once, which restores the tour as the step kept it before. The
 * step then says so: `undone_revision` is the revision taking it back raised
 * the tour to, always past the one the step saved, `undone_by` who confirmed
 * it (a plain id, as `saved_by`) and `undone_at` when. All three stay NULL
 * while the step stands. Taking a step back writes no second step and no
 * second revision: the tour's one revision counts it like any other write.
 */
export class Migration20200101045710_a_saved_tour_change_can_be_taken_back extends Migration {
  override name = 'Migration20200101045710_a_saved_tour_change_can_be_taken_back';

  override up(): void {
    this.addSql(
      'ALTER TABLE tour_change_steps ADD COLUMN undone_revision INTEGER CHECK (undone_revision IS NULL OR undone_revision > revision)',
    );
    this.addSql('ALTER TABLE tour_change_steps ADD COLUMN undone_by INTEGER');
    this.addSql('ALTER TABLE tour_change_steps ADD COLUMN undone_at DATETIME');
  }
}
