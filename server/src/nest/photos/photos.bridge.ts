import { db } from '../../db/database';
import { DatabaseService } from '../database/database.service';
import { TrekPhotosRepository } from './trek-photos.repository';

/**
 * Non-Nest entry point for the `trek_photos` store — for the modules still
 * living in `src/services/` that only need to register or drop a row:
 * journeyService (photo upload, Immich sync, entry cleanup) and the memories
 * unifiedService. Exports the legacy photoResolverService names 1:1, so
 * repointing a consumer is an import-path-only diff. Inside the container,
 * inject TrekPhotosRepository instead. Delete this file when journeyService and
 * the memories cluster fold.
 *
 * Module-level construction is safe: `db` is the reinitialize-proof Proxy onto
 * the shared better-sqlite3 singleton, and the repository holds no state.
 */
const photos = new TrekPhotosRepository(new DatabaseService(db));

export function getOrCreateTrekPhoto(...args: Parameters<TrekPhotosRepository['getOrCreate']>) {
  return photos.getOrCreate(...args);
}

export function getOrCreateLocalTrekPhoto(...args: Parameters<TrekPhotosRepository['getOrCreateLocal']>) {
  return photos.getOrCreateLocal(...args);
}

export function resolveTrekPhoto(photoId: number) {
  return photos.resolve(photoId);
}

export function setTrekPhotoProvider(...args: Parameters<TrekPhotosRepository['setProvider']>) {
  return photos.setProvider(...args);
}

export function deleteTrekPhotoIfOrphan(photoId: number): void {
  photos.deleteIfOrphan(photoId);
}
