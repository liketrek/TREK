import { DocSyncTransferService } from '../doc-sync/doc-sync-transfer.service';
import { PhotoResolverService } from '../memories/photo-resolver.service';
import { TransferSourceCache, type PreparedSource, type TransferSource } from './transfer-source-cache';
import { canonical, fail, sha } from './transfer-wire';
import { Injectable } from '@nestjs/common';

export type ProviderSource = {
  photo?: { user: number; id: number };
  document?: { user: number; trip: number; id: number };
};

/** Source access is revalidated for every range; snapshot preparation alone downloads the original body. */
@Injectable()
export class TransferPhotoFiles {
  constructor(
    private readonly photos: PhotoResolverService,
    private readonly documents: DocSyncTransferService,
    private readonly cache: TransferSourceCache,
  ) {}
  private async open(source: ProviderSource): Promise<TransferSource> {
    if (source.document) {
      const { user, trip, id } = source.document;
      return this.documents.openOriginal(user, trip, id);
    }
    if (!source.photo) fail('Original source is missing');
    const { user, id } = source.photo;
    const original = await this.photos.openOriginal(user, id);
    return {
      ...original,
      expectedSize: null,
      expectedDigest: null,
      check: () => this.photos.checkOriginalAccess(user, id),
    };
  }
  prepare(source: ProviderSource, cached: boolean) {
    const id = sha(canonical(['provider-original-v1', source.photo ?? null, source.document ?? null]));
    return cached ? this.cache.get(id) : this.cache.prepare(id, () => this.open(source));
  }
  read(source: ProviderSource, prepared: PreparedSource, offset: number, limit: number) {
    return this.cache.read(prepared, offset, limit, () => this.open(source));
  }
  sweep() {
    return this.cache.sweep();
  }
}
