import { readEnv } from '../../app-config';
import type { User } from '../../types';
import { AuditService } from '../audit/audit.service';
import { getClientIp } from '../audit/client-ip';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { currentSessionId } from '../auth-core/jwt-verify';
import { clearAuthCookie } from '../common/cookie';
import { isDemoEmail } from '../common/demo';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { SessionsService } from '../sessions/sessions.service';
import { Controller, Delete, Get, HttpCode, HttpException, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
  userSessionRevokeParamsSchema,
  type UserSessionListResponse,
  type UserSessionRevokeOthersResponse,
  type UserSessionRevokeParams,
  type UserSessionRevokeResponse,
} from '@trek/shared';

import type { Request, Response } from 'express';

/**
 * The signed-in user's own sessions: where they are signed in, and signing
 * one or all the others out. Behind JwtAuthGuard like the other account
 * routes, and scoped to the caller: another user's session id answers 404,
 * exactly like one that does not exist.
 *
 * A request made with a token from before sessions were tracked sees no
 * current session (`current_tracked: false`). Signing out the others then
 * ends every tracked session, while that token itself runs on to its expiry.
 *
 * On a demo instance every visitor signs in as the one shared demo account,
 * so its sessions are other people's browsers: the list shows the caller only
 * their own session, and ending sessions is refused with the 403 the other
 * account changes answer in demo mode.
 *
 * No MCP tool mirrors these routes: MCP exposes no account or session tools,
 * and a session is a browser credential an assistant has no business ending.
 */
@Controller('api/auth/sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(
    private readonly sessions: SessionsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  async list(@CurrentUser() user: User, @Req() req: Request): Promise<UserSessionListResponse> {
    const current = currentSessionId(req);
    const sessions = await this.sessions.list(user.id, current);
    return {
      sessions: isSharedDemoAccount(user) ? sessions.filter((session) => session.current) : sessions,
      current_tracked: current !== undefined,
    };
  }

  // Static sub-route before the `:id` one.
  @Post('revoke-others')
  @HttpCode(200)
  async revokeOthers(@CurrentUser() user: User, @Req() req: Request): Promise<UserSessionRevokeOthersResponse> {
    refuseForSharedDemoAccount(user);
    const revoked = await this.sessions.revokeAll(user.id, currentSessionId(req));
    await this.audit.writeAudit({
      userId: user.id,
      action: 'user.sessions_revoke_others',
      ip: getClientIp(req),
      details: { revoked },
    });
    return { success: true, revoked };
  }

  @Delete(':id')
  async revoke(
    @CurrentUser() user: User,
    @Param(new ZodValidationPipe(userSessionRevokeParamsSchema)) params: UserSessionRevokeParams,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserSessionRevokeResponse> {
    refuseForSharedDemoAccount(user);
    if (!(await this.sessions.revoke(user.id, params.id))) {
      throw new HttpException({ error: 'Session not found' }, 404);
    }
    // Ending the session this request came with is a logout: the cookie goes too.
    if (params.id === currentSessionId(req)) clearAuthCookie(res, req);
    await this.audit.writeAudit({
      userId: user.id,
      action: 'user.session_revoke',
      ip: getClientIp(req),
      resource: params.id,
    });
    return { success: true };
  }
}

/** The demo account every visitor of a demo instance shares. */
function isSharedDemoAccount(user: User): boolean {
  return readEnv().demo.enabled && isDemoEmail(user.email);
}

function refuseForSharedDemoAccount(user: User): void {
  if (isSharedDemoAccount(user)) {
    throw new HttpException({ error: 'Sessions cannot be ended in demo mode.' }, 403);
  }
}
