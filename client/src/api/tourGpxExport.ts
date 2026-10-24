import apiClient from './client';

/**
 * The file name a download's Content-Disposition gives: the UTF-8 `filename*`
 * first, since it keeps the tour's own script, the plain `filename` after.
 */
export function attachmentFilename(header: unknown): string | null {
  if (typeof header !== 'string') return null;
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded.trim());
    } catch {
      // A malformed escape falls through to the plain name.
    }
  }
  return /filename="([^"]+)"/i.exec(header)?.[1] ?? null;
}

/** PR1-06A: one saved tour as the GPX file the server writes. */
export const tourGpxExportApi = {
  download: async (
    tripId: number | string,
    placeId: number,
    signal?: AbortSignal
  ): Promise<{ blob: Blob; filename: string | null }> => {
    const response = await apiClient.get<Blob>(`/trips/${tripId}/tours/${placeId}/export.gpx`, {
      responseType: 'blob',
      signal,
    });
    return { blob: response.data, filename: attachmentFilename(response.headers['content-disposition']) };
  },
};
