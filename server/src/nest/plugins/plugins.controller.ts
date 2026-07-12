import { Body, Controller, Delete, Get, HttpCode, HttpException, Param, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PluginsService } from './plugins.service';
import { PluginRuntimeService, PluginConsentRequired, PluginDependencyError } from './plugin-runtime.service';
import { DependencyCycleError } from './dependencies';
import { PluginRegistryService } from './registry/registry.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { pluginsEnabled } from './kill-switch';
import { devLinkEnabled } from './dev-link';

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
  browse(@Query('refresh') refresh?: string) {
    return this.registry.browse(refresh === '1' || refresh === 'true');
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
  async install(@Body() body: { id?: string; version?: string; constraint?: string; withDependencies?: boolean }) {
    if (!pluginsEnabled()) throw new HttpException({ error: 'Plugins are disabled by server configuration' }, 503);
    if (!body?.id) throw new HttpException({ error: 'id is required' }, 400);
    try {
      // withDependencies (used by the "resolve missing dependency" admin flow) pulls
      // the target + its transitive plugin deps, resolving each to its latest
      // compatible version and reporting addons the admin still has to enable.
      if (body.withDependencies) return await this.registry.installWithDependencies(body.id, body.constraint);
      return await this.registry.install(body.id, { version: body.version, constraint: body.constraint });
    } catch (e) {
      throw new HttpException({ error: e instanceof Error ? e.message : 'install failed' }, 400);
    }
  }

  /** Sideload a plugin from an uploaded .zip/.tar.gz (registers INACTIVE). */
  @Post('upload')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 + 4096 } }))
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!pluginsEnabled()) throw new HttpException({ error: 'Plugins are disabled by server configuration' }, 503);
    if (!file?.buffer?.length) throw new HttpException({ error: 'no file uploaded' }, 400);
    try {
      return await this.runtime.sideload(file.buffer);
    } catch (e) {
      throw new HttpException({ error: e instanceof Error ? e.message : 'upload failed' }, 400);
    }
  }

  /**
   * DEV-ONLY: register a plugin from a LOCAL built directory and hot-reload it
   * against real data. Gated by TREK_PLUGINS_DEV_LINK on top of admin + kill-switch.
   */
  @Post('link')
  @HttpCode(200)
  async link(@Body() body: { path?: string }) {
    if (!pluginsEnabled()) throw new HttpException({ error: 'Plugins are disabled by server configuration' }, 503);
    if (!devLinkEnabled()) throw new HttpException({ error: 'Dev-link is disabled (set TREK_PLUGINS_DEV_LINK=1)' }, 403);
    const dir = body?.path?.trim();
    if (!dir) throw new HttpException({ error: 'path is required' }, 400);
    try {
      return await this.runtime.link(dir);
    } catch (e) {
      throw new HttpException({ error: e instanceof Error ? e.message : 'link failed' }, 400);
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

  /**
   * Operator-supplied egress hosts. A plugin that talks to a SELF-HOSTED service can't
   * name the operator's hostname in its manifest, so an admin adds it here — and the
   * runtime re-spawns the plugin with the widened allow-list. Admin-only (this controller
   * is admin-guarded): an end user can never widen a plugin's egress.
   */
  @Get(':id/egress-hosts')
  egressHosts(@Param('id') id: string) {
    return { supported: this.runtime.wantsOperatorEgress(id), hosts: this.runtime.operatorEgressHosts(id) };
  }

  @Put(':id/egress-hosts')
  async setEgressHosts(@Param('id') id: string, @Body() body: { hosts?: unknown } = {}) {
    if (!pluginsEnabled()) throw new HttpException({ error: 'Plugins are disabled by server configuration' }, 503);
    const hosts = Array.isArray(body.hosts) ? body.hosts.map(String) : [];
    try {
      return { hosts: await this.runtime.setOperatorEgressHosts(id, hosts) };
    } catch (e) {
      throw new HttpException({ error: e instanceof Error ? e.message : 'Invalid hosts' }, 400);
    }
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
      // Unmet dependency (disabled addon / missing / version-mismatched plugin) —
      // the UI offers the right fix (enable addon, or download the dependency).
      if (e instanceof PluginDependencyError) {
        throw new HttpException({ error: e.message, code: e.code, ...e.detail }, 409);
      }
      if (e instanceof DependencyCycleError) {
        throw new HttpException({ error: e.message, code: 'DEPENDENCY_CYCLE', cyclePath: e.cyclePath }, 409);
      }
      throw new HttpException({ error: e instanceof Error ? e.message : 'activation failed' }, 400);
    }
    return { status: this.runtime.isActive(id) ? 'active' : 'error' };
  }

  @Post(':id/deactivate')
  @HttpCode(200)
  async deactivate(@Param('id') id: string) {
    // Cascade: disabling a plugin also disables everything that depends on it (a
    // dependent can't run without its dependency). The client refresh reflects it.
    await this.runtime.deactivateWithDependents(id);
    return { status: 'inactive' };
  }

  /** DEV-ONLY: re-fork a dev-linked plugin so it picks up rebuilt code. */
  @Post(':id/reload')
  @HttpCode(200)
  async reload(@Param('id') id: string) {
    if (!pluginsEnabled()) throw new HttpException({ error: 'Plugins are disabled by server configuration' }, 503);
    if (!devLinkEnabled()) throw new HttpException({ error: 'Dev-link is disabled (set TREK_PLUGINS_DEV_LINK=1)' }, 403);
    try {
      await this.runtime.reload(id);
    } catch (e) {
      // A rebuilt manifest that widened permissions must still re-consent, exactly
      // like activate — surface the same codes so the admin UI reacts identically.
      if (e instanceof PluginConsentRequired) {
        throw new HttpException({ error: e.message, code: 'CONSENT_REQUIRED', newPermissions: e.newPermissions, newEgress: e.newEgress }, 409);
      }
      if (e instanceof PluginDependencyError) {
        throw new HttpException({ error: e.message, code: e.code, ...e.detail }, 409);
      }
      throw new HttpException({ error: e instanceof Error ? e.message : 'reload failed' }, 400);
    }
    return { status: this.runtime.isActive(id) ? 'active' : 'inactive' };
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

  @Get(':id/budget')
  budget(@Param('id') id: string) {
    return { budget: this.plugins.budget(id) };
  }

  /** GDPR portability: aggregate everything the installed plugins hold about one
   * user, for an admin fulfilling a data-access request. Literal-prefixed path, so it
   * never collides with the :id routes. */
  @Get('user-data/:userId/export')
  async exportUserData(@Param('userId') userId: string) {
    const id = Number(userId);
    if (!Number.isInteger(id) || id <= 0) throw new HttpException({ error: 'invalid user id' }, 400);
    return { userId: id, plugins: await this.runtime.exportUserData(id) };
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
