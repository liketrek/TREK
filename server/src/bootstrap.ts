import nodeHttp from 'node:http';
import express from 'express';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { INestApplication } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { AppModule } from './nest/app.module';
import { httpConfig } from './nest/app-config';
import { applyGlobalMiddleware } from './middleware/globalMiddleware';
import { applyPlatformUploads, applyPlatformStatic } from './nest/platform/platform.routes';
import { apiDocsEnabled } from './nest/common/api-docs.kill-switch';
import { setupApiDocs } from './nest/platform/api-docs';
import { MCP_METADATA_MIDDLEWARE } from './nest/platform/mcp-metadata.middleware';
import { validateBodyContracts } from './nest/common/validate-body-contracts';
import { validateRouteGuards } from './nest/common/validate-route-guards';
import { validateManagedRoutes } from './nest/common/validate-managed-routes';
import { TrekWsAdapter } from './nest/realtime/trek-ws.adapter';
import { StorageService } from './nest/storage/storage.service';

/**
 * Builds the unified TREK NestJS application that serves the ENTIRE surface — the
 * former Express app is gone. One builder is shared by the production bootstrap
 * (index.ts) and the integration-test harness so the two can never drift.
 *
 * Composition order is load-bearing. The few remaining pre-`app.init()` pieces
 * are registered on the underlying Express instance first, because Nest's
 * router terminates an unmatched request by throwing NotFoundException — it
 * does NOT fall through to a route registered after init, so a post-init
 * Express route is unreachable. Each pre-init piece matches its own requests
 * and `next()`s everything else through to the Nest controllers:
 *
 *   1. applyGlobalMiddleware — helmet/CSP, CORS, HSTS, forced-HTTPS, request
 *      logging + cookie-parser.
 *   2. applyPlatformUploads — the static + guarded /uploads/* routes.
 *   3. MCP_METADATA_MIDDLEWARE — the SDK's OAuth discovery router + addon
 *      gate, container-built (DI) but mounted pathless here (see below).
 *   4. applyPlatformStatic — the production built-client static assets (so a
 *      real asset request returns the file before the Nest router 404s it).
 *   4b. setupApiDocs — Swagger UI/spec at /api/docs* when TREK_API_DOCS_ENABLED.
 *   4c. the named body-parser wrappers — the global 100kb JSON/urlencoded
 *      parsers, exempting /mcp so the MCP SDK reads the raw stream.
 *   5. app.init() — every domain controller, including the transport surface
 *      that used to live pre-init: /api/health (FeaturesController), OAuth
 *      discovery documents (DiscoveryController), the /oauth/consent COOP
 *      override (ConsentCoopMiddleware), /oauth/authorize + /oauth/register
 *      (SDK routers via OauthModule.configure) and /mcp (McpTransportModule).
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
  // Same pre-init consumption bridge as httpConfig above: the StorageService
  // instance is resolvable before init, and the handlers only *register* here —
  // per-request resolution runs after app.init() completed the registry load.
  applyPlatformUploads(instance, app.get(StorageService));
  // The SDK discovery router (+ its addon gate). Container-built so its deps
  // are injected (same pre-init consumption bridge as httpConfig above), but
  // applied here as a PATHLESS app.use: the SDK router matches absolute
  // /.well-known/* paths against req.url, and any Nest wildcard forRoutes()
  // mount is an Express pattern mount that strips the matched prefix from
  // req.url before the middleware runs.
  instance.use(app.get<RequestHandler>(MCP_METADATA_MIDDLEWARE));
  applyPlatformStatic(instance);
  // Pin the request-body ceiling explicitly. The Express shell used to set
  // '100kb' and stopped doing it when the Nest instance took over parsing, which
  // left the limit implicit — the same number, but nowhere anybody would find
  // it, and one NestFactory default away from silently becoming something else.
  // The verify hook keeps req.rawBody, which the plugin webhook routes need to
  // check a provider's HMAC over the exact payload (same hook Nest's own
  // useBodyParser would install).
  //
  // /mcp is exempted and stays RAW: the MCP SDK's StreamableHTTPServerTransport
  // reads the request stream itself (its own size handling and JSON-RPC error
  // bodies), and the transport controller passes the still-undefined req.body
  // through as handleRequest's parsedBody argument. No Nest route may ever
  // @Body() on /mcp. The wrapper NAMES are load-bearing:
  // ExpressAdapter.registerParserMiddleware skips its own init-time parsers
  // only when layers named jsonParser/urlencodedParser already sit in the stack.
  const rawBodyKeeper = (req: Request, _res: Response, buffer: Buffer) => {
    if (Buffer.isBuffer(buffer)) (req as Request & { rawBody?: Buffer }).rawBody = buffer;
  };
  /*
   * ── Why one route gets a larger body than the rest ───────────────────
   *
   * A hundred kilobytes is the right ceiling for an API of forms and ids, and
   * it is the wrong one for a photo book. A Studio document is sent WHOLE on
   * every autosave — deliberately, see book-store.schema.ts, because a patch
   * protocol would need an ordering guarantee and a merge rule per field — and
   * the contract already caps it at 150 spreads of 90 elements. A real book of
   * a fortnight's journey is well past a hundred kilobytes before anybody asks
   * for road geometry, and what the ceiling produces is not an error message
   * but a save that quietly fails and an editor that says "not saved" without
   * saying why.
   *
   * So the book route, and only the book route, is measured against the size a
   * book can actually be. Everything else keeps the tighter limit.
   */
  const bookBody = express.json({ limit: '8mb', verify: rawBodyKeeper });
  const json = express.json({ limit: '100kb', verify: rawBodyKeeper });
  const urlencoded = express.urlencoded({ limit: '100kb', extended: true, verify: rawBodyKeeper });
  const isMcp = (req: Request) => req.path === '/mcp' || req.path === '/mcp/';
  const isBookWrite = (req: Request) =>
    req.method === 'PUT' && /^\/api\/journeys\/\d+\/book$/.test(req.path);

  instance.use(function jsonParser(req: Request, res: Response, next: NextFunction) {
    if (isBookWrite(req)) return bookBody(req, res, next);
    return isMcp(req) ? next() : json(req, res, next);
  });
  instance.use(function urlencodedParser(req: Request, res: Response, next: NextFunction) {
    return isMcp(req) ? next() : urlencoded(req, res, next);
  });
  if (apiDocsEnabled()) setupApiDocs(app);
  await app.init();
  // Fail closed on unvalidated mutation bodies: every POST/PUT/PATCH @Body()
  // must carry a createZodDto class (validated by the global ZodValidationPipe)
  // or sit on the ratchet-only legacy allow-list — otherwise refuse to boot.
  validateBodyContracts(app);
  // Fail closed on the anonymous surface too: a route that answers without a
  // session must carry @Public() with a reason AND be on the reviewed list.
  // Default-deny protects what exists; this is what keeps the exemptions honest.
  validateRouteGuards(app);
  // And on the other direction of the same question: a route that a centrally
  // administered install withholds from its own admin must say why, and be on a
  // list somebody reviewed. Runs in every e2e harness because they share this
  // builder, so a forgotten marker fails in CI rather than at a customer.
  validateManagedRoutes(app);
  return app;
}
