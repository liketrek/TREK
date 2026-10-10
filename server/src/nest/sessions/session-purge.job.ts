import { logError, logInfo } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { SessionsService } from './sessions.service';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/**
 * Nightly removal of the expired `user_sessions` rows. Every sign-in writes a
 * row, so without this the table would grow by one row per login for as long
 * as the install runs. A revoked row waits for its own expiry: for a session
 * renewed from a token from before sessions were tracked, that row is what
 * keeps the old token from bringing the session back.
 */
@Injectable()
export class SessionPurgeJob implements OnApplicationBootstrap {
  constructor(
    private readonly sessions: SessionsService,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.registrar.register('session-purge', '45 3 * * *', () => this.tick());
  }

  async tick(now: Date = new Date()): Promise<void> {
    try {
      const removed = await this.sessions.purgeInactive(now);
      if (removed > 0) logInfo(`Session purge: removed ${removed} expired session(s)`);
    } catch (err: unknown) {
      logError(`Session purge: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
