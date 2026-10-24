/**
 * Multer options factory for storage-backed uploads.
 *
 * Every disk-backed upload route consumes this through its module's
 * MulterModule.registerAsync DI factory: multer spools the request body into
 * the category backend's own spool dir (same volume as the destination), and
 * the handler commits with storage.put(category, file.filename,
 * { tmpPath: file.path }) — an atomic same-volume rename.
 *
 * The factory is deliberately ignorant of allowlists and per-route quirks:
 * fileFilter closures are caller-owned and passed through untouched.
 */
import { StorageService } from './storage.service';
import type { StorageCategory } from './storage.types';

import { randomUUID } from 'crypto';
import type { Request } from 'express';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import type { Options } from 'multer';
import * as path from 'path';

export interface StorageUploadOptions {
  /**
   * Constant for single-category modules; a per-request/per-file resolver for
   * modules whose routes feed different categories (collections: fieldname
   * 'image' → 'places', else 'covers').
   */
  category: StorageCategory | ((req: Request, file: Express.Multer.File) => StorageCategory);
  /** → limits.fileSize */
  maxSize: number;
  /** Caller-built closure, passed through untouched. */
  fileFilter?: Options['fileFilter'];
  /**
   * Returns the full final filename. Default: `${randomUUID()}${extname}` —
   * extension case-preserved, no fallback for extensionless names (parity with
   * the pre-factory call sites).
   */
  filename?: (req: Request, file: Express.Multer.File) => string;
  /** Always 'utf8' since fix #3; the option remains for explicit callers. */
  defParamCharset?: 'utf8';
}

export function buildStorageUploadOptions(storage: StorageService, opts: StorageUploadOptions) {
  const resolveCategory = typeof opts.category === 'function' ? opts.category : () => opts.category as StorageCategory;
  const makeName =
    opts.filename ??
    ((_req: Request, file: Express.Multer.File) => `${randomUUID()}${path.extname(file.originalname)}`);
  return {
    storage: diskStorage({
      // Resolved per request on purpose (registry no-cached-refs rule): a
      // reload() that remaps the category must be picked up by the next upload.
      destination: (req, file, cb) => {
        try {
          const dir = storage.spoolDirFor(resolveCategory(req, file));
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        } catch (err) {
          cb(err as Error, '');
        }
      },
      filename: (req, file, cb) => cb(null, makeName(req, file)),
    }),
    limits: { fileSize: opts.maxSize },
    ...(opts.fileFilter ? { fileFilter: opts.fileFilter } : {}),
    // Uniform since fix #3: non-ASCII original filenames decode as UTF-8 on
    // every upload route (previously only trip files + collab opted in).
    defParamCharset: opts.defParamCharset ?? 'utf8',
  };
}
