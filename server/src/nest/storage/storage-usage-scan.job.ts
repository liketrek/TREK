import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { StorageJobsService } from './storage-jobs.service';
import { StorageStatsService } from './storage-stats.service';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

/**
 * Nightly usage scan — 04:15, off the backup and thumb-sweep hours. A reclaim
 * pass still running from 04:05 is waited for first: the two would list the
 * same backends at once, and the figures should show what the pass freed.
 */
@Injectable()
export class StorageUsageScanJob implements OnApplicationBootstrap {
  private readonly logger = new Logger(StorageUsageScanJob.name);

  constructor(
    private readonly registrar: CronRegistrarService,
    private readonly stats: StorageStatsService,
    private readonly jobs: StorageJobsService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.registrar.register('storage-usage-scan', '15 4 * * *', () => {
      void this.tick();
    });
  }

  async tick(): Promise<void> {
    try {
      await this.jobs.exclusiveIdle();
      await this.stats.scan();
    } catch (err) {
      this.logger.error(`usage scan failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
