import fs from 'fs';
import path from 'path';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import type { Request } from 'express';
import { PLACE_IMAGES_DIR } from '../../services/placeImage';

const MAX_PLACE_IMAGE_SIZE = 20 * 1024 * 1024; // 20 MB — same cap as covers.

/**
 * Multer config for the custom place-image upload (#1136). Mirrors the collection
 * COVER_UPLOAD: server-chosen UUID filename, image-only filter, written to the
 * dedicated uploads/places dir. Shared by the trip-place and collection-place
 * upload endpoints.
 */
export const PLACE_IMAGE_UPLOAD = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      if (!fs.existsSync(PLACE_IMAGES_DIR)) fs.mkdirSync(PLACE_IMAGES_DIR, { recursive: true });
      cb(null, PLACE_IMAGES_DIR);
    },
    filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: MAX_PLACE_IMAGE_SIZE },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: (err: Error | null, accept: boolean) => void) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (file.mimetype.startsWith('image/') && !file.mimetype.includes('svg') && allowed.includes(ext)) {
      cb(null, true);
    } else {
      // Carry statusCode so TrekExceptionFilter maps the rejection to a 400 rather
      // than a 500 (same contract as the avatar upload's fileFilter).
      const err: Error & { statusCode?: number } = new Error('Only jpg, png, gif, webp images allowed');
      err.statusCode = 400;
      cb(err, false);
    }
  },
};
