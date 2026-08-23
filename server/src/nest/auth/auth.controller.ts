import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  Param,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { isDemoWriteBlocked, DEMO_WRITE_ERROR } from '../common/demo-write';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import type { Options } from 'multer';
import type { Request, Response } from 'express';
import path from 'path';
import { AuthService } from './auth.service';
import { TokenService } from '../tokens/token.service';
import { UserProfileService } from './user-profile.service';
import { StorageService } from '../storage/storage.service';
import {
  ChangePasswordDto,
  MapsKeyUpdateDto,
  ApiKeysUpdateDto,
  SettingsUpdateDto,
  AppSettingsUpdateDto,
  MfaEnableDto,
  MfaDisableDto,
  McpTokenCreateDto,
  ResourceTokenDto,
} from './auth.dto';
import { RateLimitService } from '../common/rate-limit.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { decodeSessionClaims } from './jwt-verify';
import { getClientIp } from '../audit/client-ip';
import { AuditService } from '../audit/audit.service';
import type { User } from '../../types';
import { MfaExempt } from './mfa-policy.guard';
import { ManagedForbidden } from '../common/managed';

const WINDOW = 15 * 60 * 1000;
const ALLOWED_AVATAR_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
// Consumed by auth.module.ts's MulterModule factory; the storage engine (spool
// destination + UUID filename) comes from the storage upload factory.
export const AVATAR_FILE_FILTER: Options['fileFilter'] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!file.mimetype.startsWith('image/') || !ALLOWED_AVATAR_EXTS.includes(ext)) {
    const err: Error & { statusCode?: number } = new Error('Only image files (jpg, png, gif, webp) are allowed');
    err.statusCode = 400;
    return cb(err);
  }
  cb(null, true);
};

/**
 * Authenticated account endpoints — byte-identical to the legacy Express route
 * (server/src/routes/auth.ts): the same /me/* account ops, avatar upload (with
 * the demo-mode block), settings, key validation, MFA setup/enable/disable, MCP
 * tokens and the short-lived ws/resource tokens. The per-IP rate limits reuse
 * the shared buckets (the inline rateLimiter(5) shares the 'login' bucket, as in
 * the legacy code); the two token-minting routes are keyed per account instead,
 * see limitUser. create-token answers 201; everything else 200.
 */
