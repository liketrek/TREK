import { Migration } from '@mikro-orm/migrations';

export class Migration20200101046410_vacay_ics_holidays_enabled extends Migration {
  override name = 'Migration20200101046410_vacay_ics_holidays_enabled';
  override up(): void {
    this.addSql('alter table `vacay_plans` add column `ics_holidays_enabled` integer not null default 1;');
  }
}
