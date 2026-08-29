import { db } from '../../db/database';
import type { StorageService } from '../storage/storage.service';

import path from 'node:path';

const URL_PREFIX = '/uploads/places/';

export function placeImageUrl(filename: string): string {
  return `${URL_PREFIX}${filename}`;
}

export function isUploadedPlaceImage(url: string | null | undefined): url is string {
  return typeof url === 'string' && url.startsWith(URL_PREFIX);
}

/**
 * Delete a custom place-image object once nothing references it any more. A trip
 * place and a collection saved-place can share the same uploaded file — save-to-
 * collection and copy-to-trip copy image_url by reference — so we ref-count across
 * both tables before deleting. basename() keeps the storage name confined to the
 * 'places' category, mirroring tripService.deleteOldCover. Best-effort: never
 * throws (central key validation rejects a hostile stored value; the catch
 * swallows it exactly like the old unlink guard).
 */
export async function reclaimPlaceImage(storage: StorageService, url: string | null | undefined): Promise<void> {
  if (!isUploadedPlaceImage(url)) return;
  const referenced =
    db.prepare('SELECT 1 FROM places WHERE image_url = ? LIMIT 1').get(url) ||
    db.prepare('SELECT 1 FROM collection_places WHERE image_url = ? LIMIT 1').get(url);
  if (referenced) return;
  await storage.delete('places', path.basename(url)).catch(() => {
    /* best-effort */
  });
}
