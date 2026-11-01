import { Places } from '../../db/entities/Places.entity';
import { StorageReclaimSource } from '../storage/storage-reclaim-source.service';
import { EVERY_RECLAIMABLE_CATEGORY } from '../storage/storage-reclaim.types';
import { Injectable } from '@nestjs/common';

/**
 * Tells the storage reclaim pass which stored objects a trip place still names
 * (#2924). `places.image_url` admits any `/uploads/` path and any https URL,
 * a trip copy and copy-to-trip share it by reference, and a bulk update writes
 * one value onto many places, so every category is claimed and every spelling
 * is parsed. The photo-proxy paths name the place-photo cache, which keeps
 * itself.
 */
@Injectable()
export class PlacesStorageRefsService extends StorageReclaimSource {
  readonly id = 'places';
  readonly claims = EVERY_RECLAIMABLE_CATEGORY;

  protected async storedValues(): Promise<Array<string | null | undefined>> {
    const rows = await this.em.getRepository(Places).find({ image_url: { $ne: null } }, { fields: ['image_url'] });
    return rows.map((row) => row.image_url);
  }
}
