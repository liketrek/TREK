import { TripFiles } from '../../db/entities/TripFiles.entity';
import { likeAny, StorageReclaimSource } from '../storage/storage-reclaim-source.service';
import { Injectable } from '@nestjs/common';

/**
 * Tells the storage reclaim pass which objects of the files category a trip
 * file row still names (#2924). `trip_files.filename` is the bare object name;
 * rows from before the storage layer may still carry a path in front of it,
 * which every reader strips with basename(), so the last segment counts too.
 * Trashed rows count: a restore brings the file back, and doc-sync keeps its
 * superseded copies in the trash on purpose. Collab note files and chat images
 * are trip_files rows as well. The pass only ever asks about the category's
 * root (the assistant's subfolder has a sweep of its own), so a basename never
 * reaches into a subfolder.
 */
@Injectable()
export class FilesStorageRefsService extends StorageReclaimSource {
  readonly id = 'files';
  readonly claims = [{ category: 'files', prefix: '' }] as const;
  protected override readonly keyOptions = { bare: 'files', basename: true } as const;

  protected async storedValues(containing: readonly string[] | null): Promise<Array<string | null | undefined>> {
    const rows = await this.em
      .getRepository(TripFiles)
      .find(likeAny<TripFiles>(['filename'], containing), { fields: ['filename'] });
    return rows.map((row) => row.filename);
  }
}
