import { readEnv } from '../../app-config';
import { db } from '../../db/database';
import { verifyJwtAndLoadUser } from '../auth/jwt-verify';
import { StorageService } from '../storage/storage.service';
import { StorageInvalidKeyError, StorageNotFoundError, type StorageCategory } from '../storage/storage.types';

import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';

// Platform / transport routes extracted verbatim from createApp() (app.ts) so they can be
// mounted on either the legacy Express app or the NestJS Express instance (strangler A6/A8).
//
// IMPORTANT — path resolution: the original block lived in src/app.ts, where __dirname
// resolves to the directory of app.js (one level above the public anchor), so it used
// '../public'. This file lives three levels deeper (src/nest/platform/), so __dirname is
// three levels deeper too — hence '../../../public', which resolves to the EXACT same
// absolute path as before. (rootDir/outDir preserve the tree, so the offset holds in both
// source/test and compiled/dist execution.) The /uploads/* routes no longer anchor paths
// here at all: they address files as (category, name) through StorageService (slice 3).

export const PUBLIC_DIR = path.join(__dirname, '../../../public');

/**
 * express.static replacement for the four public /uploads mounts (storage
 * slice 3). Parity contract (spec §Serving): identical ETag / Last-Modified /
 * conditional-GET / Range / HEAD behavior — res.sendFile inside
 * storage.sendToResponse reads res.req, so the same send() machinery runs —
 * and every MISS (not-found, invalid key, dot segment, directory) calls
 * next() so the request falls through to the Nest router's standard 404
 * envelope, exactly like express.static's fallthrough. 412/416/5xx go to
 * next(err) with send's own http-errors — the same finalhandler path
 * express.static uses.
 */
export function storageStaticHandler(storage: StorageService, category: StorageCategory): express.RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    // serve-static fallthrough: non-GET/HEAD pass straight through (no 405).
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }
    // Inside an app.use mount req.path is the mount-stripped, query-free
    // pathname. Malformed percent-encoding falls through, matching
    // serve-static's silent fallthrough on send's 400 decode error.
    let decoded: string;
    try {
      decoded = decodeURIComponent(req.path);
    } catch {
      next();
      return;
    }
    const name = decoded.replace(/^\/+/, '');
    return storage.sendToResponse(category, name, res).catch((err: unknown) => {
      // MISS contract: unknown object, invalid key ('' at the mount root,
      // '..', dot segments, control chars) → Nest 404 envelope.
      if (err instanceof StorageNotFoundError || err instanceof StorageInvalidKeyError) {
        next();
        return;
      }
      const e = err as { status?: number; code?: string; syscall?: string };
      // stat→sendFile race (send 404) and directories: static falls through too.
      if (e.status === 404 || e.code === 'EISDIR') {
        next();
        return;
      }
      // Client gone / bytes already on the wire: nothing useful to send —
      // mirrors res.sendFile's own default callback (express response.js:454).
      if (e.code === 'ECONNABORTED' || e.syscall === 'write') return;
      next(err as Error);
    });
  };
}

async function servePhoto(storage: StorageService, req: Request, res: Response): Promise<void> {
  const safeName = path.basename(req.params.filename);
  // Parity: after basename(), the old resolve()+startsWith guard could only
  // fire when the remaining segment was '..' — keep that exact 403.
  if (safeName === '..') {
    res.status(403).send('Forbidden');
    return;
  }
  // Existence is (and was) checked BEFORE auth — the 404-vs-401 order is
  // observable and pinned. Invalid keys ('.', dotfiles) read as a miss.
  if (!(await storage.exists('photos', safeName).catch(() => false))) {
    res.status(404).send('Not found');
    return;
  }
  const sendPhoto = () =>
    storage.sendToResponse('photos', safeName, res).catch((err: unknown) => {
      // exists→send delete race: same 404 text as the miss branch.
      if ((err instanceof StorageNotFoundError || err instanceof StorageInvalidKeyError) && !res.headersSent) {
        res.status(404).send('Not found');
        return;
      }
      throw err;
    });

  const authHeader = req.headers.authorization;
  const rawToken = (req.query.token as string) || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
  if (!rawToken) {
    res.status(401).send('Authentication required');
    return;
  }

  // JWT session path (with pv check).
  const user = verifyJwtAndLoadUser(rawToken);
  if (user) return sendPhoto();

  // Share-token path: require the token to cover the exact trip the
  // photo belongs to. Expired tokens fall through to 401.
  const photo = db.prepare('SELECT trip_id FROM photos WHERE filename = ?').get(safeName) as
    | { trip_id: number }
    | undefined;
  if (!photo) {
    res.status(401).send('Authentication required');
    return;
  }
  const share = db
    .prepare(
      "SELECT trip_id FROM share_tokens WHERE token = ? AND (expires_at IS NULL OR expires_at > datetime('now'))",
    )
    .get(rawToken) as { trip_id: number } | undefined;
  if (!share || share.trip_id !== photo.trip_id) {
    res.status(401).send('Authentication required');
    return;
  }
  return sendPhoto();
}

