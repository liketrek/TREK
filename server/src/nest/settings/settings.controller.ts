import { Body, Controller, Get, HttpCode, HttpException, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { MASKED_SETTING_VALUE } from '@trek/shared';
import type { User } from '../../types';
import { SettingsService, isAdminOnlyLlmSetting } from './settings.service';
import { SettingUpsertDto, SettingsBulkDto } from './settings.dto';
import { AdminDefaultUserSettingsDto } from '../admin/admin.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AuditService } from '../audit/audit.service';
import { getClientIp } from '../audit/client-ip';
import { CurrentUser } from '../auth/current-user.decorator';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { isManagedLockedKey, splitManagedKeys } from '../common/managed';

/**
 * /api/settings — per-user key/value preferences: get-all, single upsert
 * (no-op on the masked sentinel), and bulk upsert (500 on a write error). All
 * answer 200. Bodies validate against the @trek/shared settings schemas via
 * the DTO classes in settings.dto.ts + the global ZodValidationPipe (400 with
 * the standard `{ error }` envelope on mismatch — this replaced the legacy
 * bespoke 'Key is required' / 'Settings object is required' checks).
 *
 * One key group is authorized rather than merely validated: the LLM endpoint
 * settings answer 403 here for everyone, admins included, because they are
 * instance configuration and live on their own admin routes (#1772).
 */
@Controller('api/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly env: RuntimeEnvService,
  ) {}

  /**
   * #1772: the write half of the rule that the endpoint is instance
   * configuration. There is no key allow-list on this route, so anyone could
   * otherwise park an `llm_base_url` (or `llm_provider: 'local'`) in their own
   * settings row. The resolver ignores such a row anyway; refusing it here
   * means the caller finds out instead of silently saving something that never
   * takes effect.
   *
   * Admins are not exempt: they set the instance endpoint on the addon, or via
   * PUT /api/admin/default-user-settings, both of which are separate routes
   * behind AdminGuard. A personal row would be a second, invisible place for
   * the same value.
   */
  private assertMayWriteLlmEndpoint(settings: Record<string, unknown>) {
    for (const [key, value] of Object.entries(settings)) {
      if (isAdminOnlyLlmSetting(key, value)) {
        throw new HttpException({ error: 'Admin access required' }, 403);
      }
    }
  }

  @Get()
  list(@CurrentUser() user: User) {
    return { settings: this.settings.getUserSettings(user.id) };
  }

  @Put()
  upsert(@CurrentUser() user: User, @Body() body: SettingUpsertDto) {
    this.assertMayWriteLlmEndpoint({ [body.key]: body.value });
    // assertMayWriteLlmEndpoint only covers llm_base_url and provider 'local'.
    // llm_api_key and llm_model are writable by every user, and on a managed
    // install both cost the operator money, so the key list decides here.
    if (isManagedLockedKey(body.key) && this.env.isManaged()) {
      return { success: true, key: body.key, managed: true };
    }
    // The client echoes a redacted secret back unchanged — treat as a no-op.
    if (body.value === MASKED_SETTING_VALUE) {
      return { success: true, key: body.key, unchanged: true };
    }
    this.settings.upsertSetting(user.id, body.key, body.value);
    return { success: true, key: body.key, value: body.value };
  }

  @Post('bulk')
  @HttpCode(200) // Express answers bulk with res.json (200), not the POST-default 201.
  bulk(@CurrentUser() user: User, @Body() body: SettingsBulkDto) {
    this.assertMayWriteLlmEndpoint(body.settings);
    const { allowed, blocked } = splitManagedKeys(body.settings, this.env.isManaged());
    try {
      const updated = this.settings.bulkUpsertSettings(user.id, allowed);
      return { success: true, updated, ...(blocked.length ? { managed_keys: blocked } : {}) };
    } catch (err) {
      console.error('Error saving settings:', err);
      throw new HttpException({ error: 'Error saving settings' }, 500);
    }
  }
}

/**
 * /api/admin/default-user-settings — the defaults a new account starts with.
 *
 * These two routes sat on AdminController and reached SettingsService through a pair
 * of pass-through methods on AdminService that did nothing but forward. The owner is
 * here, so the routes are too; the path and both response shapes are unchanged.
 */
@Controller('api/admin/default-user-settings')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminDefaultUserSettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
    private readonly env: RuntimeEnvService,
  ) {}

  @Get()
  get() {
    return this.settings.getAdminUserDefaults();
  }

  @Put()
  update(@CurrentUser() user: User, @Body() body: AdminDefaultUserSettingsDto, @Req() req: Request) {
    try {
      // Deliberately no managed_keys in the response here: the route answers
      // with the raw defaults map the admin panel renders from, so an extra
      // field would sit inside the key namespace. The audit row below and the
      // client's capability filter carry the message instead.
      const { allowed } = splitManagedKeys(
        body as unknown as Record<string, unknown>,
        this.env.isManaged(),
      );
      this.settings.setAdminUserDefaults(allowed);
      this.audit.writeAudit({
        userId: user.id,
        action: 'admin.default_user_settings_update',
        ip: getClientIp(req),
        details: body as Record<string, unknown>,
      });
      // Answer with the stored defaults, not the request body: the service normalises
      // and drops unknown keys, and the admin panel renders straight from this.
      return this.settings.getAdminUserDefaults();
    } catch (err) {
      throw new HttpException({ error: err instanceof Error ? err.message : String(err) }, 400);
    }
  }
}
