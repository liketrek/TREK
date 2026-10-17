import { hasBaseline, resetDemoUser, saveBaseline, takeExampleTripsSeeded } from '../../demo/demo-reset';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { logInfo, logError } from '../audit/audit-log.logger';
import { DATABASE_BACKUP, type DatabaseBackupStrategy } from '../database/database-backup.interface';
import { DatabaseLifecycle } from '../database/database-lifecycle.service';
import { withRequestContext } from '../database/request-context';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { EntityManager } from '@mikro-orm/core';
import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/**
 * Demo mode: hourly reset of demo user data (moved from src/scheduler.ts).
 * Gated on DEMO_MODE at bootstrap — parity: toggling it always required a
 * restart — and scheduled in the server-local zone (the old cron.schedule call
 * passed no timezone). demo-reset is a static import: its module top is
 * side-effect-free, and the close/swap/reopen sequence runs inside
 * resetDemoUser at tick time, through the injected backup port.
 *
 * It also saves the first baseline, whenever the demo seed has just put the
 * example trips in and no baseline exists yet: the same trigger the save had
 * inside the demo seed, which runs before the container can hand the port in.
 * That seed runs at boot and again in the schema bootstrap after every reopen
 * (an admin restore, the hourly swap), so the job checks once the app is up
 * and again after each reopen, through `DatabaseLifecycle.onReopened`. Each
 * check clears the seed's mark, so none is left behind. A demo database that
 * already holds data without a baseline is left alone, so its hourly reset
 * stays a logged no-op as before. Like the old save, it does not depend on the
 * cron registrar being enabled.
 */
@Injectable()
export class DemoResetJob implements OnApplicationBootstrap {
  constructor(
    private readonly runtimeEnv: RuntimeEnvService,
    private readonly registrar: CronRegistrarService,
    @Inject(DATABASE_BACKUP) private readonly database: DatabaseBackupStrategy,
    private readonly em: EntityManager,
    private readonly lifecycle: DatabaseLifecycle,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.runtimeEnv.isDemoMode()) return;
    if (this.registrar.isEnabled()) {
      // D6: the tick runs inside a request context, via CronRegistrarService's
      // one wrapper around every onTick.
      this.registrar.register('demo-reset', '0 * * * *', () => void this.tick(), { timezone: 'none' });
      logInfo('Demo hourly reset scheduled');
    }
    this.lifecycle.onReopened(() => this.saveFirstBaselineIfSeeded());
    await this.saveFirstBaselineIfSeeded();
  }

  async tick(): Promise<void> {
    try {
      await resetDemoUser(this.database);
    } catch (err: unknown) {
      logError(`Demo reset: ${err instanceof Error ? err.message : err}`);
    }
  }

  /**
   * Saves the first baseline when the demo seed has just seeded and none exists.
   * At boot it runs outside any request, so the snapshot gets its own context. Never
   * throws: at boot a failure must not stop the app, and after a reopen it must
   * not read as the reopen failing.
   */
  private async saveFirstBaselineIfSeeded(): Promise<void> {
    if (!takeExampleTripsSeeded() || hasBaseline()) return;
    try {
      await withRequestContext({ em: this.em }, () => saveBaseline(this.database));
    } catch (err: unknown) {
      logError(`Demo baseline: ${err instanceof Error ? err.message : err}`);
    }
  }
}
