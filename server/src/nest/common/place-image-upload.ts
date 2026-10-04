import path from 'path';
import type { Options } from 'multer';

export const MAX_PLACE_IMAGE_SIZE = 20 * 1024 * 1024; // 20 MB — same cap as covers.
/** The picture types a place image may be, whether uploaded or taken from an attachment. */
export const PLACE_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

/**
 * fileFilter for the custom place-image upload (#1136), shared by the
 * trip-place and collection-place upload endpoints (passed inline on each
 * route; the storage engine — spool destination + UUID filename — comes from
 * the owning module's storage-upload factory options).
 */
export const PLACE_IMAGE_FILE_FILTER: Options['fileFilter'] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype.startsWith('image/') && !file.mimetype.includes('svg') && PLACE_IMAGE_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    // Carry statusCode so TrekExceptionFilter maps the rejection to a 400 rather
    // than a 500 (same contract as the avatar upload's fileFilter).
    const err: Error & { statusCode?: number } = new Error('Only jpg, png, gif, webp images allowed');
    err.statusCode = 400;
    cb(err);
  }
};
