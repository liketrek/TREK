import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';

import { verifyJwtAndLoadUser } from '../../middleware/auth';
import { db } from '../../db/database';
import { mcpHandler } from '../../mcp';
import { trekOAuthProvider, trekClientsStore } from '../../mcp/oauthProvider';
import { isAddonEnabled } from '../../services/adminService';
import { ADDON_IDS } from '../../addons';
import { ALL_SCOPES } from '../../mcp/scopes';
import { mcpAuthMetadataRouter } from '@modelcontextprotocol/sdk/server/auth/router';
import { authorizationHandler } from '@modelcontextprotocol/sdk/server/auth/handlers/authorize';
import { clientRegistrationHandler } from '@modelcontextprotocol/sdk/server/auth/handlers/register';
import type { OAuthMetadata } from '@modelcontextprotocol/sdk/shared/auth';
import { getMcpSafeUrl } from '../../services/notifications';

// Platform / transport routes extracted verbatim from createApp() (app.ts) so they can be
// mounted on either the legacy Express app or the NestJS Express instance (strangler A6/A8).
//
// IMPORTANT — path resolution: the original blocks lived in src/app.ts, where __dirname
// resolves to the directory of app.js (one level above the uploads/public anchor), so they
// used '../uploads/...' and '../public'. This file lives three levels deeper
// (src/nest/platform/), so __dirname is three levels deeper too. The relative prefixes are
// therefore '../../../uploads/...' and '../../../public' — which resolve to the EXACT same
// absolute paths as before. This is the only intentional change; everything else is byte-for-byte
// identical. (rootDir/outDir preserve the tree, so the offset holds in both source/test and
// compiled/dist execution — matching the other nest controllers that use '../../../uploads/...'.)

const UPLOADS_DIR = path.join(__dirname, '../../../uploads');
export const PUBLIC_DIR = path.join(__dirname, '../../../public');

/**
 * Static + guarded /uploads/* routes. Must be applied BEFORE the API route mounts
 * (identical to its original position near the top of createApp).
 */
export function applyPlatformUploads(app: express.Application): void {
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
  app.use('/uploads/avatars', express.static(path.join(UPLOADS_DIR, 'avatars')));
  app.use('/uploads/covers', express.static(path.join(UPLOADS_DIR, 'covers')));
  app.use('/uploads/journey', express.static(path.join(UPLOADS_DIR, 'journey')));

  // Photos require either a valid logged-in session (via JWT with the
  // password_version gate) OR a share token that covers the SPECIFIC
  // photo's trip. Previously any share token for any trip could request
  // any photo filename by UUID — fine in practice because UUIDs are
  // unguessable, but the auth model was wrong.
  app.get('/uploads/photos/:filename', (req: Request, res: Response) => {
    const safeName = path.basename(req.params.filename);
    const filePath = path.join(UPLOADS_DIR, 'photos', safeName);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(UPLOADS_DIR, 'photos'))) {
      return res.status(403).send('Forbidden');
    }
    // existsSync here is cheap and avoids a sendFile error frame; kept
    // sync because the handler is already short-lived.
    if (!fs.existsSync(resolved)) return res.status(404).send('Not found');

    const authHeader = req.headers.authorization;
    const rawToken = (req.query.token as string) || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
    if (!rawToken) return res.status(401).send('Authentication required');

    // JWT session path (with pv check).
    const user = verifyJwtAndLoadUser(rawToken);
    if (user) return res.sendFile(resolved);

    // Share-token path: require the token to cover the exact trip the
    // photo belongs to. Expired tokens fall through to 401.
    const photo = db.prepare('SELECT trip_id FROM photos WHERE filename = ?').get(safeName) as { trip_id: number } | undefined;
    if (!photo) return res.status(401).send('Authentication required');

    const share = db.prepare(
        "SELECT trip_id FROM share_tokens WHERE token = ? AND (expires_at IS NULL OR expires_at > datetime('now'))"
    ).get(rawToken) as { trip_id: number } | undefined;
    if (!share || share.trip_id !== photo.trip_id) {
      return res.status(401).send('Authentication required');
    }
    res.sendFile(resolved);
  });

  // Block direct access to /uploads/files
  app.use('/uploads/files', (_req: Request, res: Response) => {
    res.status(401).send('Authentication required');
  });
}

/**
 * Legacy /api/health handler, the OAuth/MCP SDK + transport wiring (well-known metadata,
 * authorize/register SDK handlers, the COOP header, the /mcp routes), and the production
 * SPA static + catch-all. Must be applied AFTER the API route mounts and BEFORE the global
 * error handler (identical to its original position near the bottom of createApp).
 *
 * Note: the SDK metadata closures (getOAuthMetadata/getMetaRouter) and their lazy-init
 * cache are kept module-local PER CALL so each app instance gets its own lazy state — the
 * same as when they were function-local inside createApp.
 */
