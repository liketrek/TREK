import {
  walkImportPreviewResponseSchema,
  walkImportRefusalResponseSchema,
  type WalkImportPreviewResponse,
  type WalkImportRefusal,
} from '@trek/shared';
import { tourWalkImportApi } from '../api/tourWalkImport';
import { requireOnline } from './onlineOnly';

/**
 * CW-07, online only on purpose: the stops come from a link the server reads
 * (and, for a short link, follows to Google Maps) at the moment it is asked,
 * and nothing of them is kept until the walk is saved like any other tour.
 * Offline the dialog says so instead of reading.
 */
export const tourWalkImportRepo = {
  async preview(tripId: number | string, url: string, signal?: AbortSignal): Promise<WalkImportPreviewResponse> {
    requireOnline();
    return walkImportPreviewResponseSchema.parse(await tourWalkImportApi.preview(tripId, { url }, signal));
  },
};

/** Why the server would not read a link, when its answer says so; null for any other failure. */
export function walkImportRefusalOf(err: unknown): WalkImportRefusal | null {
  const body = (err as { response?: { data?: unknown } } | null)?.response?.data;
  const parsed = walkImportRefusalResponseSchema.safeParse(body);
  return parsed.success ? parsed.data.reason : null;
}
