import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from './nest/app.module';
import { applyGlobalMiddleware } from './middleware/globalMiddleware';
import { applyPlatformUploads, applyPlatformTransport, applyPlatformStatic } from './nest/platform/platform.routes';
import { apiDocsEnabled } from './nest/common/api-docs.kill-switch';
import { setupApiDocs } from './nest/platform/api-docs';

/**
 * Builds the unified TREK NestJS application that serves the ENTIRE surface — the
 * former Express app is gone. One builder is shared by the production bootstrap
 * (index.ts) and the integration-test harness so the two can never drift.
 *
 * Composition order is load-bearing. Everything except the SPA index.html fallback
 * is registered on the underlying Express instance BEFORE `app.init()`, because
 * Nest's router terminates an unmatched request by throwing NotFoundException — it
 * does NOT fall through to a route registered after init, so a post-init Express
 * route is unreachable. The platform routes are all specific paths (/uploads/*,
 * /api/health, /mcp, /.well-known/*, /oauth/{authorize,register,consent}) so they
 * match their own requests and `next()` everything else through to the Nest
 * controllers registered during init.
 *
 *   1. applyGlobalMiddleware — helmet/CSP, CORS, HSTS, forced-HTTPS, the global MFA
 *      policy, request logging + cookie-parser. `bodyParser: false` so Nest does its
 *      own parsing and the raw /mcp body reaches the MCP handler unparsed.
 *   2. applyPlatformUploads — the static + guarded /uploads/* routes.
 *   3. applyPlatformTransport — /api/health, the OAuth/MCP SDK + /.well-known
 *      metadata, the /mcp routes, the /oauth/consent COOP header.
 *   4. applyPlatformStatic — the production built-client static assets (so a real
 *      asset request returns the file before the Nest router 404s it).
 *   4b. setupApiDocs — Swagger UI/spec at /api/docs* when TREK_API_DOCS_ENABLED;
 *      also Express-level, so it must precede init for the same reason.
 *   5. app.init() — registers every migrated /api domain (the Nest controllers).
 *
 * The SPA index.html fallback (unmatched GET → index.html in production) is the
 * SpaFallbackFilter (APP_FILTER in AppModule); the global error envelope is the
 * TrekExceptionFilter (also APP_FILTER).
 */
export async function buildApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, new ExpressAdapter());
  const instance = app.getHttpAdapter().getInstance();
  applyGlobalMiddleware(instance, { bodyParser: false });
  applyPlatformUploads(instance);
  applyPlatformTransport(instance);
  applyPlatformStatic(instance);
  if (apiDocsEnabled()) setupApiDocs(app);
  await app.init();
  return app;
}
