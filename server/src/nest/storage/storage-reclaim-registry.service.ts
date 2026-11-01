import { logWarn } from '../audit/audit-log.logger';
import type { StorageReferenceSource, StorageReferenceSourceId } from './storage-reclaim.types';
import { Injectable } from '@nestjs/common';

/**
 * Where the domains whose rows name stored objects register their reference
 * source (`storage-reclaim.types.ts`), the StorageEventsService shape: an owner
 * imports StorageModule, injects this and calls `register` from its own
 * `onApplicationBootstrap`, so storage never imports the owner back.
 *
 * Registering never throws: the e2e suites boot partial module graphs, and a
 * graph without a source is no error here. The reclaim pass checks the
 * registered ids against its ledger and skips every category that lacks one,
 * and a full-app test pins that the app registers exactly what the ledger asks.
 */
@Injectable()
export class StorageReclaimRegistryService {
  private readonly registered: StorageReferenceSource[] = [];

  register(source: StorageReferenceSource): void {
    // A provider listed in two modules bootstraps twice: one entry is enough.
    if (this.registered.includes(source)) return;
    if (this.registered.some((existing) => existing.id === source.id)) {
      // Two sources under one id are both asked; neither may hide the other.
      logWarn(`[storage] a second reference source registered as '${source.id}', both are asked`);
    }
    this.registered.push(source);
  }

  sources(): readonly StorageReferenceSource[] {
    return this.registered;
  }

  ids(): Set<StorageReferenceSourceId> {
    return new Set(this.registered.map((source) => source.id));
  }
}
