import { readEnv } from '../../app-config';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { logError } from '../audit/audit-log.logger';
import { withRequestContext } from '../database/request-context';
import { MikroORM } from '@mikro-orm/core';
import { Injectable, Optional, type OnApplicationShutdown } from '@nestjs/common';
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
    // D6 (task-2-review.md's controller ruling): a cron tick has no HTTP request
    // behind it, so every job's onTick is wrapped in a request context here — the
    // ONE place, rather than in each of the 14 `*.job.ts` providers. `@Optional()`
    // (not just a `?`, which is TS-only and does not tell Nest's DI the provider
    // may be absent) because SchedulingModule is deliberately NOT @Global (see
    // this module's own docstring): the e2e suites boot partial graphs — one
    // domain module + SchedulingModule, no MikroOrmModule.forRoot — so a hard
    // MikroORM dependency here would fail every one of them at compile(), the
    // same class of break `@InjectRepository` would cause. Production (buildApp)
    // always has it; a hand-built test instance that registers a job touching a
    // repository must pass one, same as the unit test doubles below.
    @Optional() private readonly orm?: MikroORM,
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
    const orm = this.orm;
    // Fail closed (task-6-fix-brief.md item 1): registration itself never
    // requires an ORM (CRONREG-002..009 register jobs whose onTick never
    // touches a repository, and the e2e partial harnesses that construct this
    // service via @Optional() with no MikroORM never tick at all — isEnabled()
    // is false under NODE_ENV=test). But once a tick DOES fire, it must run
    // inside a request context or not at all: dispatching it unwrapped used to
    // let a repository read inside onTick either silently succeed against the
    // wrong (global) EntityManager or throw MikroORM's own generic
    // "global EntityManager" error deep inside the job's own try/catch. Throw
    // OUR OWN clear error instead, so a hand-built double that registers a
    // job without an ORM but whose tick reaches a repository fails loudly and
    // distinctly rather than silently degrading.
    const wrappedTick = async () => {
      if (!orm) {
        throw new Error(`CronRegistrarService: no MikroORM available to build a request context for job "${name}"`);
      }
      return withRequestContext(orm, () => onTick());
    };
    const job = CronJob.from({ cronTime: expression, onTick: wrappedTick, start: true, timeZone });
    this.registry.addCronJob(name, job);
    this.names.add(name);
    return true;
  }

  /**
   * Runs a boot-time (`onApplicationBootstrap`) one-off sweep inside the same
   * request context a registered tick gets from `register()` above — the one
   * choke point for the whole class of bug task-6-review-parity.md's C1
   * found: a job's "run once at startup" call is not a scheduled tick, so it
   * bypassed `register()`'s wrapper entirely; once its dependency graph went
   * repository-backed (`AddonsService.isAddonEnabled`), the read threw
   * `cannotUseGlobalContext` on EVERY production boot — silently, because the
   * job's own try/catch swallowed it into a log line about the sweep's own
   * domain, never mentioning the missing context. Every
   * `onApplicationBootstrap` boot sweep goes through this one method now,
   * whether or not it reaches a repository TODAY, so a job's dependency graph
   * can grow one later without silently regressing to the same bug.
   *
   * Fails closed like every other D6 choke point: no MikroORM means `fn`
   * never runs at all, and the failure is logged with a message naming THIS
   * method — never MikroORM's own "global EntityManager" wording — so a
   * missing-context boot failure is never confused with (or swallowed by) an
   * ordinary sweep failure the job's own catch already logs.
   */
  async runOnBoot(name: string, fn: () => Promise<void> | void): Promise<void> {
    if (!this.orm) {
      logError(`CronRegistrarService.runOnBoot: no MikroORM available — boot sweep "${name}" did not run`);
      return;
    }
    await withRequestContext(this.orm, fn);
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
