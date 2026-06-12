import { Body, Controller, Delete, Get, HttpCode, HttpException, NotFoundException, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { writeAudit, getClientIp, logInfo } from '../../services/auditLog';
import { send as sendNotification } from '../../services/notificationService';
import type { User } from '../../types';

/** Throw the legacy {error,status} envelope when a service call reports failure. */
function ok<T>(result: T): Exclude<T, { error: string }> {
  if (result && typeof result === 'object' && 'error' in (result as Record<string, unknown>)) {
    const r = result as unknown as { error: string; status?: number };
    throw new HttpException({ error: r.error }, r.status ?? 400);
  }
  return result as Exclude<T, { error: string }>;
}

/**
 * /api/admin — admin-only control surface (users, stats, permissions, audit log,
 * OIDC settings, invites, feature toggles, packing templates, addons, MCP/OAuth
 * sessions, JWT rotation, default user settings).
 *
 * Byte-identical to the legacy Express route (server/src/routes/admin.ts):
 * admin-gated, the {error,status} envelopes, the audit-log writes, the MCP
 * session invalidation on addon/collab changes, create-201 vs the rest 200, and
 * the dev-only test-notification endpoint (404 outside development).
 */
@Controller('api/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // ── Users ──
  @Get('users')
  listUsers() { return { users: this.admin.listUsers() }; }

  @Post('users')
  @HttpCode(201)
  createUser(@CurrentUser() user: User, @Body() body: unknown, @Req() req: Request) {
    const result = ok(this.admin.createUser(body));
    writeAudit({ userId: user.id, action: 'admin.user_create', resource: String(result.insertedId), ip: getClientIp(req), details: result.auditDetails });
    return { user: result.user };
  }

  @Put('users/:id')
  updateUser(@CurrentUser() user: User, @Param('id') id: string, @Body() body: unknown, @Req() req: Request) {
    const result = ok(this.admin.updateUser(id, body));
    writeAudit({ userId: user.id, action: 'admin.user_update', resource: String(id), ip: getClientIp(req), details: { targetUser: result.previousEmail, fields: result.changed } });
    logInfo(`Admin ${user.email} edited user ${result.previousEmail} (fields: ${result.changed.join(', ')})`);
    return { user: result.user };
  }

  @Delete('users/:id')
  deleteUser(@CurrentUser() user: User, @Param('id') id: string, @Req() req: Request) {
    const result = ok(this.admin.deleteUser(id, user.id));
    writeAudit({ userId: user.id, action: 'admin.user_delete', resource: String(id), ip: getClientIp(req), details: { targetUser: result.email } });
    logInfo(`Admin ${user.email} deleted user ${result.email}`);
    return { success: true };
  }

  @Delete('users/:id/passkeys')
  resetUserPasskeys(@CurrentUser() user: User, @Param('id') id: string, @Req() req: Request) {
    const result = ok(this.admin.resetUserPasskeys(id));
    writeAudit({ userId: user.id, action: 'admin.user_passkeys_reset', resource: String(id), ip: getClientIp(req), details: { targetUser: result.email, deleted: result.deleted } });
    return { success: true, deleted: result.deleted };
  }

  // ── Stats / permissions / audit ──
  @Get('stats')
  stats() { return this.admin.getStats(); }

  @Get('permissions')
  permissions() { return this.admin.getPermissions(); }

  @Put('permissions')
  savePermissions(@CurrentUser() user: User, @Body() body: { permissions?: unknown }, @Req() req: Request) {
    if (!body.permissions || typeof body.permissions !== 'object') {
      throw new HttpException({ error: 'permissions object required' }, 400);
    }
    const result = this.admin.savePermissions(body.permissions as unknown as Parameters<AdminService['savePermissions']>[0]);
    writeAudit({ userId: user.id, action: 'admin.permissions_update', resource: 'permissions', ip: getClientIp(req), details: body.permissions as Record<string, unknown> });
    return { success: true, permissions: result.permissions, ...(result.skipped.length ? { skipped: result.skipped } : {}) };
  }

  @Get('audit-log')
  auditLog(@Query() query: { limit?: string; offset?: string }) { return this.admin.getAuditLog(query); }

  // ── OIDC ──
  @Get('oidc')
  getOidc() { return this.admin.getOidcSettings(); }

  @Put('oidc')
  updateOidc(@CurrentUser() user: User, @Body() body: { issuer?: string } & Record<string, unknown>, @Req() req: Request) {
    const result = this.admin.updateOidcSettings(body);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status || 400);
    }
    writeAudit({ userId: user.id, action: 'admin.oidc_update', ip: getClientIp(req), details: { issuer_set: !!body.issuer } });
    return { success: true };
  }

  @Post('save-demo-baseline')
  @HttpCode(200)
  saveDemoBaseline(@CurrentUser() user: User, @Req() req: Request) {
    const result = this.admin.saveDemoBaseline();
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    writeAudit({ userId: user.id, action: 'admin.demo_baseline_save', ip: getClientIp(req) });
    return { success: true, message: result.message };
  }

  // ── GitHub / version ──
  @Get('github-releases')
  async githubReleases(@Query('per_page') perPage = '10', @Query('page') page = '1') {
    return this.admin.getGithubReleases(String(perPage), String(page));
  }

  @Get('version-check')
  async versionCheck() { return this.admin.checkVersion(); }

  // ── Admin notification preferences ──
  @Get('notification-preferences')
  getNotificationPrefs(@CurrentUser() user: User) { return this.admin.getPreferencesMatrix(user.id, user.role); }

  @Put('notification-preferences')
  setNotificationPrefs(@CurrentUser() user: User, @Body() body: unknown) {
    this.admin.setAdminPreferences(user.id, body);
    return this.admin.getPreferencesMatrix(user.id, user.role);
  }

  // ── Invites ──
  @Get('invites')
  listInvites() { return { invites: this.admin.listInvites() }; }

  @Post('invites')
  @HttpCode(201)
  createInvite(@CurrentUser() user: User, @Body() body: unknown, @Req() req: Request) {
    const result = this.admin.createInvite(user.id, body);
    writeAudit({ userId: user.id, action: 'admin.invite_create', resource: String(result.inviteId), ip: getClientIp(req), details: { max_uses: result.uses, expires_in_days: result.expiresInDays } });
    return { invite: result.invite };
  }

  @Delete('invites/:id')
  deleteInvite(@CurrentUser() user: User, @Param('id') id: string, @Req() req: Request) {
    ok(this.admin.deleteInvite(id));
    writeAudit({ userId: user.id, action: 'admin.invite_delete', resource: String(id), ip: getClientIp(req) });
    return { success: true };
  }

  // ── Feature toggles ──
  @Get('bag-tracking')
  getBagTracking() { return this.admin.getBagTracking(); }

  @Put('bag-tracking')
  updateBagTracking(@CurrentUser() user: User, @Body() body: { enabled?: unknown }, @Req() req: Request) {
    const result = this.admin.updateBagTracking(body.enabled);
    writeAudit({ userId: user.id, action: 'admin.bag_tracking', ip: getClientIp(req), details: { enabled: result.enabled } });
    return result;
  }

  @Get('places-photos')
  getPlacesPhotos() { return this.admin.getPlacesPhotos(); }

  @Put('places-photos')
  updatePlacesPhotos(@CurrentUser() user: User, @Body() body: { enabled?: unknown }, @Req() req: Request) {
    if (typeof body.enabled !== 'boolean') throw new HttpException({ error: 'enabled must be a boolean' }, 400);
    const result = this.admin.updatePlacesPhotos(body.enabled);
    writeAudit({ userId: user.id, action: 'admin.places_photos', ip: getClientIp(req), details: { enabled: result.enabled } });
    return result;
  }

  @Get('places-autocomplete')
  getPlacesAutocomplete() { return this.admin.getPlacesAutocomplete(); }

  @Put('places-autocomplete')
  updatePlacesAutocomplete(@CurrentUser() user: User, @Body() body: { enabled?: unknown }, @Req() req: Request) {
    if (typeof body.enabled !== 'boolean') throw new HttpException({ error: 'enabled must be a boolean' }, 400);
    const result = this.admin.updatePlacesAutocomplete(body.enabled);
    writeAudit({ userId: user.id, action: 'admin.places_autocomplete', ip: getClientIp(req), details: { enabled: result.enabled } });
    return result;
  }

  @Get('places-details')
  getPlacesDetails() { return this.admin.getPlacesDetails(); }

  @Put('places-details')
  updatePlacesDetails(@CurrentUser() user: User, @Body() body: { enabled?: unknown }, @Req() req: Request) {
    if (typeof body.enabled !== 'boolean') throw new HttpException({ error: 'enabled must be a boolean' }, 400);
    const result = this.admin.updatePlacesDetails(body.enabled);
    writeAudit({ userId: user.id, action: 'admin.places_details', ip: getClientIp(req), details: { enabled: result.enabled } });
    return result;
  }

  @Get('collab-features')
  getCollabFeatures() { return this.admin.getCollabFeatures(); }

  @Put('collab-features')
  updateCollabFeatures(@CurrentUser() user: User, @Body() body: unknown, @Req() req: Request) {
    const result = this.admin.updateCollabFeatures(body);
    this.admin.invalidateMcpSessions();
    writeAudit({ userId: user.id, action: 'admin.collab_features', ip: getClientIp(req), details: result });
    return result;
  }

  // ── Packing templates ──
  @Get('packing-templates')
  listPackingTemplates() { return { templates: this.admin.listPackingTemplates() }; }

  @Get('packing-templates/:id')
  getPackingTemplate(@Param('id') id: string) { return ok(this.admin.getPackingTemplate(id)); }

  @Post('packing-templates')
  @HttpCode(201)
  createPackingTemplate(@CurrentUser() user: User, @Body() body: { name?: unknown }) {
    return ok(this.admin.createPackingTemplate(body.name, user.id));
  }

  @Put('packing-templates/:id')
  updatePackingTemplate(@Param('id') id: string, @Body() body: unknown) { return ok(this.admin.updatePackingTemplate(id, body)); }

  @Delete('packing-templates/:id')
  deletePackingTemplate(@CurrentUser() user: User, @Param('id') id: string, @Req() req: Request) {
    const result = ok(this.admin.deletePackingTemplate(id));
    writeAudit({ userId: user.id, action: 'admin.packing_template_delete', resource: String(id), ip: getClientIp(req), details: { name: result.name } });
    return { success: true };
  }

  @Post('packing-templates/:id/categories')
  @HttpCode(201)
  createTemplateCategory(@Param('id') id: string, @Body() body: { name?: unknown }) {
    return ok(this.admin.createTemplateCategory(id, body.name));
  }

  @Put('packing-templates/:templateId/categories/:catId')
  updateTemplateCategory(@Param('templateId') templateId: string, @Param('catId') catId: string, @Body() body: unknown) {
    return ok(this.admin.updateTemplateCategory(templateId, catId, body));
  }

  @Delete('packing-templates/:templateId/categories/:catId')
  deleteTemplateCategory(@Param('templateId') templateId: string, @Param('catId') catId: string) {
    ok(this.admin.deleteTemplateCategory(templateId, catId));
    return { success: true };
  }

  @Post('packing-templates/:templateId/categories/:catId/items')
  @HttpCode(201)
  createTemplateItem(@Param('templateId') templateId: string, @Param('catId') catId: string, @Body() body: { name?: unknown }) {
    return ok(this.admin.createTemplateItem(templateId, catId, body.name));
  }

  @Put('packing-templates/:templateId/items/:itemId')
  updateTemplateItem(@Param('itemId') itemId: string, @Body() body: unknown) { return ok(this.admin.updateTemplateItem(itemId, body)); }

  @Delete('packing-templates/:templateId/items/:itemId')
  deleteTemplateItem(@Param('itemId') itemId: string) {
    ok(this.admin.deleteTemplateItem(itemId));
    return { success: true };
  }

  // ── Addons ──
  @Get('addons')
  listAddons() { return { addons: this.admin.listAddons() }; }

  @Put('addons/:id')
  updateAddon(@CurrentUser() user: User, @Param('id') id: string, @Body() body: unknown, @Req() req: Request) {
    const result = ok(this.admin.updateAddon(id, body));
    writeAudit({ userId: user.id, action: 'admin.addon_update', resource: String(id), ip: getClientIp(req), details: result.auditDetails });
    this.admin.invalidateMcpSessions();
    return { addon: result.addon };
  }

  // ── MCP tokens / OAuth sessions ──
  @Get('mcp-tokens')
  listMcpTokens() { return { tokens: this.admin.listMcpTokens() }; }

  @Delete('mcp-tokens/:id')
  deleteMcpToken(@Param('id') id: string) {
    ok(this.admin.deleteMcpToken(id));
    return { success: true };
  }

  @Get('oauth-sessions')
  listOAuthSessions() { return { sessions: this.admin.listOAuthSessions() }; }

  @Delete('oauth-sessions/:id')
  revokeOAuthSession(@CurrentUser() user: User, @Param('id') id: string, @Req() req: Request) {
    ok(this.admin.revokeOAuthSession(id));
    writeAudit({ userId: user.id, action: 'admin.oauth_session.revoke', resource: String(id), ip: getClientIp(req) });
    return { success: true };
  }

  // ── JWT rotation ──
  @Post('rotate-jwt-secret')
  @HttpCode(200)
  rotateJwtSecret(@CurrentUser() user: User, @Req() req: Request) {
    const result = this.admin.rotateJwtSecret();
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    writeAudit({ userId: user.id, action: 'admin.rotate_jwt_secret', ip: getClientIp(req) });
    return { success: true };
  }

  // ── Default user settings ──
  @Get('default-user-settings')
  getDefaultUserSettings() { return this.admin.getAdminUserDefaults(); }

  @Put('default-user-settings')
  setDefaultUserSettings(@CurrentUser() user: User, @Body() body: unknown, @Req() req: Request) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new HttpException({ error: 'Object body required' }, 400);
    }
    try {
      this.admin.setAdminUserDefaults(body as unknown as Record<string, unknown>);
      writeAudit({ userId: user.id, action: 'admin.default_user_settings_update', ip: getClientIp(req), details: body as Record<string, unknown> });
      return this.admin.getAdminUserDefaults();
    } catch (err) {
      throw new HttpException({ error: err instanceof Error ? err.message : String(err) }, 400);
    }
  }

  // ── Dev-only: test notification (404 outside development, mirroring the conditional mount) ──
  @Post('dev/test-notification')
  @HttpCode(200)
  async devTestNotification(@CurrentUser() user: User, @Body() body: { event?: string; scope?: string; targetId?: number; params?: Record<string, unknown>; inApp?: boolean }) {
    if (process.env.NODE_ENV?.toLowerCase() !== 'development') {
      throw new NotFoundException();
    }
    try {
      await sendNotification({
        event: body.event ?? 'trip_reminder',
        actorId: user.id,
        scope: body.scope ?? 'user',
        targetId: body.targetId ?? user.id,
        params: { actor: user.email, ...(body.params ?? {}) },
        inApp: body.inApp,
      } as unknown as Parameters<typeof sendNotification>[0]);
      return { success: true };
    } catch (err) {
      throw new HttpException({ error: err instanceof Error ? err.message : String(err) }, 400);
    }
  }
}
