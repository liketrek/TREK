import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { ImmichService } from '../immich.service';
import { fail, success, type AssetInfo, type ServiceResult } from '../memories.helpers';
import type {
  PhotoAssetKind, PhotoAssetRef, PhotoBytes, PhotoFetchError, PhotoProvider,
} from '../photo-provider';

/**
 * Immich behind the PhotoProvider interface.
 *
 * An adapter rather than `implements` on ImmichService itself: that service is
 * also the album/browse surface the controllers use, with its own argument
 * order and its own `{ data?, error?, status? }` return shape. Mapping here
 * keeps the interface narrow and leaves the service's callers untouched.
 */
@Injectable()
export class ImmichPhotoProvider implements PhotoProvider {
  readonly id = 'immich';

  constructor(private readonly immich: ImmichService) {}

  streamAsset(res: Response, ref: PhotoAssetRef, kind: PhotoAssetKind): Promise<void> {
    return this.immich.streamImmichAsset(res, ref.userId, ref.assetId, kind, ref.ownerId, {
      mediaType: ref.mediaType,
      range: ref.range,
    });
  }

  fetchThumbnailBytes(ref: PhotoAssetRef): Promise<PhotoBytes | PhotoFetchError> {
    return this.immich.fetchImmichThumbnailBytes(ref.userId, ref.assetId, ref.ownerId);
  }

  async getAssetInfo(ref: PhotoAssetRef): Promise<ServiceResult<AssetInfo>> {
    const result = await this.immich.getAssetInfo(ref.userId, ref.assetId, ref.ownerId);
    if (result.error) return fail(result.error, result.status || 500);
    return success(result.data as AssetInfo);
  }
}
