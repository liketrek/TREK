import { TrekPhotos } from '../../db/entities/TrekPhotos.entity';
import { likeAny, StorageReclaimSource } from '../storage/storage-reclaim-source.service';
import { EVERY_RECLAIMABLE_CATEGORY } from '../storage/storage-reclaim.types';
import { Injectable } from '@nestjs/common';

/**
 * Tells the storage reclaim pass which stored objects a photo row still names
 * (#2924). Every `trek_photos` row with a path is live, whatever its provider
 * and whether or not a trip or journey links it: the bytes are served by
 * photo id (book pages, public journey shares), and a photo retargeted to a
 * remote provider is still read from its local copy. `file_path` and
 * `thumbnail_path` (a video's poster) are `journey/<name>` as every writer
 * stores them; rows carried over from older tables may hold another
 * spelling, so a bare or prefixed name keeps the journey object of that name
 * instead of guessing it away.
 */
@Injectable()
export class PhotosStorageRefsService extends StorageReclaimSource {
  readonly id = 'photos';
  readonly claims = EVERY_RECLAIMABLE_CATEGORY;
  protected override readonly keyOptions = { bare: 'journey', basename: true } as const;

  protected async storedValues(containing: readonly string[] | null): Promise<Array<string | null | undefined>> {
    const rows = await this.em
      .getRepository(TrekPhotos)
      .find(likeAny<TrekPhotos>(['file_path', 'thumbnail_path'], containing), {
        fields: ['file_path', 'thumbnail_path'],
      });
    return rows.flatMap((row) => [row.file_path, row.thumbnail_path]);
  }
}
