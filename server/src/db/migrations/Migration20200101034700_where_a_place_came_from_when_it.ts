import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 227 (`db/migrations.ts`).
 *
 * Where a place came from, when it did not come from a person typing it
 * (#2279). Only 'dawarich' writes it today; NULL is every place anyone has
 * ever added by hand, which is what it should stay.
 * A column rather than a lookup through dawarich_visit_suggestions: the mark
 * has to survive the suggestion being deleted, and a place list would
 * otherwise join an integration's table to render a name.
 */
export class Migration20200101034700_where_a_place_came_from_when_it extends Migration {
  override name = 'Migration20200101034700_where_a_place_came_from_when_it';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'places', 'source', `source TEXT`);
  }
}
