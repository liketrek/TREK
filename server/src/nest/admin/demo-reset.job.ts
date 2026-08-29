import { resetDemoUser } from '../../demo/demo-reset';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { logInfo, logError } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/**
 * Demo mode: hourly reset of demo user data (moved from src/scheduler.ts).
 * Gated on DEMO_MODE at bootstrap — parity: toggling it always required a
 * restart — and scheduled in the server-local zone (the old cron.schedule call
 * passed no timezone). demo-reset is a static import: its module top is
 * side-effect-free, and the dangerous closeDb/reinitialize sequence stays
 * inside resetDemoUser, called at tick time.
 */
@Injectable()
export class DemoResetJob implements OnApplicationBootstrap {
  constructor(
    private readonly runtimeEnv: RuntimeEnvService,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled() || !this.runtimeEnv.isDemoMode()) return;
    this.registrar.register('demo-reset', '0 * * * *', () => this.tick(), { timezone: 'none' });
    logInfo('Demo hourly reset scheduled');
  }

  tick(): void {
    try {
      resetDemoUser();
    } catch (err: unknown) {
      logError(`Demo reset: ${err instanceof Error ? err.message : err}`);
    }
  }
}
