import { Journeys } from '../../db/entities/Journeys.entity';
import { StorageReclaimSource } from '../storage/storage-reclaim-source.service';
import { EVERY_RECLAIMABLE_CATEGORY } from '../storage/storage-reclaim.types';
import { Injectable } from '@nestjs/common';

/**
 * Tells the storage reclaim pass which stored objects a journey still names
 * (#2924). `journeys.cover_image` is inherited from the first linked trip as
 * `covers/<name>` (the trip and the journey share the object), set to a
 * gallery photo's `journey/<name>`, or whatever a PATCH sent. Every category
 * is claimed; the photos themselves are the photos domain's rows.
 */
@Injectable()
export class JourneyStorageRefsService extends StorageReclaimSource {
  readonly id = 'journey';
  readonly claims = EVERY_RECLAIMABLE_CATEGORY;

  protected async storedValues(): Promise<Array<string | null | undefined>> {
    const rows = await this.em
      .getRepository(Journeys)
      .find({ cover_image: { $ne: null } }, { fields: ['cover_image'] });
    return rows.map((row) => row.cover_image);
  }
}
