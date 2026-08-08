import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { MemoriesAccessService } from '../memories/memories-access.service';
import { PhotoResolverService } from '../memories/photo-resolver.service';

/**
 * /api/photos — the trek_photo read surface. Access control comes from the
 * memories domain (a photo is reachable through a trip or a journey), the bytes
 * from the resolver, which asks whichever provider owns the asset.
 */
@Injectable()
export class PhotosService {
  constructor(
    private readonly access: MemoriesAccessService,
    private readonly resolver: PhotoResolverService,
  ) {}

  canAccess(userId: number, photoId: number): boolean {
    return this.access.canAccessTrekPhoto(userId, photoId);
  }

  stream(res: Response, userId: number, photoId: number, kind: 'thumbnail' | 'original', range?: string) {
    return this.resolver.streamPhoto(res, userId, photoId, kind, range);
  }

  info(userId: number, photoId: number) {
    return this.resolver.getPhotoInfo(userId, photoId);
  }
}
