import { Body, Controller, Delete, Get, HttpCode, HttpException, Param, Post, Put, UseGuards } from '@nestjs/common';
import { PluginsService } from './plugins.service';
import { PluginRuntimeService, PluginConsentRequired } from './plugin-runtime.service';
import { PluginRegistryService } from './registry/registry.service';
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
    private readonly registry: PluginRegistryService,
  ) {}

  @Get()
  list() {
    return this.plugins.list();
  }

  @Get('registry')
  browse() {
    return this.registry.browse();
  }

  @Get('registry/:id')
  async registryDetail(@Param('id') id: string) {
    try {
      return await this.registry.detail(id);
    } catch (e) {
      throw new HttpException({ error: e instanceof Error ? e.message : 'not found' }, 404);
    }
  }

  @Post('install')
  @HttpCode(200)
  async install(@Body() body: { id?: string; version?: string }) {
    if (!pluginsEnabled()) throw new HttpException({ error: 'Plugins are disabled by server configuration' }, 503);
    if (!body?.id) throw new HttpException({ error: 'id is required' }, 400);
    try {
      return await this.registry.install(body.id, body.version);
    } catch (e) {
      throw new HttpException({ error: e instanceof Error ? e.message : 'install failed' }, 400);
    }
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
  async activate(@Param('id') id: string, @Body() body: { consent?: boolean } = {}) {
    if (!pluginsEnabled()) throw new HttpException({ error: 'Plugins are disabled by server configuration' }, 503);
    try {
      await this.runtime.activate(id, !!body?.consent);
    } catch (e) {
      // Re-enabling a plugin whose update widened its permissions must NOT grant
      // them silently — surface a distinct code so the UI opens the consent dialog.
      if (e instanceof PluginConsentRequired) {
        throw new HttpException({ error: e.message, code: 'CONSENT_REQUIRED', newPermissions: e.newPermissions, newEgress: e.newEgress }, 409);
      }
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

  @Post(':id/update')
  @HttpCode(200)
  async update(@Param('id') id: string) {
    if (!pluginsEnabled()) throw new HttpException({ error: 'Plugins are disabled by server configuration' }, 503);
    try {
      return await this.runtime.update(id);
    } catch (e) {
      throw new HttpException({ error: e instanceof Error ? e.message : 'update failed' }, 400);
    }
  }

  @Post(':id/uninstall')
  @HttpCode(200)
  async uninstall(@Param('id') id: string, @Body() body: { deleteData?: boolean }) {
    await this.runtime.uninstall(id, !!body?.deleteData);
    return { status: 'uninstalled' };
  }

  @Get(':id/errors')
  errors(@Param('id') id: string) {
    return { errors: this.plugins.errors(id) };
  }

  @Get(':id/audit')
  audit(@Param('id') id: string) {
    return { audit: this.plugins.auditLog(id) };
  }

  @Delete(':id/errors')
  clearErrors(@Param('id') id: string) {
    this.plugins.clearErrors(id);
    return { ok: true };
  }

  @Post('rescan')
  @HttpCode(200)
  rescan() {
    if (!pluginsEnabled()) throw new HttpException({ error: 'Plugins are disabled by server configuration' }, 503);
    return this.runtime.rescan();
  }
}
