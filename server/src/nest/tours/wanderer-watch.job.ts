import { logError } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { WandererWatchService } from './wanderer-watch.service';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/**
 * WAN-02: the hourly run of the optional wanderer watch. Hourly is how often
 * a connection may get its turn, not how often a trail is read: a source is
 * looked at again only a day later, and a run with nothing due asks no
 * instance anything. Whether wanderer is on, and which users switched the
 * watch on, is read per run, so a change lands without a restart.
 */
@Injectable()
export class WandererWatchJob implements OnApplicationBootstrap {
  constructor(
    private readonly watch: WandererWatchService,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.registrar.register('wanderer-watch', '23 * * * *', () => this.tick());
  }

  async tick(): Promise<void> {
    try {
      await this.watch.run();
    } catch (err: unknown) {
      logError(`wanderer watch: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
