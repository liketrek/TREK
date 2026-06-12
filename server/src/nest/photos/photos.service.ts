import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { streamPhoto, getPhotoInfo } from '../../services/memories/photoResolverService';
import { canAccessTrekPhoto } from '../../services/memories/helpersService';

/**
 * Thin Nest wrapper around the existing photo resolver/helper services. Access
 * control, streaming and the provider-specific info lookups reuse the legacy
 * code unchanged.
 */
@Injectable()
export class PhotosService {
  canAccess(userId: number, photoId: number): boolean {
    return canAccessTrekPhoto(userId, photoId);
  }

  stream(res: Response, userId: number, photoId: number, kind: 'thumbnail' | 'original') {
    return streamPhoto(res, userId, photoId, kind);
  }

  info(userId: number, photoId: number) {
    return getPhotoInfo(userId, photoId);
  }
}
