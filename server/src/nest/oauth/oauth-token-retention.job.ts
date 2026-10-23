import { OauthClients } from '../../db/entities/OauthClients.entity';
import { OauthTokens } from '../../db/entities/OauthTokens.entity';
import type { OauthClientsRepository } from '../../db/repositories/OauthClients.repository';
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
 *
 * The same sweep drops clients registered from a metadata document (oauth-cimd.ts)
 * that nobody has held a token for since the retention period: their row exists
 * only for the token and consent foreign keys, and the next authorization
 * registers the client again.
 */
@Injectable()
export class OauthTokenRetentionJob implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(OauthTokens) private readonly tokens: OauthTokensRepository,
    @InjectRepository(OauthClients) private readonly clients: OauthClientsRepository,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.registrar.register('oauth-token-retention', '30 3 * * *', () => this.tick());
  }

  /**
   * @txIndependent a retention sweep in two passes: the client pass only deletes
   * clients without tokens, so it is correct whether or not the token pass ran.
   */
  async tick(now: Date = new Date()): Promise<void> {
    try {
      const cutoff = dbNow(new Date(now.getTime() - OAUTH_TOKEN_RETENTION_DAYS * 24 * 60 * 60 * 1000));
      const removed = await this.tokens.deleteExpiredBefore(cutoff);
      if (removed > 0) logInfo(`OAuth token retention: removed ${removed} expired token(s)`);
      const clients = await this.clients.deleteUnusedCimdBefore(cutoff);
      if (clients > 0) logInfo(`OAuth token retention: removed ${clients} unused metadata-document client(s)`);
    } catch (err: unknown) {
      logError(`OAuth token retention: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
