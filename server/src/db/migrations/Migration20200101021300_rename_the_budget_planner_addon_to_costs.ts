import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 133 (`db/migrations.ts`).
 *
 * Rename the "Budget Planner" addon to "Costs" in the admin add-on list. This is
 * a display rename only — the addon id, tables, permissions and MCP tools all
 * stay 'budget'. Scoped to the default name so a customised one is kept.
 */
export class Migration20200101021300_rename_the_budget_planner_addon_to_costs extends Migration {
  override name = 'Migration20200101021300_rename_the_budget_planner_addon_to_costs';

  override up(): void {
    this.addSql(
      `UPDATE addons SET name = 'Costs', description = 'Track and split trip expenses' WHERE id = 'budget' AND name = 'Budget Planner'`,
    );
  }
}
