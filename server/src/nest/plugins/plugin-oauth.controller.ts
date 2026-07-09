import { Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pluginsEnabled } from './kill-switch';
import { PluginOAuthService } from './plugin-oauth.service';
import { db } from '../../db/database';

/**
 * Host-brokered outbound OAuth endpoints (#plugins). All are gated by JwtAuthGuard —
 * the browser carries the session, so the acting user is the real logged-in user, and
 * `state` additionally binds the callback to the connect request (CSRF defence). The
 * refresh token + client secret never leave the host; the plugin reads only a
 * short-lived access token at runtime via `ctx.oauth.getAccessToken()`.
 */
@Controller('api/plugin-oauth')
@UseGuards(JwtAuthGuard)
export class PluginOAuthController {
  constructor(private readonly oauth: PluginOAuthService) {}

  private isActive(id: string): boolean {
    return !!db.prepare("SELECT 1 FROM plugins WHERE id = ? AND status = 'active'").get(id);
  }

  @Get(':id/status')
  status(@Param('id') id: string, @Req() req: Request & { user?: { id: number } }): { configured: boolean; connected: boolean } {
    const userId = req.user?.id;
    if (!pluginsEnabled() || userId == null || !this.isActive(id)) return { configured: false, connected: false };
    return this.oauth.status(id, userId);
  }

  @Post(':id/connect')
  connect(@Param('id') id: string, @Req() req: Request & { user?: { id: number } }): { authorizeUrl: string } {
    const userId = req.user?.id;
    if (!pluginsEnabled() || userId == null || !this.isActive(id)) throw new Error('plugin not available');
    return { authorizeUrl: this.oauth.startConnect(id, userId, Date.now()) };
  }

  @Get(':id/callback')
  async callback(
    @Param('id') id: string,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Req() req: Request & { user?: { id: number } },
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user?.id;
    const back = (status: string) => res.redirect(`/settings?oauth=${encodeURIComponent(id)}:${status}`);
    if (!pluginsEnabled() || userId == null || !this.isActive(id)) return back('unavailable');
    if (error || !code || !state) return back('denied');
    try {
      await this.oauth.completeCallback(id, userId, code, state, Date.now());
      return back('connected');
    } catch {
      return back('failed');
    }
  }

  @Post(':id/disconnect')
  disconnect(@Param('id') id: string, @Req() req: Request & { user?: { id: number } }): { connected: false } {
    const userId = req.user?.id;
    if (userId != null) this.oauth.disconnect(id, userId);
    return { connected: false };
  }
}
