import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { logDebug, logError, logInfo } from '../audit/audit-log.logger';
import { DomainError } from '../common/domain-error';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { reportSummary } from './storage-reclaim.report';
import { StorageReclaimService } from './storage-reclaim.service';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/**
 * The nightly reclaim pass, 04:05: after the thumbnail sweep at 04:00. The
 * usage scan at 04:15 waits for a pass still running (StorageUsageScanJob), so
 * its figures show what the pass freed. No pass at boot: a pass that may
 * delete waits for its hour. A pass that deletes audits itself.
 */
@Injectable()
export class StorageReclaimJob implements OnApplicationBootstrap {
  constructor(
    private readonly registrar: CronRegistrarService,
    private readonly reclaim: StorageReclaimService,
    private readonly runtimeEnv: RuntimeEnvService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.registrar.register('storage-reclaim', '5 4 * * *', () => this.tick());
  }

  /**
   * @txIndependent a sweep in passes: each category's marks and each delete
   * stand on their own (StorageReclaimService.run).
   */
  async tick(now: Date = new Date()): Promise<void> {
    if (this.runtimeEnv.isDemoMode()) return;
    try {
      const report = await this.reclaim.run({ now });
      const line = reportSummary(report);
      if (line) logInfo(`Storage reclaim: ${line}`);
    } catch (err: unknown) {
      if (err instanceof DomainError && err.getStatus() === 409) {
        logDebug(`Storage reclaim skipped: ${err.message}`);
        return;
      }
      logError(`Storage reclaim: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
