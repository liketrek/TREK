import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 173 (`db/migrations.ts`).
 *
 * The semver RANGE of TREK versions a plugin declares it supports (its manifest's
 * `trek`, e.g. ">=3.2.0 <4.0.0"). The existing `min_trek_version` only carries the
 * lower bound, so it cannot express "stops working at 4.0" — which is precisely the
 * case the activation gate has to catch after a TREK upgrade. Kept nullable: a plugin
 * installed before this column existed has no range recorded, and the gate refuses to
 * activate it rather than guessing (see TREK_VERSION_UNKNOWN).
 */
export class Migration20200101025300_the_semver_range_of_trek_versions_a extends Migration {
  override name = 'Migration20200101025300_the_semver_range_of_trek_versions_a';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'plugins', 'trek_range', `trek_range TEXT`);
  }
}
