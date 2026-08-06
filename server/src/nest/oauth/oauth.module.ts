import { RateLimitModule } from '../common/rate-limit.module';
import { Module } from '@nestjs/common';
import { OauthPublicController } from './oauth-public.controller';
import { OauthApiController } from './oauth-api.controller';
import { OauthService } from './oauth.service';
import { AuditModule } from '../audit/audit.module';
import { AddonsModule } from '../addons/addons.module';

/**
 * OAuth 2.1 server (MCP). Public token/userinfo/revoke endpoints + the SPA's
 * authenticated consent/client/session management. The SDK-mounted
 * /oauth/authorize, /oauth/register and /oauth/consent stay on Express, so the
 * strangler lists /oauth/token, /oauth/userinfo, /oauth/revoke explicitly.
 */
@Module({
  imports: [RateLimitModule, AuditModule, AddonsModule],
  controllers: [OauthPublicController, OauthApiController],
  providers: [OauthService],
})
export class OauthModule {}
