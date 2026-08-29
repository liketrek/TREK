import { readEnv } from '../../app-config';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

import { CronJob } from 'cron';

/**
 * The one way TREK code schedules a cron. Job providers register here from
 * their onApplicationBootstrap instead of touching cron/@nestjs/schedule
 * directly, because this is where two process-wide invariants live:
 *
 *  - Tests never tick. buildApp() is shared with the integration/e2e harness,
 *    so onApplicationBootstrap runs on every suite boot; register() refuses to
 *    schedule when NODE_ENV is 'test' (readEnv().app.isTest, read at register
 *    time — tests/setup.ts pins NODE_ENV='test' before any app boots).
 *    Providers gate their boot sweeps and banner logs behind isEnabled() for
 *    the same reason.
 *  - Shutdown stops everything. @nestjs/schedule v6's orchestrator deletes
 *    every registry cron job in beforeApplicationShutdown; this service keeps
 *    its own onApplicationShutdown pass anyway (tolerant of jobs already
 *    removed) so a library that stops covering registry-added jobs — v5 did
 *    not — can never leak a timer past nestApp.close().
 *
 * The timezone is resolved per register() call (readEnv().app.tz || 'UTC'),
 * keeping the retired scheduler's read-at-schedule-time behavior: a dynamic
 * job that re-registers picks up a changed TZ. timezone: 'none' schedules in
 * the server-local zone (the demo reset and the trek-photo sweep always ran
 * that way).
 */
@Injectable()
export class CronRegistrarService implements OnApplicationShutdown {
  /** Names this service registered — the registry may hold other owners' jobs. */
  private readonly names = new Set<string>();

  constructor(
    private readonly registry: SchedulerRegistry,
    private readonly runtimeEnv: RuntimeEnvService,
  ) {}

  /** False under NODE_ENV=test — the single gate keeping the suites timer-free. */
  isEnabled(): boolean {
    return !this.runtimeEnv.isTest();
  }

  /**
   * Schedule a cron. An existing job under the same name is stopped and
   * replaced, so a dynamic job restarts by calling register() again.
   * Returns false without scheduling anything when isEnabled() is false.
   */
  register(
    name: string,
    expression: string,
    onTick: () => void | Promise<void>,
    opts?: { timezone?: 'app' | 'none' },
  ): boolean {
    this.unregister(name);
    if (!this.isEnabled()) return false;
    const timeZone = opts?.timezone === 'none' ? undefined : readEnv().app.tz || 'UTC';
    const job = CronJob.from({ cronTime: expression, onTick, start: true, timeZone });
    this.registry.addCronJob(name, job);
    this.names.add(name);
    return true;
  }

  /** Stop and drop a job by name. A name that was never registered is a no-op. */
  unregister(name: string): void {
    if (!this.names.has(name)) return;
    // The orchestrator may have already cleared the registry (its
    // beforeApplicationShutdown runs before our onApplicationShutdown).
    if (this.registry.doesExist('cron', name)) {
      this.registry.deleteCronJob(name); // deleteCronJob stops the job before dropping it
    }
    this.names.delete(name);
  }

  get jobCount(): number {
    return this.names.size;
  }

  onApplicationShutdown(): void {
    for (const name of [...this.names]) {
      this.unregister(name);
    }
  }
}
