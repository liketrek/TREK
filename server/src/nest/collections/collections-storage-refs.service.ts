import { CollectionPlaces } from '../../db/entities/CollectionPlaces.entity';
import { Collections } from '../../db/entities/Collections.entity';
import { StorageReclaimSource } from '../storage/storage-reclaim-source.service';
import { EVERY_RECLAIMABLE_CATEGORY } from '../storage/storage-reclaim.types';
import { Injectable } from '@nestjs/common';

/**
 * Tells the storage reclaim pass which stored objects a collection still names
 * (#2924): the list's own cover and every saved place's image. Saving a place
 * into a list and copying it to a trip share the uploaded image by reference,
 * and both columns take any string the client sends, so every category is
 * claimed and every spelling is parsed.
 */
@Injectable()
export class CollectionsStorageRefsService extends StorageReclaimSource {
  readonly id = 'collections';
  readonly claims = EVERY_RECLAIMABLE_CATEGORY;

  protected async storedValues(): Promise<Array<string | null | undefined>> {
    const covers = await this.em
      .getRepository(Collections)
      .find({ cover_image: { $ne: null } }, { fields: ['cover_image'] });
    const images = await this.em
      .getRepository(CollectionPlaces)
      .find({ image_url: { $ne: null } }, { fields: ['image_url'] });
    return [...covers.map((row) => row.cover_image), ...images.map((row) => row.image_url)];
  }
}
