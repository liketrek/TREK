import { Body, Controller, Get, HttpCode, HttpException, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pluginsEnabled } from './kill-switch';
import { PluginsService } from './plugins.service';
import { PluginRuntimeService } from './plugin-runtime.service';
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
  constructor(
    private readonly plugins: PluginsService,
    private readonly runtime: PluginRuntimeService,
  ) {}

  private activeWithUserFields(id: string): boolean {
    const row = db.prepare("SELECT 1 FROM plugins WHERE id = ? AND status = 'active'").get(id);
    return !!row;
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() req: Request & { user?: { id: number } }): {
    fields: unknown[];
    config: Record<string, unknown>;
    actions: Array<{ key: string; label: string; hint?: string; danger: boolean }>;
  } {
    const userId = req.user?.id;
    if (!pluginsEnabled() || userId == null || !this.activeWithUserFields(id)) return { fields: [], config: {}, actions: [] };
    return {
      fields: this.plugins.userSettingsFields(id),
      config: this.plugins.getUserConfig(id, userId),
      actions: this.runtime.actionsOf(id),
    };
  }

  /**
   * Run one of the plugin's declared settings-page actions ("Test connection").
   * USER-INITIATED: the acting user is the caller, bound host-side — so the action reads
   * the CALLER's own settings and any trip read it makes is checked against them. It can
   * never act as anyone else, and a key the plugin didn't declare is refused.
   */
  @Post(':id/actions/:key')
  @HttpCode(200)
  async runAction(
    @Param('id') id: string,
    @Param('key') key: string,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ ok: boolean; message?: string }> {
    const userId = req.user?.id;
    if (!pluginsEnabled() || userId == null || !this.activeWithUserFields(id)) {
      throw new HttpException({ error: 'Plugin is not active' }, 404);
    }
    try {
      return await this.runtime.invokeAction(id, key, userId);
    } catch (e) {
      // A failing action is a RESULT, not a server error — show the user why.
      return { ok: false, message: (e instanceof Error ? e.message : 'Action failed').slice(0, 200) };
    }
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