export function applyPlatformTransport(app: express.Application): void {
  app.get('/api/health', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, must-revalidate')
    res.json({ status: 'ok' })
  });

  // OAuth 2.1 — public endpoints
  // Gate: 404 when MCP addon is disabled (M2 — prevents feature fingerprinting)
  const mcpAddonGate = (_req: Request, res: Response, next: NextFunction) => {
    if (!isAddonEnabled(ADDON_IDS.MCP)) return res.status(404).end();
    next();
  };

  // SDK metadata router — built lazily on first request so getAppUrl() (which queries the DB)
  // is not called at createApp() time, before test tables have been created.
  // mcpAuthMetadataRouter serves:
  //   /.well-known/oauth-authorization-server   — RFC 8414 AS metadata
  //   /.well-known/oauth-protected-resource/mcp — RFC 9728 path-based PRM (fixes issue #959 bug 1)
  let _oauthMetadata: OAuthMetadata | null = null;
  let _sdkMetaRouter: express.Router | null = null;

  function getOAuthMetadata(): OAuthMetadata {
    if (_oauthMetadata) return _oauthMetadata;
    const base = getMcpSafeUrl().replace(/\/+$/, '');
    _oauthMetadata = {
      issuer:                                base,
      authorization_endpoint:                `${base}/oauth/authorize`,
      token_endpoint:                        `${base}/oauth/token`,
      revocation_endpoint:                   `${base}/oauth/revoke`,
      registration_endpoint:                 `${base}/oauth/register`,
      response_types_supported:              ['code'],
      grant_types_supported:                 ['authorization_code', 'refresh_token', 'client_credentials'],
      code_challenge_methods_supported:      ['S256'],
      token_endpoint_auth_methods_supported: ['client_secret_post', 'none'],
      scopes_supported:                      ALL_SCOPES,
    };
    return _oauthMetadata;
  }

  function getMetaRouter(): express.Router {
    if (_sdkMetaRouter) return _sdkMetaRouter;
    const metadata = getOAuthMetadata();
    _sdkMetaRouter = mcpAuthMetadataRouter({
      oauthMetadata: metadata,
      resourceServerUrl: new URL(`${metadata.issuer}/mcp`),
      scopesSupported: ALL_SCOPES as string[],
      resourceName: 'TREK MCP',
    });
    return _sdkMetaRouter;
  }

  // Only invoke the SDK metadata router for /.well-known/* paths.
  // Calling getMetaRouter() on every request triggers lazy init (new URL(...)) which
  // throws "Invalid URL" when APP_URL lacks a protocol — breaking all page loads.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/.well-known/') && !isAddonEnabled(ADDON_IDS.MCP)) return res.status(404).end();
    getMetaRouter()(req, res, next);
  });

  // ChatGPT (and other OIDC-first clients) bootstrap OAuth discovery via
  // /.well-known/openid-configuration. Serve the AS metadata plus the OIDC
  // userinfo_endpoint so ChatGPT can fetch the authenticated user's email
  // for authorization domain claiming.
  app.get('/.well-known/openid-configuration', (_req: Request, res: Response) => {
    const meta = getOAuthMetadata();
    res.json({
      ...meta,
      userinfo_endpoint: `${meta.issuer}/oauth/userinfo`,
    });
  });

  // RFC 9728 flat well-known URL — served alongside the path-based form the SDK already provides.
  // Clients like ChatGPT probe /.well-known/oauth-protected-resource (no path suffix) on every
  // fresh discovery. Without this, they get 404, fall back to the issuer URL as the resource
  // parameter, and the authorize handler rejects them with invalid_target — showing the user
  // the TREK home page instead of the consent form.
  app.get('/.well-known/oauth-protected-resource', (_req: Request, res: Response) => {
    if (!isAddonEnabled(ADDON_IDS.MCP)) return res.status(404).end();
    const meta = getOAuthMetadata();
    res.json({
      resource:                 `${meta.issuer}/mcp`,
      authorization_servers:    [meta.issuer],
      bearer_methods_supported: ['header'],
      scopes_supported:         ALL_SCOPES,
      resource_name:            'TREK MCP',
    });
  });

  // SDK authorize handler: validates OAuth params, calls provider.authorize() which redirects
  // to the SPA consent page at /oauth/consent
  app.use('/oauth/authorize', mcpAddonGate, authorizationHandler({ provider: trekOAuthProvider }));

  // SDK DCR handler: accepts registrations without scope (fixes issue #959 bug 2)
  app.use('/oauth/register', mcpAddonGate, clientRegistrationHandler({ clientsStore: trekClientsStore }));

  // MCP endpoint
  app.post('/mcp', mcpHandler);
  app.get('/mcp', mcpHandler);
  app.delete('/mcp', mcpHandler);

  // Return 404 JSON for any /.well-known/* path the SDK metadata router doesn't handle.
  // Without this, the SPA catch-all serves HTML — clients probing
  // /.well-known/openid-configuration or the RFC 8414 path-suffixed AS metadata URL
  // receive a 200 HTML response they can't parse as JSON, causing "does not implement OAuth".
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/.well-known/')) return res.status(404).json({ error: 'not_found' });
    next();
  });

  // Helmet's COOP: same-origin isolates the consent popup from its cross-origin opener (ChatGPT etc.), making window.opener null and breaking the OAuth flow.
  app.use('/oauth/consent', (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    next();
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
  if (process.env.NODE_ENV !== 'production') return;
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
  if (process.env.NODE_ENV !== 'production') return;
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
