import { Body, Controller, Get, HttpCode, HttpException, Param, Post, Put, UseGuards } from '@nestjs/common';
import { PluginsService } from './plugins.service';
import { PluginRuntimeService } from './plugin-runtime.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { pluginsEnabled } from './kill-switch';

/**
 * /api/admin/plugins — admin-only plugin control surface (#plugins).
 *
 * M0: read-only listing + the runtime-enabled flag.
 * M2: activate / deactivate (spawns/kills the isolated child) + instance config.
 * Admin-gated like the rest of /api/admin. The proxy namespace /api/plugins/:id
 * is a separate controller.
 */
@Controller('api/admin/plugins')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PluginsController {
  constructor(
    private readonly plugins: PluginsService,
    private readonly runtime: PluginRuntimeService,
  ) {}

  @Get()
  list() {
    return this.plugins.list();
  }

  @Get(':id/config')
  getConfig(@Param('id') id: string) {
    return { config: this.plugins.getInstanceConfig(id) };
  }

  @Put(':id/config')
  updateConfig(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return { config: this.plugins.updateInstanceConfig(id, body || {}) };
  }

  @Post(':id/activate')
  @HttpCode(200)
  async activate(@Param('id') id: string) {
    if (!pluginsEnabled()) throw new HttpException({ error: 'Plugins are disabled by server configuration' }, 503);
    try {
      await this.runtime.activate(id);
    } catch (e) {
      throw new HttpException({ error: e instanceof Error ? e.message : 'activation failed' }, 400);
    }
    return { status: this.runtime.isActive(id) ? 'active' : 'error' };
  }

  @Post(':id/deactivate')
  @HttpCode(200)
  async deactivate(@Param('id') id: string) {
    await this.runtime.deactivate(id);
    return { status: 'inactive' };
  }
}
