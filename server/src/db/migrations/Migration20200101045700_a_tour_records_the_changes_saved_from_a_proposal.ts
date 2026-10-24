import { Migration } from '@mikro-orm/migrations';

/**
 * MCP-T03: a change to a saved tour the traveller confirmed through an
 * assistant is kept as one step of the tour, so it can be followed and taken
 * back later (MCP-T04). A step names the proposal it saved (`proposal_id`),
 * the revision the tour was at when it was prepared (`base_revision`) and the
 * one the save raised it to (`revision`, always the next), the changes as
 * confirmed (JSON) and the tour as it was before them (`before_state`, JSON:
 * its line, its points and the measures the save replaced). Nothing of the
 * conversation is kept, only the plan. `saved_by` names who confirmed it,
 * kept as a plain id: a step outlives its author, who then reads as unknown.
 * One step per revision of a tour, and the steps go with their tour.
 */
export class Migration20200101045700_a_tour_records_the_changes_saved_from_a_proposal extends Migration {
  override name = 'Migration20200101045700_a_tour_records_the_changes_saved_from_a_proposal';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS tour_change_steps (
        id INTEGER PRIMARY KEY,
        place_id INTEGER NOT NULL REFERENCES tours(place_id) ON DELETE CASCADE,
        proposal_id TEXT NOT NULL,
        base_revision INTEGER NOT NULL CHECK (base_revision >= 1),
        revision INTEGER NOT NULL CHECK (revision = base_revision + 1),
        changes TEXT NOT NULL,
        before_state TEXT NOT NULL,
        saved_by INTEGER,
        saved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (place_id, revision)
      )
    `);
  }
}
