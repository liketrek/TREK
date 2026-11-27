import { getClientIp } from '../audit/client-ip';
import { Public } from '../auth-core/public.decorator';
import { DomainError } from '../common/domain-error';
import { RateLimitService } from '../common/rate-limit.service';
import { ResponseContract } from '../common/response-contract';
import { OidcBackchannelService } from './oidc-backchannel.service';
import { Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import {
  oidcBackchannelLogoutRequestSchema,
  oidcBackchannelLogoutResponseSchema,
  type OidcBackchannelLogoutResponse,
} from '@trek/shared';

import type { Request, Response } from 'express';

/**
 * Requests one address may send in a minute. An identity provider sends one
 * request per signed-out session, and an admin ending every session of a realm
 * sends a burst of them from one address, so the limit sits far above any real
 * logout traffic and only caps a flood of tokens that each cost a signature
 * check.
 */
export const BACKCHANNEL_LOGOUT_RATE_LIMIT = 600;
const RATE_WINDOW_MS = 60_000;

/**
 * POST /api/auth/oidc/backchannel-logout: OpenID Connect Back-Channel Logout
 * 1.0. The identity provider posts the signed `logout_token` here, server to
 * server, when a user signs out there; the admin enters this URL as the
 * client's back-channel logout URL in the provider.
 *
 * Always mounted: without a provider configured, or before the admin enters
 * the URL there, nothing ever posts a valid token and every request is a 400.
 *
 * The answers are the ones section 2.8 prescribes, all with
 * `Cache-Control: no-store`: 200 when the token was valid (also when it named
 * no account or session here), 400 `{"error":"invalid_request"}` for a missing
 * or invalid token and while OIDC is not configured (the login answers 400 for
 * that too). A 429 past the flood limit. Never a 500 for a bad token.
 *
 * The body is form-encoded, which the global `urlencodedParser` reads for this
 * path as for every other. It is checked against the shared contract with
 * `safeParse` in the handler rather than by the Zod pipe, so that a missing
 * token gets the spec's error body and the no-store header, like every other
 * refusal here.
 */
@Public('the identity provider calls it server to server; the signed logout token is the credential')
@Controller('api/auth/oidc')
export class OidcBackchannelController {
  constructor(
    private readonly backchannel: OidcBackchannelService,
    private readonly rl: RateLimitService,
  ) {}

  @Post('backchannel-logout')
  @HttpCode(200)
  @ResponseContract(oidcBackchannelLogoutResponseSchema)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<OidcBackchannelLogoutResponse> {
    res.set('Cache-Control', 'no-store');
    res.set('Pragma', 'no-cache');
    if (
      !(await this.rl.check(
        'oidc_backchannel',
        req.ip || 'unknown',
        BACKCHANNEL_LOGOUT_RATE_LIMIT,
        RATE_WINDOW_MS,
        Date.now(),
      ))
    ) {
      throw new DomainError(429, 'too_many_requests', {
        details: { error_description: 'Too many requests. Please try again later.' },
      });
    }
    const body = oidcBackchannelLogoutRequestSchema.safeParse(req.body);
    if (!body.success) {
      throw new DomainError(400, 'invalid_request', {
        code: 'missing_logout_token',
        details: { error_description: 'The logout_token parameter is missing or malformed.' },
      });
    }
    await this.backchannel.logout(body.data.logout_token, getClientIp(req) ?? null);
    return {};
  }
}
