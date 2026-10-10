import { AppConfigModule } from '../app-config/app-config.module';
import { CronRegistrarService } from './cron-registrar.service';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

/**
 * Shared cron infrastructure — deliberately NOT @Global. The e2e suites boot
 * partial module graphs (DatabaseModule + one domain module), where a global
 * module absent from the compiled tree resolves nothing: every module that
 * owns a job imports SchedulingModule explicitly, so its TestingModule keeps
 * compiling. ScheduleModule.forRoot() lives here (not app.module.ts) for the
 * same reason, and AppConfigModule is imported so RuntimeEnvService resolves
 * in those partial graphs too.
 *
 * No @Cron decorators exist anywhere in the tree — jobs go through
 * CronRegistrarService so the test gate and shutdown semantics apply. Keep it
 * that way: a decorator-declared job would be mounted by the schedule
 * explorer on every harness boot, gate or no gate.
 */
@Module({
  imports: [ScheduleModule.forRoot(), AppConfigModule],
  providers: [CronRegistrarService],
  exports: [CronRegistrarService],
})
export class SchedulingModule {}
