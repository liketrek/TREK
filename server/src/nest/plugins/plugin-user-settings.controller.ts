import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pluginsEnabled } from './kill-switch';
import { PluginsService } from './plugins.service';
import { db } from '../../db/database';

/**
 * GET/POST /api/plugin-settings/:id — a USER's own `scope:'user'` settings for a
 * plugin (#plugins). Deliberately its own path (not under the admin surface, not
 * under the `/api/plugins/:id/*` proxy) and gated by JwtAuthGuard only: every user
 * manages their OWN config here — an API key, a personal preference — separate from
 * the admin-owned instance config.
 *
 * Secrets are stored encrypted and NEVER echoed back (masked); the write only accepts
 * keys the plugin declared as `scope:'user'` fields. The plugin reads the acting
 * user's value at runtime via `ctx.settings.get(key)`.
 */
@Controller('api/plugin-settings')
@UseGuards(JwtAuthGuard)
export class PluginUserSettingsController {
  constructor(private readonly plugins: PluginsService) {}

  private activeWithUserFields(id: string): boolean {
    const row = db.prepare("SELECT 1 FROM plugins WHERE id = ? AND status = 'active'").get(id);
    return !!row;
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() req: Request & { user?: { id: number } }): { fields: unknown[]; config: Record<string, unknown> } {
    const userId = req.user?.id;
    if (!pluginsEnabled() || userId == null || !this.activeWithUserFields(id)) return { fields: [], config: {} };
    return { fields: this.plugins.userSettingsFields(id), config: this.plugins.getUserConfig(id, userId) };
  }

  @Post(':id')
  update(
    @Param('id') id: string,
    @Body() body: { config?: Record<string, unknown> },
    @Req() req: Request & { user?: { id: number } },
  ): { config: Record<string, unknown> } {
    const userId = req.user?.id;
    if (!pluginsEnabled() || userId == null || !this.activeWithUserFields(id)) return { config: {} };
    const patch = body?.config && typeof body.config === 'object' ? body.config : {};
    return { config: this.plugins.updateUserConfig(id, userId, patch) };
  }
}
