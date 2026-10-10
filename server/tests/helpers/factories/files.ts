import { FileLinks } from '../../../src/db/entities/FileLinks.entity';
import { TripFiles } from '../../../src/db/entities/TripFiles.entity';
import { nextSeq, type FactoryOrm } from './context';
import { createRow } from './rows';
import type { EntityData, EntityDTO } from '@mikro-orm/core';

export type TripFileRow = EntityDTO<TripFiles>;
export type FileLinkRow = EntityDTO<FileLinks>;

/**
 * A file row on the trip. Only the row: a test that downloads the file also
 * writes the bytes through the storage fixture (`storage-fixture.ts`).
 */
export function makeTripFile(
  orm: FactoryOrm,
  tripId: number,
  overrides: EntityData<TripFiles> = {},
): Promise<TripFileRow> {
  const n = nextSeq('trip-file');
  return createRow(orm, TripFiles, {
    trip: tripId,
    filename: `test-file-${n}.pdf`,
    original_name: `Test File ${n}.pdf`,
    file_size: 1024,
    mime_type: 'application/pdf',
    ...overrides,
  });
}

/** Links the file to a booking, an assignment, a place or an expense (name exactly one in `target`). */
export function linkFile(
  orm: FactoryOrm,
  fileId: number,
  target: Pick<EntityData<FileLinks>, 'reservation' | 'assignment' | 'place' | 'budgetItem'>,
): Promise<FileLinkRow> {
  return createRow(orm, FileLinks, { file: fileId, ...target });
}
