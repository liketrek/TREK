import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { logInfo, logError } from '../audit/audit-log.logger';
import { DatabaseService } from '../database/database.service';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { DawarichSyncService } from './dawarich-sync.service';

/**
 * Polls every connected Dawarich instance for new visits (#2279).
 *
 * Slower than the AirTrail job by an order of magnitude, and on purpose: a
 * flight lands once, while a visit detector produces stays continuously, and
 * nobody needs a stay from four minutes ago on their planning screen. Fifteen
 * minutes keeps a whole afternoon's suggestions arriving in time to be useful
 * without turning a self-hosted instance into a busy server.
 *
 * The addon gate is re-read per tick inside the service, so switching the addon
 * off takes effect without a restart; the interval is read once at bootstrap,
 * matching how AirTrail behaves.
 */
@Injectable()
export class DawarichSyncJob implements OnApplicationBootstrap {
  constructor(
    private readonly db: DatabaseService,
    private readonly sync: DawarichSyncService,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    const value = this.db.get<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = ?',
      'dawarich_poll_interval_minutes',
    )?.value;
    const raw = Number.parseInt(value || '15', 10);
    const minutes = Number.isFinite(raw) && raw >= 5 && raw <= 59 ? raw : 15;
    logInfo(`Dawarich sync: scheduled every ${minutes}m`);
    this.registrar.register('dawarich-sync', `*/${minutes} * * * *`, () => this.tick());
  }

  async tick(): Promise<void> {
    try {
      await this.sync.runSync();
    } catch (err: unknown) {
      logError(`Dawarich sync tick failed: ${err instanceof Error ? err.message : err}`);
    }
  }
}
