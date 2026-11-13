import { Migration } from '@mikro-orm/migrations';

export class Migration20200101046400_vacay_ics_calendars extends Migration {
  override name = 'Migration20200101046400_vacay_ics_calendars';
  override up(): void {
    this.addSql(
      "create table `vacay_ics_calendars` (`id` integer not null primary key autoincrement, `plan_id` integer not null, `url` text not null, `label` text not null, `color` text not null default '#a5f3fc', `events` text not null default '[]', `last_fetched_at` datetime null, `last_error` text null, constraint `vacay_ics_calendars_plan_id_foreign` foreign key (`plan_id`) references `vacay_plans` (`id`) on update cascade on delete cascade);",
    );
    this.addSql('create index `idx_vacay_ics_calendars_plan_id` on `vacay_ics_calendars` (`plan_id`);');
  }
}
