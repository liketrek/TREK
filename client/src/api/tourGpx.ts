import type { TourGpxImportFields, TourGpxPreviewResponse, TourImportGpxResponse } from '@trek/shared';
import { postMultipart } from './client';

/** A GPX, KML or KMZ file and the fields beside it, as the Tours import routes read a multipart body. */
function gpxForm(file: File, fields?: TourGpxImportFields): FormData {
  const fd = new FormData();
  fd.append('file', file);
  for (const [key, value] of Object.entries(fields ?? {})) if (value !== undefined) fd.append(key, value);
  return fd;
}

/**
 * The Tours file import: a GPX, KML or KMZ file (IO-02) read for its preview
 * first (PAD-02), then imported as the type chosen.
 */
export const tourGpxApi = {
  /** What the file holds, read by the import's own parser; nothing is stored. */
  preview: (tripId: number | string, file: File): Promise<TourGpxPreviewResponse> =>
    postMultipart(`/trips/${tripId}/tours/import/gpx/preview`, gpxForm(file)),
  import: (tripId: number | string, file: File, fields?: TourGpxImportFields): Promise<TourImportGpxResponse> =>
    postMultipart(`/trips/${tripId}/tours/import/gpx`, gpxForm(file, fields)),
};
