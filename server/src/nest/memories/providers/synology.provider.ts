import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { SynologyService } from '../synology.service';
import type { AssetInfo, ServiceResult } from '../memories.helpers';
import type {
  PhotoAssetKind, PhotoAssetRef, PhotoBytes, PhotoFetchError, PhotoProvider,
} from '../photo-provider';

/**
 * Synology Photos behind the PhotoProvider interface.
 *
 * The `size` parameter stays unset, as every caller left it. The passphrase is
 * the one thing this provider needs that Immich does not: a shared album link
 * carries its own, and the caller decrypts it before handing it over.
 */
@Injectable()
export class SynologyPhotoProvider implements PhotoProvider {
  readonly id = 'synologyphotos';

  constructor(private readonly synology: SynologyService) {}

  streamAsset(res: Response, ref: PhotoAssetRef, kind: PhotoAssetKind): Promise<void> {
    return this.synology.streamSynologyAsset(res, ref.userId, ref.ownerId, ref.assetId, kind, undefined, ref.passphrase);
  }

  fetchThumbnailBytes(ref: PhotoAssetRef): Promise<PhotoBytes | PhotoFetchError> {
    return this.synology.fetchSynologyThumbnailBytes(ref.userId, ref.ownerId, ref.assetId, ref.passphrase);
  }

  getAssetInfo(ref: PhotoAssetRef): Promise<ServiceResult<AssetInfo>> {
    return this.synology.getSynologyAssetInfo(ref.userId, ref.assetId, ref.ownerId, ref.passphrase);
  }
}
