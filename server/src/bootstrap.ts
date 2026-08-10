import nodeHttp from 'node:http';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, type NestExpressApplication } from '@nestjs/platform-express';
import type { INestApplication } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { AppModule } from './nest/app.module';
import { httpConfig } from './nest/app-config';
import { applyGlobalMiddleware } from './middleware/globalMiddleware';
import { applyPlatformUploads, applyPlatformTransport, applyPlatformStatic } from './nest/platform/platform.routes';
import { apiDocsEnabled } from './nest/common/api-docs.kill-switch';
import { setupApiDocs } from './nest/platform/api-docs';
import { McpRegistryService } from '@trek/nest-mcp';
import { setMcpRegistry } from './mcp/registry-handoff';
import { validateBodyContracts } from './nest/common/validate-body-contracts';
import { validateRouteGuards } from './nest/common/validate-route-guards';
import { TrekWsAdapter } from './nest/realtime/trek-ws.adapter';

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
let boundHttpServer: nodeHttp.Server | null = null;

/**
 * The http server buildApp created and bound the ws gateway to.
 *
 * index.ts listens on it; the websocket suites connect to it. Anyone creating a
 * second server around the same express instance would get a working REST API
 * and a /ws that no client can reach.
 */
export function getHttpServer(): nodeHttp.Server {
  if (!boundHttpServer) throw new Error('buildApp() has not run yet');
  return boundHttpServer;
}

export async function buildApp(): Promise<INestApplication> {
  // rawBody keeps the unparsed request bytes on req.rawBody so a plugin webhook
  // route can verify a provider's HMAC signature over the exact payload (the
  // parsed JSON alone can't be re-serialised byte-for-byte).
  const app = await NestFactory.create(AppModule, new ExpressAdapter(), { rawBody: true });
  const instance = app.getHttpAdapter().getInstance();
  // The http server is created HERE, not by the caller after buildApp returns,
  // and that ordering is the whole point: Nest binds gateways during app.init(),
  // so the ws adapter has to exist before it and has to already know which
  // server to attach to. Handing it the app instead would bind the ws server to
  // Nest's own internal http server, which this process never listens on: the
  // boot succeeds, the gateway logs as registered, every test passes, and no
  // browser can connect. Callers take the server from getHttpServer() below.
  boundHttpServer = nodeHttp.createServer(instance);
  app.useWebSocketAdapter(new TrekWsAdapter(boundHttpServer));
  // ConfigModule.forRoot's load factories already ran inside NestFactory.create,
  // so the boot-stable snapshot is resolvable here, BEFORE app.init() — this is
  // the one bridge that lets the pre-init Express layer consume the validated
  // config instead of reading process.env itself.
  const http = app.get<ConfigType<typeof httpConfig>>(httpConfig.KEY);
  applyGlobalMiddleware(instance, { http });
  applyPlatformUploads(instance);
  applyPlatformTransport(instance);
  applyPlatformStatic(instance);
  // Pin the request-body ceiling explicitly. The Express shell used to set
  // '100kb' and stopped doing it when the Nest instance took over parsing, which
  // left the limit implicit — the same number, but nowhere anybody would find
  // it, and one NestFactory default away from silently becoming something else.
  // Configured through Nest rather than a second express.json(): its parser
  // carries the verify hook that keeps req.rawBody, which the plugin webhook
  // routes need to check a provider's HMAC over the exact payload.
  const express = app as unknown as NestExpressApplication;
  express.useBodyParser('json', { limit: '100kb' });
  express.useBodyParser('urlencoded', { limit: '100kb', extended: true });
  if (apiDocsEnabled()) setupApiDocs(app);
  await app.init();
  // The /mcp handler is mounted pre-init (step 3) and has no DI access — hand
  // it the boot-discovered registry now that the container is fully built.
  setMcpRegistry(app.get(McpRegistryService));
  // Fail closed on unvalidated mutation bodies: every POST/PUT/PATCH @Body()
  // must carry a createZodDto class (validated by the global ZodValidationPipe)
  // or sit on the ratchet-only legacy allow-list — otherwise refuse to boot.
  validateBodyContracts(app);
  // Fail closed on the anonymous surface too: a route that answers without a
  // session must carry @Public() with a reason AND be on the reviewed list.
  // Default-deny protects what exists; this is what keeps the exemptions honest.
  validateRouteGuards(app);
  return app;
}
