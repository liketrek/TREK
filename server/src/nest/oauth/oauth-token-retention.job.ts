import { OauthTokens } from '../../db/entities/OauthTokens.entity';
import type { OauthTokensRepository } from '../../db/repositories/OauthTokens.repository';
import { dbNow } from '../../db/types';
import { logError, logInfo } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/** How long a token is kept after its refresh token expired. */
export const OAUTH_TOKEN_RETENTION_DAYS = 30;

/**
 * Nightly purge of OAuth tokens whose refresh token expired a month ago.
 * Every refresh writes a new row and nothing ever deleted the old ones, so
 * an MCP client refreshing hourly grew the table, and with it every backup,
 * without end. An expired refresh token is refused on its own, so a row this
 * old serves nothing; the repository keeps any row a live chain still points
 * at.
 */
@Injectable()
export class OauthTokenRetentionJob implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(OauthTokens) private readonly tokens: OauthTokensRepository,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.registrar.register('oauth-token-retention', '30 3 * * *', () => this.tick());
  }

  async tick(now: Date = new Date()): Promise<void> {
    try {
      const cutoff = dbNow(new Date(now.getTime() - OAUTH_TOKEN_RETENTION_DAYS * 24 * 60 * 60 * 1000));
      const removed = await this.tokens.deleteExpiredBefore(cutoff);
      if (removed > 0) logInfo(`OAuth token retention: removed ${removed} expired token(s)`);
    } catch (err: unknown) {
      logError(`OAuth token retention: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
