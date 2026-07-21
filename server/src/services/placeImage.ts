import fs from 'fs';
import path from 'path';
import { db } from '../db/database';

// Custom place images (the user-uploaded thumbnails from #1136) live in their own
// uploads subdir, served statically like covers. Storing the full /uploads/places/…
// path in image_url lets every existing thumbnail renderer show it unchanged.
export const PLACE_IMAGES_DIR = path.resolve(__dirname, '../../uploads/places');
const URL_PREFIX = '/uploads/places/';

export function placeImageUrl(filename: string): string {
  return `${URL_PREFIX}${filename}`;
}

export function isUploadedPlaceImage(url: string | null | undefined): url is string {
  return typeof url === 'string' && url.startsWith(URL_PREFIX);
}

/**
 * Delete a custom place-image file once nothing references it any more. A trip
 * place and a collection saved-place can share the same uploaded file — save-to-
 * collection and copy-to-trip copy image_url by reference — so we ref-count across
 * both tables before unlinking. The path is confined to PLACE_IMAGES_DIR via
 * basename, mirroring tripService.deleteOldCover. Best-effort: never throws.
 */
export function reclaimPlaceImage(url: string | null | undefined): void {
  if (!isUploadedPlaceImage(url)) return;
  const referenced =
    db.prepare('SELECT 1 FROM places WHERE image_url = ? LIMIT 1').get(url) ||
    db.prepare('SELECT 1 FROM collection_places WHERE image_url = ? LIMIT 1').get(url);
  if (referenced) return;
  try {
    const resolved = path.resolve(path.join(PLACE_IMAGES_DIR, path.basename(url)));
    if (resolved.startsWith(PLACE_IMAGES_DIR + path.sep) && fs.existsSync(resolved)) fs.unlinkSync(resolved);
  } catch { /* best-effort */ }
}
