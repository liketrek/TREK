import { AppSettings } from '../../db/entities/AppSettings.entity';
import { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import { logInfo, logError } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { DawarichSyncService } from './dawarich-sync.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

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
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
    private readonly sync: DawarichSyncService,
    private readonly registrar: CronRegistrarService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.registrar.isEnabled()) return;
    // Through runOnBoot (task-6-review-parity.md C1 — the wrap belongs at the
    // entrypoint regardless of whether the read underneath is raw SQL or
    // repository-backed, DSJ1 now converted onto `AppSettingsRepository`).
    // minutes defaults to the same fallback the interval read itself falls
    // back to, so an absent MikroORM (logged distinctly by runOnBoot, never
    // silently) still registers the job at its default cadence rather than
    // not registering at all.
    let minutes = 15;
    await this.registrar.runOnBoot('dawarich-sync-boot', async () => {
      const value = await this.appSettings.getValue('dawarich_poll_interval_minutes');
      const raw = Number.parseInt(value || '15', 10);
      minutes = Number.isFinite(raw) && raw >= 5 && raw <= 59 ? raw : 15;
      logInfo(`Dawarich sync: scheduled every ${minutes}m`);
    });
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
