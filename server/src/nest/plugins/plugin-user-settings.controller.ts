import { Plugins } from '../../db/entities/Plugins.entity';
import type { PluginsRepository } from '../../db/repositories/Plugins.repository';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pluginsEnabled } from './kill-switch';
import { PluginRuntimeService } from './plugin-runtime.service';
import { PluginUserSettingsUpdateDto } from './plugins.dto';
import { PluginsService, MissingRequiredSettingError } from './plugins.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Body, Controller, Get, HttpCode, HttpException, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { PluginActionDescriptor, PluginActionResult } from '@trek/shared';

import type { Request } from 'express';

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
    // PUC1 (Plan 3j Task 5) — shared with oauth/plugin-oauth.controller.ts's isActive.
    @InjectRepository(Plugins) private readonly pluginsRepo: PluginsRepository,
  ) {}

  private async activeWithUserFields(id: string): Promise<boolean> {
    return await this.pluginsRepo.existsActive(id);
  }

  @Get(':id')
  async get(
    @Param('id') id: string,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{
    fields: unknown[];
    config: Record<string, unknown>;
    actions: PluginActionDescriptor[];
  }> {
    const userId = req.user?.id;
    if (!pluginsEnabled() || userId == null || !(await this.activeWithUserFields(id)))
      return { fields: [], config: {}, actions: [] };
    return {
      fields: await this.plugins.userSettingsFields(id),
      config: await this.plugins.getUserConfig(id, userId),
      actions: await this.runtime.actionsOf(id, 'user'),
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
  ): Promise<PluginActionResult> {
    const userId = req.user?.id;
    if (!pluginsEnabled() || userId == null || !(await this.activeWithUserFields(id))) {
      throw new HttpException({ error: 'Plugin is not active' }, 404);
    }
    try {
      return await this.runtime.invokeAction(id, key, userId, 'user');
    } catch (e) {
      // A failing action is a RESULT, not a server error — show the user why.
      return { ok: false, message: (e instanceof Error ? e.message : 'Action failed').slice(0, 200) };
    }
  }

  @Post(':id')
  async update(
    @Param('id') id: string,
    @Body() body: PluginUserSettingsUpdateDto,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ config: Record<string, unknown> }> {
    const userId = req.user?.id;
    if (!pluginsEnabled() || userId == null || !(await this.activeWithUserFields(id))) return { config: {} };
    const patch = body?.config && typeof body.config === 'object' ? (body.config as Record<string, unknown>) : {};
    try {
      return { config: await this.plugins.updateUserConfig(id, userId, patch) };
    } catch (e) {
      if (e instanceof MissingRequiredSettingError) throw new HttpException({ error: e.message }, 400);
      throw e;
    }
  }
}
