import { columnNames } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 71 (`db/migrations.ts`).
 *
 * Remove the stored config column from photo_providers now that it is generated
 * from the provider id.
 */
export class Migration20200101011100_step_071 extends Migration {
  override name = 'Migration20200101011100_step_071';

  override async up(): Promise<void> {
    const names = await columnNames(this, 'photo_providers');
    if (!names.has('config')) return;
    await this.execute(`ALTER TABLE photo_providers DROP COLUMN config`);
  }
}
