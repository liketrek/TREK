import { Migration } from '@mikro-orm/migrations';

/**
 * AI travel plans (China MVP), phase 1: the plan row and its immutable draft
 * revisions.
 *
 * `ai_travel_plans` holds what the traveller asked for (`request_json`), the
 * lifecycle status, the revision the plan currently points at, the optional
 * trip an apply writes into (`target_trip_id`) and the trip an apply created
 * (`applied_trip_id`). Nothing is written to a trip before an explicit apply,
 * so both trip columns stay null until then.
 *
 * `ai_travel_plan_revisions` keeps every draft the planner produced, versioned
 * from 1. A revision row is never updated; a new draft is a new row. The
 * unique (plan_id, version) pair is what refuses two concurrent revisions
 * landing on the same version.
 *
 * Deleting a user takes their plans; deleting a trip keeps the plan row (the
 * audit pointer) and nulls the column.
 */
export class Migration20200101046390_ai_travel_plans_reserve_the_contract extends Migration {
  override name = 'Migration20200101046390_ai_travel_plans_reserve_the_contract';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS ai_travel_plans (
        id INTEGER PRIMARY KEY,
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        request_json TEXT NOT NULL,
        current_revision INTEGER NOT NULL DEFAULT 0,
        target_trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
        applied_trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
        expires_at DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_ai_travel_plans_owner ON ai_travel_plans(owner_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_ai_travel_plans_target_trip ON ai_travel_plans(target_trip_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_ai_travel_plans_applied_trip ON ai_travel_plans(applied_trip_id)');
    this.addSql(`
      CREATE TABLE IF NOT EXISTS ai_travel_plan_revisions (
        id INTEGER PRIMARY KEY,
        plan_id INTEGER NOT NULL REFERENCES ai_travel_plans(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        reason TEXT,
        draft_json TEXT NOT NULL,
        facts_json TEXT NOT NULL,
        warnings_json TEXT NOT NULL,
        model_meta_json TEXT NOT NULL,
        duration_ms INTEGER,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(plan_id, version)
      )
    `);
  }
}
