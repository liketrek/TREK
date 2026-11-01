import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { logDebug, logError, logInfo } from '../audit/audit-log.logger';
import { DomainError } from '../common/domain-error';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { StorageReclaimService } from './storage-reclaim.service';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { StorageReclaimReport } from '@trek/shared';

/**
 * The nightly reclaim pass, 04:05: after the thumbnail sweep at 04:00 and
 * before the usage scan at 04:15, so the next usage figures already show what
 * it freed. No pass at boot: a pass that may delete waits for its hour.
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
      const line = summary(report);
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

/** One line when the pass found, deleted or refused something; null when there was nothing to say. */
function summary(report: StorageReclaimReport): string | null {
  const rows = Object.values(report.categories);
  const unreferenced = rows.reduce((sum, row) => sum + row.unreferenced.objects, 0);
  const deleted = rows.reduce((sum, row) => sum + row.deleted.objects, 0);
  const bytes = rows.reduce((sum, row) => sum + row.deleted.bytes, 0);
  const braked = Object.entries(report.categories)
    .filter(([, row]) => row.skipped !== null && row.skipped !== 'not_reclaimed')
    .map(([category, row]) => `${category} (${row.skipped})`);
  const parts: string[] = [];
  if (unreferenced > 0) parts.push(`${unreferenced} unreferenced object(s)`);
  if (deleted > 0) parts.push(`deleted ${deleted} (${bytes} bytes)`);
  if (braked.length > 0) parts.push(`skipped ${braked.join(', ')}`);
  if (report.stopped) parts.push(`stopped: ${report.stopped}`);
  return parts.length > 0 ? parts.join('; ') : null;
}
