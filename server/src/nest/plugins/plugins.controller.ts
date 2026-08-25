import { Body, Controller, Delete, Get, HttpCode, HttpException, Param, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { PluginsService } from './plugins.service';
import { PluginRuntimeService, PluginConsentRequired, PluginDependencyError } from './plugin-runtime.service';
import { DependencyCycleError } from './dependencies';
import { PluginRegistryService, RegistryError } from './registry/registry.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { getClientIp } from '../audit/client-ip';
import { pluginsEnabled } from './kill-switch';
import { devLinkEnabled } from './dev-link';
import { PluginActivateDto, PluginConfigDto, PluginEgressHostsDto, PluginInstallDto, PluginLinkDto, PluginRetrustDto, PluginUninstallDto, PluginUpdateDto } from './plugins.dto';
import { ManagedForbidden, isManagedBlocked, MANAGED_FORBIDDEN_ERROR } from '../common/managed';
import { RuntimeEnvService } from '../app-config/runtime-env.service';

/**
 * Flatten a registry/install failure into the error envelope — CARRYING THE CODE.
 *
 * The code is the whole point: the admin UI offers the re-trust override only for
 * SIGNATURE_KEY_CHANGED, and it must read that from a field, not by string-matching the
 * message. Drop the code here and the client is left guessing from prose, which sooner
 * or later means offering "re-trust" on a signature that simply doesn't verify.
 * TrekExceptionFilter passes a `{ error, code }` body through verbatim.
 *
 * A missing plugin is a 404, not a 400 — the request was well-formed, the thing just
 * isn't there. Only `assertRetrustable` raises NOT_FOUND, so this is scoped to /retrust:
 * install's "not in registry" carries no code and update throws a plain Error, and both
 * keep their existing 400.
 */
function registryFailure(e: unknown, fallback: string): HttpException {
  const code = e instanceof RegistryError ? e.code : undefined;
  const error = e instanceof Error ? e.message : fallback;
  return new HttpException(code ? { error, code } : { error }, code === 'NOT_FOUND' ? 404 : 400);
}

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
    private readonly env: RuntimeEnvService,
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
  async install(@Body() body: PluginInstallDto) {
    if (!pluginsEnabled()) throw new HttpException({ error: 'Plugins are disabled by server configuration' }, 503);
    if (!body?.id) throw new HttpException({ error: 'id is required' }, 400);
    try {
      // withDependencies (used by the "resolve missing dependency" admin flow) pulls
      // the target + its transitive plugin deps, resolving each to its latest
      // compatible version and reporting addons the admin still has to enable.
      // Dependency resolution pins versions internally but never DELIBERATELY, so
      // only the plain path below recomputes the update hold.
      if (body.withDependencies) return await this.registry.installWithDependencies(body.id, body.constraint);
      const res = await this.registry.install(body.id, { version: body.version, constraint: body.constraint });
      await this.registry.recomputeUpdateHold(res.id, res.version, !!body.version);
      return res;
    } catch (e) {
      throw registryFailure(e, 'install failed');
    }
  }

  /** Sideload a plugin from an uploaded .zip/.tar.gz (registers INACTIVE). */
  @ManagedForbidden(
    'a sideloaded archive skips the signature check every registry install performs',
    { enforcedInHandler: true },
  )
  @Post('upload')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 + 4096 } }))
  async upload(@UploadedFile() file?: Express.Multer.File) {
    // In the handler, not the guard: guards run before the multipart parser and
    // the client would get an ECONNRESET rather than this 403 (PROFILE-015).
    if (isManagedBlocked(this.env)) {
      throw new HttpException(MANAGED_FORBIDDEN_ERROR, 403);
    }
    if (!pluginsEnabled()) throw new HttpException({ error: 'Plugins are disabled by server configuration' }, 503);
    if (!file?.buffer?.length) throw new HttpException({ error: 'no file uploaded' }, 400);
    try {
      return await this.runtime.sideload(file.buffer);
    } catch (e) {
      throw registryFailure(e, 'upload failed'); // carries TREK_VERSION_INCOMPATIBLE
    }
  }

  /**
   * DEV-ONLY: register a plugin from a LOCAL built directory and hot-reload it
   * against real data. Gated by TREK_PLUGINS_DEV_LINK on top of admin + kill-switch.
   */
  @ManagedForbidden('a linked directory skips the signature check the registry install performs')
  @Post('link')
  @HttpCode(200)
  async link(@Body() body: PluginLinkDto) {
    if (!pluginsEnabled()) throw new HttpException({ error: 'Plugins are disabled by server configuration' }, 503);
    if (!devLinkEnabled()) throw new HttpException({ error: 'Dev-link is disabled (set TREK_PLUGINS_DEV_LINK=1)' }, 403);
    const dir = body?.path?.trim();
    if (!dir) throw new HttpException({ error: 'path is required' }, 400);
    try {
      return await this.runtime.link(dir);
    } catch (e) {
      throw registryFailure(e, 'link failed'); // carries TREK_VERSION_INCOMPATIBLE
    }
  }

  @Get(':id/config')
  getConfig(@Param('id') id: string) {
    return { config: this.plugins.getInstanceConfig(id) };
  }

  @Put(':id/config')
  updateConfig(@Param('id') id: string, @Body() body: PluginConfigDto) {
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
  async setEgressHosts(@Param('id') id: string, @Body() body: PluginEgressHostsDto) {
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
  async activate(@Param('id') id: string, @Body() body: PluginActivateDto) {
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
  @ManagedForbidden('reloading from disk reintroduces whatever a sideload put there')
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
  async update(@Param('id') id: string, @Body() body?: PluginUpdateDto) {
    if (!pluginsEnabled()) throw new HttpException({ error: 'Plugins are disabled by server configuration' }, 503);
    try {
      // An explicit version is the rollback path: install exactly what the admin picked
      // (the TREK-compat gate still refuses in selectVersion). Absent, the runtime
      // resolves the newest compatible version itself.
      const res = await this.runtime.update(id, { version: body?.version });
      // A deliberate non-latest pick holds future updates; landing on the newest
      // (any path) releases a stale hold. Only after success — a failed update
      // changed nothing and must not touch the flag.
      await this.registry.recomputeUpdateHold(id, res.version, !!body?.version);
      return res;
    } catch (e) {
      throw registryFailure(e, 'update failed');
    }
  }

  /** Release a per-plugin update hold (set by a deliberate non-latest install). */
  @Post(':id/resume-updates')
  @HttpCode(200)
  resumeUpdates(@Param('id') id: string) {
    if (!this.plugins.resumeUpdates(id)) throw new HttpException({ error: `plugin ${id} not found` }, 404);
    return { updateHold: false };
  }

  /**
   * Re-trust a plugin whose author signing key ROTATED, and update it in the same call.
   *
   * This is the ONLY override of a signature refusal that exists, and it exists only for
   * a changed key: a rotation has a benign explanation, a signature that doesn't verify
   * does not. The scoping is enforced in the service (`assertRetrustable`), not by this
   * route and not by the UI — calling this directly on a plugin with an INVALID signature
   * is refused.
   *
   * `publicKey` is the full key the admin was SHOWN, echoed back so the server can refuse
   * if the registry entry has been re-keyed again since the dialog rendered.
   */
  @Post(':id/retrust')
  @HttpCode(200)
  async retrust(
    @Param('id') id: string,
    @Body() body: PluginRetrustDto,
    @CurrentUser() user: { id: number },
    @Req() req: Request,
  ) {
    if (!pluginsEnabled()) throw new HttpException({ error: 'Plugins are disabled by server configuration' }, 503);
    if (!body?.version) throw new HttpException({ error: 'version is required' }, 400);
    if (!body?.publicKey) throw new HttpException({ error: 'publicKey is required' }, 400);
    try {
      return await this.runtime.retrust(id, body.version, body.publicKey, { userId: user?.id ?? null, ip: getClientIp(req) });
    } catch (e) {
      throw registryFailure(e, 'retrust failed');
    }
  }

  @Post(':id/uninstall')
  @HttpCode(200)
  async uninstall(@Param('id') id: string, @Body() body: PluginUninstallDto) {
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
