import { DocumentSyncItems } from '../../db/entities/DocumentSyncItems.entity';
import type { DocumentSyncItemsRepository } from '../../db/repositories/DocumentSyncItems.repository';
import { DomainError } from '../common/domain-error';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { DocSyncConfigService } from './doc-sync-config.service';
import { DocSyncService } from './doc-sync.service';
import { docFailed } from './document-provider';
import { DocumentProviderRegistry } from './document-provider.registry';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

import { createHash } from 'node:crypto';

/** Read-only transfer port. Uses the saved binding and provider's current scope, never a supplied URL or remote ID. */
@Injectable()
export class DocSyncTransferService {
  constructor(
    @InjectRepository(DocumentSyncItems) private readonly items: DocumentSyncItemsRepository,
    private readonly config: DocSyncConfigService,
    private readonly sync: DocSyncService,
    private readonly providers: DocumentProviderRegistry,
    private readonly access: TripAccessService,
  ) {}
  private async context(user: number, trip: number, id: number) {
    const access = await this.access.findAccessible(trip, user);
    const item = await this.items.findOne({ id }, { refresh: true });
    if (
      !access ||
      access.user_id !== user ||
      !item ||
      item.trip_id !== trip ||
      !item.remote_id ||
      item.remote_missing_at ||
      item.remote_trashed_at
    )
      throw new DomainError(404, 'External document unavailable');
    const link = await this.config.getLink(item.link_id);
    if (!link || link.trip_id !== trip || (await this.config.isOrphaned(link)) || (await this.sync.isSwitchedOff(link)))
      throw new DomainError(404, 'Document connection unavailable');
    const connection = await this.config.getConnection(link.connection_id);
    const provider = this.providers.get(link.provider_id);
    if (!connection || !provider || connection.trip_id !== trip || connection.provider_id !== link.provider_id)
      throw new DomainError(404, 'Document connection unavailable');
    const stamp = createHash('sha256')
      .update(
        JSON.stringify([
          item.remote_id,
          link.id,
          link.connection_id,
          link.provider_id,
          link.remote_scope_key,
          link.remote_root_id,
          link.remote_root_path,
          connection.owner_user_id,
          connection.base_url,
          connection.settings,
          connection.allow_insecure_tls,
          connection.secrets,
        ]),
      )
      .digest('hex');
    return { item, link, connection, provider, stamp };
  }
  /** @txStandalone Provider credentials may refresh independently before network reads; no trip or sync-state writes. */
  async openOriginal(user: number, trip: number, id: number) {
    const ctx = await this.context(user, trip, id);
    const ref = this.config.toRef(ctx.connection),
      scope = { ...this.config.toScopeRef(ctx.link), cursor: null };
    const listing = await ctx.provider.list(ref, scope).catch(() => {
      throw new DomainError(422, 'External provider unavailable');
    });
    if (docFailed(listing) || listing.data.truncated || listing.data.cursorUnchanged)
      throw new DomainError(422, 'Cannot verify current external document scope');
    const remote = listing.data.documents.find((r) => r.remoteId === ctx.item.remote_id && !r.isDeleted);
    if (!remote) throw new DomainError(404, 'External document no longer belongs to the trip');
    const fetched = await ctx.provider.fetch(ref, scope, remote.remoteId).catch(() => {
      throw new DomainError(422, 'External provider unavailable');
    });
    if (docFailed(fetched)) throw new DomainError(422, 'External original unavailable');
    if (fetched.data.remoteVersion !== remote.remoteVersion) {
      fetched.data.body.destroy();
      throw new DomainError(409, 'External original changed during transfer');
    }
    return {
      stream: fetched.data.body,
      expectedSize: remote.size,
      expectedDigest: remote.contentHash,
      check: async () => {
        if ((await this.context(user, trip, id)).stamp !== ctx.stamp)
          throw new DomainError(409, 'External document access changed during transfer');
      },
    };
  }
}