@Controller('api/auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly profile: UserProfileService, private readonly tokens: TokenService, private readonly rl: RateLimitService, private readonly audit: AuditService, private readonly env: RuntimeEnvService, private readonly storage: StorageService) {}

  private limit(bucket: string, req: Request, max: number): void {
    if (!this.rl.check(bucket, req.ip || 'unknown', max, WINDOW, Date.now())) {
      throw new HttpException({ error: 'Too many attempts. Please try again later.' }, 429);
    }
  }

  /**
   * Same limiter, keyed on the account instead of the address. What these
   * buckets bound is one account's share of the process-wide ephemeral token
   * store, and an address is the wrong unit for that: an office, a school or a
   * mobile carrier arrives as one IP, and the first user to reconnect a lot
   * would take the ceiling away from everybody behind it. The pre-auth buckets
   * (login, register, forgot-password) keep the IP key — there is no account
   * to charge yet.
   */
  private limitUser(bucket: string, userId: number, max: number): void {
    if (!this.rl.check(bucket, String(userId), max, WINDOW, Date.now())) {
      throw new HttpException({ error: 'Too many attempts. Please try again later.' }, 429);
    }
  }

  @Get('me')
  @MfaExempt('the client needs to know who it is to render the setup screen')
  me(@CurrentUser() user: User) {
    const loaded = this.auth.getCurrentUser(user.id);
    if (!loaded) {
      throw new HttpException({ error: 'User not found' }, 404);
    }
    return { user: loaded };
  }

  @Put('me/password')
  changePassword(@CurrentUser() user: User, @Body() body: ChangePasswordDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.limit('login', req, 5);
    // Carry the session's remember choice into the re-issued token/cookie so a
    // "remember me" login survives a password change (#1927). Bearer callers
    // have no cookie → undefined → the historical default duration.
    const remember = decodeSessionClaims((req.cookies as Record<string, string> | undefined)?.trek_session)?.remember;
    const result = this.auth.changePassword(user.id, user.email, body, remember);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    // Refresh this device's cookie with the new password_version so the user
    // stays logged in here while all other sessions are invalidated.
    if (result.token) this.auth.setAuthCookie(res, result.token, req, remember);
    this.audit.writeAudit({ userId: user.id, action: 'user.password_change', ip: getClientIp(req) });
    return { success: true };
  }

  @Delete('me')
  deleteAccount(@CurrentUser() user: User, @Req() req: Request) {
    const result = this.auth.deleteAccount(user.id, user.email, user.role);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    this.audit.writeAudit({ userId: user.id, action: 'user.account_delete', ip: getClientIp(req) });
    return { success: true };
  }

  /**
   * One row per save that actually changed a key, on all three routes that can
   * write these columns (#1939 asked for it: the API keys were the only admin
   * setting whose change left no trace, while `settings.app_update` next door
   * has always been logged).
   *
   * Names only. `details` is rendered as raw JSON in the admin audit panel and
   * mirrored into the debug log, so a value here would leak the key twice over.
   * Nothing is written when nothing changed — the panel saves before every test
   * click, and each click would otherwise cost a log line.
   */
  private auditApiKeys(userId: number, changed: string[], req: Request): void {
    if (!changed.length) return;
    this.audit.writeAudit({
      userId,
      action: 'settings.api_keys_update',
      resource: 'api_keys',
      ip: getClientIp(req),
      details: { changed },
    });
  }

  @Put('me/maps-key')
  mapsKey(@CurrentUser() user: User, @Body() body: MapsKeyUpdateDto, @Req() req: Request) {
    // changedKeys is for the audit line, not for the client: destructured off so
    // the response body stays what it always was.
    const { changedKeys = [], ...result } = this.profile.updateMapsKey(user.id, body.maps_api_key);
    this.auditApiKeys(user.id, changedKeys, req);
    return result;
  }

  @Put('me/api-keys')
  apiKeys(@CurrentUser() user: User, @Body() body: ApiKeysUpdateDto, @Req() req: Request) {
    const { changedKeys = [], ...result } = this.profile.updateApiKeys(user.id, body);
    this.auditApiKeys(user.id, changedKeys, req);
    return result;
  }

  @Put('me/settings')
  updateSettings(@CurrentUser() user: User, @Body() body: SettingsUpdateDto, @Req() req: Request) {
    const result = this.profile.updateSettings(user.id, body);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    this.auditApiKeys(user.id, result.changedKeys ?? [], req);
    return { success: result.success, user: result.user };
  }

  @Get('me/settings')
  getSettings(@CurrentUser() user: User) {
    const result = this.profile.getSettings(user.id);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return { settings: result.settings };
  }

  @Post('avatar')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('avatar'))
  async avatar(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File | undefined) {
    if (isDemoWriteBlocked(this.env, user.email)) {
      throw new HttpException(DEMO_WRITE_ERROR, 403);
    }
    if (!file) {
      throw new HttpException({ error: 'No image uploaded' }, 400);
    }
    // Commit the spooled upload to its final storage location (atomic
    // same-volume rename) before the DB row references the final path.
    await this.storage.put('avatars', file.filename, { tmpPath: file.path });
    return this.profile.saveAvatar(user.id, file.filename);
  }

  @Delete('avatar')
  async deleteAvatar(@CurrentUser() user: User) {
    return this.profile.deleteAvatar(user.id);
  }

  @Get('users')
  users(@CurrentUser() user: User) {
    return { users: this.profile.listUsers(user.id) };
  }

  @ManagedForbidden('validating a key spends the operator quota on a test click')
  @Get('validate-keys')
  async validateKeys(@CurrentUser() user: User) {
    const result = await this.profile.validateKeys(user.id);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return { maps: result.maps, weather: result.weather, maps_details: result.maps_details };
  }

  @Get('app-settings')
  @MfaExempt('the setup screen reads the policy it is asking the user to satisfy')
  getAppSettings(@CurrentUser() user: User) {
    const result = this.auth.getAppSettings(user.id);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return result.data;
  }

  @Put('app-settings')
  @MfaExempt('an admin locked out by their own policy must still be able to lift it')
  updateAppSettings(@CurrentUser() user: User, @Body() body: AppSettingsUpdateDto, @Req() req: Request) {
    const result = this.auth.updateAppSettings(user.id, body);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    this.audit.writeAudit({ userId: user.id, action: 'settings.app_update', ip: getClientIp(req), details: result.auditSummary, debugDetails: result.auditDebugDetails });
    // Named so the settings tab can say which fields the operator holds rather
    // than showing a saved value that silently did not save.
    return { success: true, ...(result.managedKeys?.length ? { managed_keys: result.managedKeys } : {}) };
  }

  // GET travel-stats moved to atlas/travel-stats.controller.ts. Same path, same
  // guard, same response — only the owner changed, so AuthModule can drop its
  // AtlasModule import.

  @Post('mfa/setup')
  @MfaExempt('completing setup is the way out of the policy')
  @HttpCode(200)
  async mfaSetup(@CurrentUser() user: User) {
    const result = this.auth.setupMfa(user.id, user.email);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    try {
      const qr_svg = await result.qrPromise!;
      return { secret: result.secret, otpauth_url: result.otpauth_url, qr_svg };
    } catch (err) {
      console.error('[MFA] QR code generation error:', err);
      throw new HttpException({ error: 'Could not generate QR code' }, 500);
    }
  }

  @Post('mfa/enable')
  @MfaExempt('completing setup is the way out of the policy')
  @HttpCode(200)
  mfaEnable(@CurrentUser() user: User, @Body() body: MfaEnableDto, @Req() req: Request) {
    this.limit('mfa', req, 5);
    const result = this.auth.enableMfa(user.id, body.code);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    this.audit.writeAudit({ userId: user.id, action: 'user.mfa_enable', ip: getClientIp(req) });
    return { success: true, mfa_enabled: result.mfa_enabled, backup_codes: result.backup_codes };
  }

  @Post('mfa/disable')
  @HttpCode(200)
  mfaDisable(@CurrentUser() user: User, @Body() body: MfaDisableDto, @Req() req: Request) {
    this.limit('login', req, 5);
    const result = this.auth.disableMfa(user.id, user.email, body);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    this.audit.writeAudit({ userId: user.id, action: 'user.mfa_disable', ip: getClientIp(req) });
    return { success: true, mfa_enabled: result.mfa_enabled };
  }

  @Get('mcp-tokens')
  listMcpTokens(@CurrentUser() user: User) {
    return { tokens: this.tokens.listMcpTokens(user.id) };
  }

  @ManagedForbidden('a static token never expires and carries every scope; OAuth covers the same ground')
  @Post('mcp-tokens')
  @HttpCode(201)
  createMcpToken(@CurrentUser() user: User, @Body() body: McpTokenCreateDto, @Req() req: Request) {
    this.limit('login', req, 5);
    const result = this.tokens.createMcpToken(user.id, body.name);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return { token: result.token };
  }

  @Delete('mcp-tokens/:id')
  deleteMcpToken(@CurrentUser() user: User, @Param('id') id: string) {
    const result = this.tokens.deleteMcpToken(user.id, id);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return { success: true };
  }

  @Post('ws-token')
  @HttpCode(200)
  wsToken(@CurrentUser() user: User) {
    // Own bucket, not 'login': a client that reconnects its socket in a loop
    // must not be able to lock itself out of signing in. The ceiling is far
    // above any real client, which mints one token per socket connect, but it
    // stops a single account from filling the process-wide ephemeral store and
    // 503-ing every other user's ws and download tokens.
    this.limitUser('ws_token', user.id, 120);
    const result = this.tokens.createWsToken(user.id);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return { token: result.token };
  }

  @Post('resource-token')
  @HttpCode(200)
  resourceToken(@CurrentUser() user: User, @Body() body: ResourceTokenDto) {
    this.limitUser('resource_token', user.id, 120);
    const token = this.tokens.createResourceToken(user.id, body.purpose);
    if (!token) {
      throw new HttpException({ error: 'Service unavailable' }, 503);
    }
    return token;
  }
}
