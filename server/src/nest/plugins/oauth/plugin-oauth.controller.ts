import { Plugins } from '../../../db/entities/Plugins.entity';
import type { PluginsRepository } from '../../../db/repositories/Plugins.repository';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { pluginsEnabled } from '../kill-switch';
import { PluginOAuthService } from './plugin-oauth.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';

import type { Request, Response } from 'express';

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
  constructor(
    private readonly oauth: PluginOAuthService,
    // POC1 (Plan 3j Task 5) — shared with plugin-user-settings.controller.ts's activeWithUserFields.
    @InjectRepository(Plugins) private readonly pluginsRepo: PluginsRepository,
  ) {}

  private async isActive(id: string): Promise<boolean> {
    return await this.pluginsRepo.existsActive(id);
  }

  @Get(':id/status')
  async status(
    @Param('id') id: string,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ configured: boolean; connected: boolean }> {
    const userId = req.user?.id;
    if (!pluginsEnabled() || userId == null || !(await this.isActive(id)))
      return { configured: false, connected: false };
    return await this.oauth.status(id, userId);
  }

  @Post(':id/connect')
  async connect(
    @Param('id') id: string,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ authorizeUrl: string }> {
    const userId = req.user?.id;
    if (!pluginsEnabled() || userId == null || !(await this.isActive(id))) throw new Error('plugin not available');
    return { authorizeUrl: await this.oauth.startConnect(id, userId, Date.now()) };
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
    if (!pluginsEnabled() || userId == null || !(await this.isActive(id))) return back('unavailable');
    if (error || !code || !state) return back('denied');
    try {
      await this.oauth.completeCallback(id, userId, code, state, Date.now());
      return back('connected');
    } catch {
      return back('failed');
    }
  }

  @Post(':id/disconnect')
  async disconnect(
    @Param('id') id: string,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ connected: false }> {
    const userId = req.user?.id;
    if (userId != null) await this.oauth.disconnect(id, userId);
    return { connected: false };
  }
}
