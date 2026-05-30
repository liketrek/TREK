import { Module } from '@nestjs/common';
import { OauthPublicController } from './oauth-public.controller';
import { OauthApiController } from './oauth-api.controller';
import { OauthService } from './oauth.service';
import { RateLimitService } from '../auth/rate-limit.service';

/**
 * OAuth 2.1 server (MCP). Public token/userinfo/revoke endpoints + the SPA's
 * authenticated consent/client/session management. The SDK-mounted
 * /oauth/authorize, /oauth/register and /oauth/consent stay on Express, so the
 * strangler lists /oauth/token, /oauth/userinfo, /oauth/revoke explicitly.
 */
@Module({
  controllers: [OauthPublicController, OauthApiController],
  providers: [OauthService, RateLimitService],
})
export class OauthModule {}
