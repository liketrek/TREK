import { logDebug, logError } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { FlightLivePollService } from './flight-live-poll.service';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/**
 * Every minute, the flights in their watch window asked of the ADS-B feeds
 * by their cadence (FlightLivePollService). The registrar runs the tick in a
 * request context under the job's lease and never starts it twice; the poll
 * keeps a guard of its own for a tick that outlasts its minute.
 */
@Injectable()
export class FlightLiveJob implements OnApplicationBootstrap {
  constructor(
    private readonly registrar: CronRegistrarService,
    private readonly poll: FlightLivePollService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.registrar.register('flight-live', '* * * * *', () => this.tick());
  }

  /** @txIndependent each flight's state is a write of its own (FlightLivePollService.poll). */
  async tick(): Promise<void> {
    try {
      const result = await this.poll.poll();
      if (result.asked > 0) logDebug(`[flight-live] asked ${result.asked}, ${result.changed} changed`);
    } catch (err: unknown) {
      logError(`[flight-live] poll failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
