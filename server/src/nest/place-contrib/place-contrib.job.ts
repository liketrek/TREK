import { PlaceContribLog } from '../../db/entities/PlaceContribLog.entity';
import type { PlaceContribLogRepository } from '../../db/repositories/PlaceContribLog.repository';
import { logError, logInfo } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { PlaceContribBackfill } from './place-contrib-backfill.service';
import { PlaceContribSender } from './place-contrib-sender.service';
import { LOG_RETENTION_DAYS, LOG_RETENTION_SCHEDULE, SEND_SCHEDULE } from './place-contrib.constants';
import { dayOf } from './place-contrib.helpers';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

const DAY_MS = 24 * 3_600_000;

/**
 * The two crons of the community enrichment: the sender every two minutes,
 * which does nothing unless the installation is eligible and an admin agreed
 * and first tops the queue up with the catch-up of earlier values,
 * and the nightly retention of the transmission log (90 days), which runs
 * whatever the decision so a log switched off still ages out.
 */
@Injectable()
export class PlaceContribJob implements OnApplicationBootstrap {
  constructor(
    private readonly sender: PlaceContribSender,
    private readonly backfill: PlaceContribBackfill,
    @InjectRepository(PlaceContribLog) private readonly log: PlaceContribLogRepository,
    private readonly registrar: CronRegistrarService,
  ) {}

  /** Whether the schedules run here; off in tests and on a replica, so a save sends nothing there either. */
  private enabled = false;
  private running: Promise<void> | null = null;
  private again = false;

  /** @txIndependent two schedules, each registered on its own; neither touches the database. */
  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.enabled = true;
    this.registrar.register('place-contrib-send', SEND_SCHEDULE, () => this.send());
    this.registrar.register('place-contrib-log-retention', LOG_RETENTION_SCHEDULE, () => this.retain());
  }

  /** A value was queued: send it now instead of at the next tick, which stays for the retries. */
  sendSoon(): void {
    if (this.enabled) void this.send();
  }

  /** One run at a time; a run asked for while one is going follows right after it. */
  async send(): Promise<void> {
    if (this.running !== null) {
      this.again = true;
      return this.running;
    }
    this.running = this.runOnce().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  /** @txIndependent the catch-up step and the send run each commit their own writes; a failed step never holds back the send. */
  private async runOnce(): Promise<void> {
    this.again = false;
    // A failed catch-up step never keeps what is queued from going out.
    try {
      await this.backfill.step();
    } catch (err: unknown) {
      logError(`Places contribution: the catch-up failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    try {
      await this.sender.run();
    } catch (err: unknown) {
      logError(`Places contribution: the run failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (this.again) return this.runOnce();
  }

  async retain(now: Date = new Date()): Promise<void> {
    try {
      const removed = await this.log.purgeBefore(dayOf(new Date(now.getTime() - LOG_RETENTION_DAYS * DAY_MS)));
      if (removed > 0) logInfo(`Places contribution: removed ${removed} log line(s) past ${LOG_RETENTION_DAYS} days`);
    } catch (err: unknown) {
      logError(`Places contribution: log retention failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
