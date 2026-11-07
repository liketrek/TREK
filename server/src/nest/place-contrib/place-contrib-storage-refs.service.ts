import { PlaceContribOutbox } from '../../db/entities/PlaceContribOutbox.entity';
import { likeAny, StorageReclaimSource } from '../storage/storage-reclaim-source.service';
import { EVERY_RECLAIMABLE_CATEGORY } from '../storage/storage-reclaim.types';
import { Injectable } from '@nestjs/common';

/**
 * Tells the storage reclaim pass which stored objects the contribution queue
 * still names (#2924). A queued image value is the place's `image_url` as it
 * was when the user set it, kept until the sender reads the bytes, so the
 * object must outlive a place that changed or dropped its image meanwhile.
 * The value copies a free-form column: every category is claimed.
 */
@Injectable()
export class PlaceContribStorageRefsService extends StorageReclaimSource {
  readonly id = 'place-contrib';
  readonly claims = EVERY_RECLAIMABLE_CATEGORY;

  protected async storedValues(containing: readonly string[] | null): Promise<Array<string | null | undefined>> {
    const rows = await this.em
      .getRepository(PlaceContribOutbox)
      .find(likeAny<PlaceContribOutbox>(['value'], containing), { fields: ['value'] });
    return rows.map((row) => row.value);
  }
}
