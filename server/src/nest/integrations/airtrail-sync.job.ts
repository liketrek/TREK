import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { logInfo, logError } from '../audit/audit-log.logger';
import { DatabaseService } from '../database/database.service';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { AirtrailSyncService } from './airtrail-sync.service';

/**
 * AirTrail sync: poll connected instances on an interval and reconcile linked
 * flights both ways (#214). Moved from src/scheduler.ts. The per-tick enable
 * gate (addon + setting) lives in runAirtrailSync, so toggling the addon takes
 * effect without a restart; the poll interval is read once at bootstrap
 * (parity — changing it still needs a restart).
 */
@Injectable()
export class AirtrailSyncJob implements OnApplicationBootstrap {
  constructor(
    private readonly db: DatabaseService,
    private readonly airtrail: AirtrailSyncService,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    const value = this.db.get<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', 'airtrail_poll_interval_minutes')?.value;
    const raw = Number.parseInt(value || '5', 10);
    const minutes = Number.isFinite(raw) && raw >= 1 && raw <= 59 ? raw : 5;
    logInfo(`AirTrail sync: scheduled every ${minutes}m`);
    this.registrar.register('airtrail-sync', `*/${minutes} * * * *`, () => this.tick());
  }

  async tick(): Promise<void> {
    try {
      await this.airtrail.runAirtrailSync();
    } catch (err: unknown) {
      logError(`AirTrail sync tick failed: ${err instanceof Error ? err.message : err}`);
    }
  }
}
