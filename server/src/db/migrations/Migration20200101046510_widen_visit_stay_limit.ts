import { forEngine } from '../dialect/ddl';
import { engineDdl } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

export class Migration20200101046510_widen_visit_stay_limit extends Migration {
  override async up(): Promise<void> {
    engineDdl(this, {
      sqlite: [
        'ALTER TABLE day_assignments ADD COLUMN upgraded_stay_minutes INTEGER CHECK(upgraded_stay_minutes BETWEEN 0 AND 10080)',
      ],
      // sqlite-only: Postgres never held the fork's old stay constraint.
      postgres: [],
    });
    const copyStayMinutes = forEngine(this.getEntityManager().getPlatform(), {
      sqlite: 'UPDATE day_assignments SET upgraded_stay_minutes = stay_minutes',
      postgres: null,
    });
    if (copyStayMinutes) this.addSql(copyStayMinutes);
    engineDdl(this, {
      sqlite: [
        'ALTER TABLE day_assignments DROP COLUMN stay_minutes',
        'ALTER TABLE day_assignments RENAME COLUMN upgraded_stay_minutes TO stay_minutes',
      ],
      // sqlite-only: Postgres never held the fork's old stay constraint.
      postgres: [],
    });
  }
}
