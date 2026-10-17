import { logError, logInfo } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { PaddleRegionsService } from './paddle-regions.service';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/**
 * PAD-05A: paddle data stays current. On boot a read a restart cut short is
 * queued again; on the 3rd of every month at 04:20 every region with data is
 * read again from Geofabrik's newest extract (they are rebuilt daily). The
 * reads run one after another in the background.
 */
@Injectable()
export class PaddleRegionsJob implements OnApplicationBootstrap {
  constructor(
    private readonly regions: PaddleRegionsService,
    private readonly registrar: CronRegistrarService,
  ) {}

  /** @txIndependent the boot resume and the monthly tick are two separate runs, never one sequence of writes */
  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    void this.registrar.runOnBoot('paddle-regions-resume', () => this.resume());
    this.registrar.register('paddle-regions-refresh', '20 4 3 * *', () => this.tick());
  }

  /** The boot's half: a failure is logged, never thrown at the boot. */
  async resume(): Promise<void> {
    try {
      await this.regions.resumeAfterRestart();
    } catch (err) {
      logError(`[Paddle] resuming the reads after a restart: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async tick(): Promise<void> {
    try {
      const queued = await this.regions.queueRefresh();
      if (queued > 0) logInfo(`[Paddle] monthly refresh: ${queued} region(s) queued`);
    } catch (err) {
      logError(`[Paddle] monthly refresh: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
