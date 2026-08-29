import { AddonsModule } from '../addons/addons.module';
import { AddonsService } from '../addons/addons.service';
import { createMcpAddonGate } from '../addons/mcp-addon-gate';
import { AuditModule } from '../audit/audit.module';
import { RateLimitModule } from '../common/rate-limit.module';
import { OauthApiController } from './oauth-api.controller';
import { OauthPublicController } from './oauth-public.controller';
import { TrekClientsStore, TrekOAuthProvider } from './oauth-sdk.provider';
import { OauthService } from './oauth.service';
import { authorizationHandler } from '@modelcontextprotocol/sdk/server/auth/handlers/authorize';
import { clientRegistrationHandler } from '@modelcontextprotocol/sdk/server/auth/handlers/register';
import { Module } from '@nestjs/common';
import type { MiddlewareConsumer, NestModule } from '@nestjs/common';

/**
 * OAuth 2.1 server (MCP). Public token/userinfo/revoke endpoints + the SPA's
 * authenticated consent/client/session management, plus the SDK's own
 * /oauth/authorize and /oauth/register Express routers, mounted here through
 * MiddlewareConsumer over the injected TrekOAuthProvider/TrekClientsStore.
 * forRoutes('<path>') is an Express prefix mount — the same app.use('/path')
 * shape (and the same req.url stripping) the pre-init platform mount used, and
 * exactly what the SDK routers are built for. The handlers are constructed once
 * per app instance in configure(), preserving the per-app lifetime of the DCR
 * handler's built-in rate limiter.
 *
 * The handlers bring their own body parsers; the global 100kb parsers run
 * first and theirs no-op on the already-consumed stream. The one observable
 * difference vs the pre-init mount: bracketed keys in a POST /oauth/authorize
 * body now parse with qs (extended:true) rather than querystring — the SDK
 * zod-rejects such bodies either way.
 *
 * Pending authorization codes live module-scoped in oauth.pending-codes.ts:
 * the consent controller (container singleton) writes them, the SDK exchange
 * path reads them back through the same injected singleton.
 *
 * Exports OauthService for AdminController (admin OAuth-session panel) and the
 * MCP transport's token verification.
 */
@Module({
  imports: [RateLimitModule, AuditModule, AddonsModule],
  controllers: [OauthPublicController, OauthApiController],
  providers: [OauthService, TrekClientsStore, TrekOAuthProvider],
  exports: [OauthService],
})
export class OauthModule implements NestModule {
  constructor(
    private readonly addons: AddonsService,
    private readonly provider: TrekOAuthProvider,
    private readonly clients: TrekClientsStore,
  ) {}

  configure(consumer: MiddlewareConsumer): void {
    const mcpAddonGate = createMcpAddonGate(this.addons);

    // SDK authorize handler: validates OAuth params, calls provider.authorize()
    // which redirects to the SPA consent page at /oauth/consent
    consumer.apply(mcpAddonGate, authorizationHandler({ provider: this.provider })).forRoutes('oauth/authorize');

    // SDK DCR handler: accepts registrations without scope (fixes issue #959 bug 2)
    consumer.apply(mcpAddonGate, clientRegistrationHandler({ clientsStore: this.clients })).forRoutes('oauth/register');
  }
}
