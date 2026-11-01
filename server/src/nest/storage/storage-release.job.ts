import { logDebug, logError } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { StorageReleaseService } from './storage-release.service';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/**
 * Every ten minutes, what users' deletes and replaces queued and what is due
 * now (StorageReleaseService): each object asked about once more and deleted
 * when no row names it. The registrar is handed the tick's own promise, so
 * its lease covers the whole tick.
 */
@Injectable()
export class StorageReleaseJob implements OnApplicationBootstrap {
  constructor(
    private readonly registrar: CronRegistrarService,
    private readonly release: StorageReleaseService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.registrar.register('storage-release', '*/10 * * * *', () => this.tick());
  }

  /**
   * @txIndependent every delete and every dropped row stands on its own
   * (StorageReleaseService.processDue).
   */
  async tick(now: Date = new Date()): Promise<void> {
    try {
      const result = await this.release.processDue(now);
      if (result.skipped !== null) logDebug(`Storage release skipped: ${result.skipped}`);
      else if (result.deleted + result.kept > 0) {
        logDebug(`Storage release: deleted ${result.deleted}, kept ${result.kept} still named`);
      }
    } catch (err: unknown) {
      logError(`Storage release: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
