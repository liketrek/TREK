import type { Options } from 'multer';
import path from 'path';

export const MAX_PLACE_IMAGE_SIZE = 20 * 1024 * 1024; // 20 MB — same cap as covers.

/**
 * fileFilter for the custom place-image upload (#1136), shared by the
 * trip-place and collection-place upload endpoints (passed inline on each
 * route; the storage engine — spool destination + UUID filename — comes from
 * the owning module's storage-upload factory options).
 */
export const PLACE_IMAGE_FILE_FILTER: Options['fileFilter'] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  if (file.mimetype.startsWith('image/') && !file.mimetype.includes('svg') && allowed.includes(ext)) {
    cb(null, true);
  } else {
    // Carry statusCode so TrekExceptionFilter maps the rejection to a 400 rather
    // than a 500 (same contract as the avatar upload's fileFilter).
    const err: Error & { statusCode?: number } = new Error('Only jpg, png, gif, webp images allowed');
    err.statusCode = 400;
    cb(err);
  }
};
