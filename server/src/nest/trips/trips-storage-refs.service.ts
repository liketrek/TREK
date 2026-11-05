import { Trips } from '../../db/entities/Trips.entity';
import { likeAny, StorageReclaimSource } from '../storage/storage-reclaim-source.service';
import { EVERY_RECLAIMABLE_CATEGORY } from '../storage/storage-reclaim.types';
import { Injectable } from '@nestjs/common';

/**
 * Tells the storage reclaim pass which stored objects a trip still names
 * (#2924). `trips.cover_image` is whatever the client sent: usually
 * `/uploads/covers/<name>`, but just as well an absolute URL of this instance
 * or a path into another category, and a trip copy shares its source's cover.
 * So every category is claimed and every spelling is parsed.
 */
@Injectable()
export class TripsStorageRefsService extends StorageReclaimSource {
  readonly id = 'trips';
  readonly claims = EVERY_RECLAIMABLE_CATEGORY;

  protected async storedValues(containing: readonly string[] | null): Promise<Array<string | null | undefined>> {
    const rows = await this.em
      .getRepository(Trips)
      .find(likeAny<Trips>(['cover_image'], containing), { fields: ['cover_image'] });
    return rows.map((row) => row.cover_image);
  }
}