/**
 * Static + guarded /uploads/* routes. Must be applied BEFORE the API route mounts
 * (identical to its original position near the top of createApp).
 */
export function applyPlatformUploads(app: express.Application, storage: StorageService): void {
  // Static: avatars, covers, and journey photos.
  //
  // Security model (audit SEC-M9): these paths are unauthenticated by
  // design. All filenames are server-chosen UUID v4 (see `uuid()` in
  // the multer storage config for avatars / covers / journey uploads),
  // which gives each asset >122 bits of namespace entropy — not
  // guessable via enumeration. An attacker would need to have already
  // seen the URL (email, shared journey, etc.) to request the file.
  //
  // Moving these behind auth would also break:
  //   - Unauthenticated trip-card rendering on public share links
  //   - Journey public-share pages (/public/journey/:token)
  //   - Email-embedded avatars
  //
  // The `/uploads/photos/...` route below is DIFFERENT: photo URLs are
  // not embedded in unauthenticated UI contexts, so that endpoint IS
  // gated (session JWT with pv, or a share token scoped to the photo's
  // trip).
  app.use('/uploads/avatars', storageStaticHandler(storage, 'avatars'));
  app.use('/uploads/covers', storageStaticHandler(storage, 'covers'));
  app.use('/uploads/journey', storageStaticHandler(storage, 'journey'));
  app.use('/uploads/places', storageStaticHandler(storage, 'places'));

  // Photos require either a valid logged-in session (via JWT with the
  // password_version gate) OR a share token that covers the SPECIFIC
  // photo's trip. Previously any share token for any trip could request
  // any photo filename by UUID — fine in practice because UUIDs are
  // unguessable, but the auth model was wrong.
  app.get('/uploads/photos/:filename', (req: Request, res: Response, next: NextFunction) =>
    servePhoto(storage, req, res).catch(next),
  );

  // Block direct access to /uploads/files
  app.use('/uploads/files', (_req: Request, res: Response) => {
    res.status(401).send('Authentication required');
  });
}

/**
 * Production SPA serving: the built client static assets + the index.html catch-all
 * for client-side routes. This is the LEGACY (plain Express 4) form — a real
 * `app.get(catch-all)` registered as the terminal handler. The NestJS bootstrap can
 * NOT use this (its router terminates unmatched requests with a 404 before any
 * post-init route runs, and Express 5's path-to-regexp rejects a bare '*'); it serves
 * the SPA via the SpaFallbackFilter instead. Both produce the identical result:
 * unmatched GET → index.html in production.
 */
export function applyPlatformSpa(app: express.Application): void {
  applyPlatformStatic(app);
  // Case-sensitive on purpose (legacy parity).
  if (readEnv().app.nodeEnv !== 'production') return;
  // /.*/ rather than '*' so the helper is Express-4 and Express-5 safe.
  app.get(/.*/, (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });
}

/**
 * Production static serving of the built client (JS/CSS/assets). Split out from
 * applyPlatformSpa because the NestJS bootstrap needs the static files served
 * BEFORE its router (so a real asset request returns the file, not the SPA
 * index.html), while the index.html catch-all is handled separately (legacy:
 * app.get catch-all; Nest: SpaFallbackFilter). No-op outside production.
 */
export function applyPlatformStatic(app: express.Application): void {
  // Case-sensitive on purpose (legacy parity).
  if (readEnv().app.nodeEnv !== 'production') return;
  app.use(
    express.static(PUBLIC_DIR, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      },
    }),
  );
}
