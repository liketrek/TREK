import { RateLimitModule } from '../common/rate-limit.module';
import { Module } from '@nestjs/common';
import { OauthPublicController } from './oauth-public.controller';
import { OauthApiController } from './oauth-api.controller';
import { OauthService } from './oauth.service';
import { AuditModule } from '../audit/audit.module';
import { AddonsModule } from '../addons/addons.module';

/**
 * OAuth 2.1 server (MCP). Public token/userinfo/revoke endpoints + the SPA's
 * authenticated consent/client/session management. /oauth/authorize,
 * /oauth/register and /oauth/consent are still served by the MCP SDK's own
 * router, mounted on the Express platform before app.init() — that path
 * reaches the domain through oauth.bridge.ts, which is why the pending
 * authorization codes live in a module, not on the provider.
 *
 * Exports OauthService for AdminController, which serves the admin OAuth-session
 * panel under /api/admin. That is the one in-container consumer; everything
 * outside the container still goes through oauth.bridge.ts.
 */
@Module({
  imports: [RateLimitModule, AuditModule, AddonsModule],
  controllers: [OauthPublicController, OauthApiController],
  providers: [OauthService],
  exports: [OauthService],
})
export class OauthModule {}
