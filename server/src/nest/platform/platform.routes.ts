import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import type { EntityManager } from '@mikro-orm/core';

import { readEnv } from '../../app-config';
import { verifyJwtAndLoadUser } from '../auth/jwt-verify';
import { withRequestContext } from '../database/request-context';
import { StorageService } from '../storage/storage.service';
import { StorageInvalidKeyError, StorageNotFoundError, type StorageCategory } from '../storage/storage.types';
import { Users } from '../../db/entities/Users.entity';
import type { UsersRepository } from '../../db/repositories/Users.repository';
import { ShareTokens } from '../../db/entities/ShareTokens.entity';
import type { ShareTokensRepository } from '../../db/repositories/ShareTokens.repository';
import { Photos } from '../../db/entities/Photos.entity';
import type { PhotosRepository } from '../../db/repositories/Photos.repository';

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

// File types the client build emits. No page of the app ends in one of these.
const BUILD_FILE_RE = /\.(?:m?js|css|map|wasm|webmanifest|json|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf)$/i;

/**
 * Whether a request asks for a file of the built client rather than a page of it.
 *
 * Such a request that the static handler could not answer is a file that does not
 * exist, and it must end in a 404. It used to get index.html like a page (#2524).
 * A tab still running the previous build asks for a chunk the update removed and
 * gets HTML with a 200, which the module loader rejects. Worse, a 200 is a success
 * to everything that caches: a service worker's precache stores the HTML under the
 * chunk's name and keeps reusing it in every later version that keeps the name,
 * and a reverse proxy that caches static files by extension hands it out as the
 * chunk. A 404 is refused by the precache and never stands in for the file.
 */
export function isBuildFilePath(pathname: string): boolean {
  return pathname.startsWith('/assets/') || BUILD_FILE_RE.test(pathname);
}

/**
 * The production answer to a GET that nothing else matched: index.html for a page
 * of the app, a plain 404 in the TREK envelope for a build file that is not there.
 * Shared by both fallback forms (applyPlatformSpa and SpaFallbackFilter).
 */
export function answerUnmatchedGet(req: Request, res: Response, message = 'Not Found'): void {
  if (isBuildFilePath(req.path)) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(404).json({ error: message });
    return;
  }
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  // Relative to root, so that send() checks only 'index.html' for dot segments. Given
  // the absolute path it refused an install living under a dot directory (a
  // ~/.local checkout, say) and every deep link came back as a 404.
  res.sendFile('index.html', { root: PUBLIC_DIR });
}

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

async function servePhoto(storage: StorageService, req: Request, res: Response, users: UsersRepository, shareTokens: ShareTokensRepository, photos: PhotosRepository): Promise<void> {
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
  const user = await verifyJwtAndLoadUser(rawToken, users);
  if (user) return sendPhoto();

  // Share-token path: require the token to cover the exact trip the
  // photo belongs to. Expired tokens fall through to 401.
  const photo = await photos.findTripIdByFilename(safeName);
  if (!photo) {
    res.status(401).send('Authentication required');
    return;
  }
  const share = await shareTokens.findTripIdByToken(rawToken);
  if (!share || share.trip_id !== photo.trip_id) {
    res.status(401).send('Authentication required');
    return;
  }
  return sendPhoto();
}

/**
 * Static + guarded /uploads/* routes. Must be applied BEFORE the API route mounts
 * (identical to its original position near the top of createApp).
 *
 * `orm` (Plan 3b Task 0, D6/plan3b-sql-inventory.md §5/§6): `servePhoto` is
 * mounted here, on the raw Express instance, BEFORE `app.init()` — every
 * `/uploads/photos/*` request runs this handler entirely outside Nest's
 * per-request EntityManager fork, forever, not just during a boot window.
 * `verifyJwtAndLoadUser` (`jwt-verify.ts`, JV1) now reads `users` through
 * `UsersRepository` (Plan 3b Task 1) rather than the legacy `db` proxy — the
 * exact case Task 0's wrap was built for. The anonymous share-token fallback
 * (used when no JWT is present) now reads `share_tokens` through
 * `ShareTokensRepository.findTripIdByToken` the SAME way (Plan 3h Task 6, R1
 * — the plan's single highest-severity finding: this branch ran unconverted,
 * against the legacy `db` proxy, for three plans after the JWT half above
 * was fixed). The sibling `photos` table read (Plan 4 Task 1) now goes
 * through `PhotosRepository.findTripIdByFilename` the same way — its
 * `trip_id` MATCH against the converted `share` read is the handler's whole
 * authorization and is untouched, only the read itself moved off the legacy
 * `db` proxy. `orm.em.getRepository(Users)`, `orm.em.getRepository
 * (ShareTokens)` and `orm.em.getRepository(Photos)` are all resolved inside
 * the arrow passed to `withRequestContext` below: `orm.em` is the global,
 * context-resolving EntityManager, and MikroORM's repository object holds a
 * reference to that same proxy rather than a snapshot, so a query issued
 * through it later resolves whatever `AsyncLocalStorage` context is active
 * AT QUERY TIME — not at the moment `getRepository()` was called. What
 * actually gates this is `withRequestContext` wrapping the whole
 * `servePhoto(...)` call (every repository read included): removing the
 * wrapper entirely reproduces Task 0's `ValidationError: Using global
 * EntityManager instance...` (verified directly — mutation-proof in
 * `task-1-report.md`), exactly the failure `PHOTOCTX-002`/`SEAM-002` guard
 * against.
 *
 * Optional at the type level only, the same shape `TrekWsAdapter` uses for
 * its own D6 wrapper (`src/nest/realtime/trek-ws.adapter.ts`): `bootstrap.ts`
 * always passes the real `MikroORM` it already resolved. Fail-closed shape
 * per the Plan 3b Rulings — a request-time choke point THROWS when the ORM
 * is absent rather than running `servePhoto` unwrapped: the photo route
 * answers 500 through Express's error path (`next(err)`), the same shape the
 * WS adapter's message dispatch already uses (throw before calling the
 * handler at all, never a silent degrade).
 */
export function applyPlatformUploads(app: express.Application, storage: StorageService, orm?: { em: EntityManager }): void {
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
  app.get('/uploads/photos/:filename', (req: Request, res: Response, next: NextFunction) => {
    if (!orm) {
      next(new Error('applyPlatformUploads: no MikroORM available to build a request context for /uploads/photos/*'));
      return;
    }
    return withRequestContext(orm, () => servePhoto(storage, req, res, orm.em.getRepository(Users), orm.em.getRepository(ShareTokens), orm.em.getRepository(Photos))).catch(next);
  });

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
 * unmatched GET → index.html in production, or a 404 for a missing build file.
 */
export function applyPlatformSpa(app: express.Application): void {
  applyPlatformStatic(app);
  // Case-sensitive on purpose (legacy parity).
  if (readEnv().app.nodeEnv !== 'production') return;
  // /.*/ rather than '*' so the helper is Express-4 and Express-5 safe.
  app.get(/.*/, (req: Request, res: Response) => answerUnmatchedGet(req, res));
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
