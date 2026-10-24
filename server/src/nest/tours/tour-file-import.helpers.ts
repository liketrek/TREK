/**
 * IO-02: the file a Tours import reads, whichever of the three formats it is.
 * A GPX file gives its tracks and routes, a KML or KMZ file its lines; both
 * come back as the same rows, so the preview, the duplicate rule and the one
 * transaction that stores them are the GPX import's own. Loose points are
 * never a tour: a GPX file's waypoints are skipped as they always were, and a
 * KML file's pins, areas and the rest are counted for the preview to name.
 */
import { DomainError } from '../common/domain-error';
import type { PlaceImportService } from '../place-import/place-import.service';
import { KmlReadError, type PreparedGpxPlace } from '../place-import/place-import.types';
import type { TourFileLeftOut } from '@trek/shared';

type TourFileFormat = 'gpx' | 'kml' | 'kmz';

/** A file read for a Tours import: the rows it would store, and for a KML or KMZ file what it holds besides. */
export interface TourFileRead {
  rows: PreparedGpxPlace[];
  leftOut?: TourFileLeftOut;
}

/** The format by the upload's extension; anything else is read as GPX, as every Tours import was before. */
function tourFileFormat(fileName: string | undefined): TourFileFormat {
  const ext = fileName?.toLowerCase().split('.').pop();
  return ext === 'kml' || ext === 'kmz' ? ext : 'gpx';
}

/**
 * The refusal for a file without a single line. A GPX file is answered with
 * the body the route has always sent; a KML or KMZ file names its own format
 * and carries the code the client tells the case by.
 */
export function noTrackFound(fileName: string | undefined): DomainError {
  const format = tourFileFormat(fileName);
  if (format === 'gpx') return new DomainError(400, 'No track or route found in GPX file', { code: 'no_track' });
  return new DomainError(400, `No line found in ${format.toUpperCase()} file`, {
    code: 'no_track',
    details: { code: 'no_track' },
  });
}

/**
 * The rows a Tours import stores from this file. A KML or KMZ file that cannot
 * be read is a 400 whose `code` says why (malformed, archive_invalid,
 * archive_without_kml, archive_too_large).
 */
export async function readTourFile(
  placeImport: PlaceImportService,
  fileBuffer: Buffer,
  fileName: string | undefined,
): Promise<TourFileRead> {
  if (tourFileFormat(fileName) === 'gpx') {
    const rows = placeImport.readGpx(fileBuffer, {
      importWaypoints: false,
      importRoutes: true,
      importTracks: true,
      defaultName: fileName,
    });
    return { rows };
  }
  try {
    const { tracks, leftOut } = await placeImport.readMapFileTracks(fileBuffer, fileName ?? '');
    return { rows: tracks, leftOut };
  } catch (err: unknown) {
    if (err instanceof KmlReadError) {
      throw new DomainError(400, err.message, { code: 'tour_file_unreadable', details: { code: err.reason } });
    }
    throw err;
  }
}
