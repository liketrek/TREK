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
import { diskStorage } from 'multer';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import { AuthService } from './auth.service';
import { RateLimitService } from './rate-limit.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { writeAudit, getClientIp } from '../../services/auditLog';
import { isDemoEmail } from '../../services/demo';
import type { User } from '../../types';

const WINDOW = 15 * 60 * 1000;
const avatarDir = path.join(__dirname, '../../../uploads/avatars');
const ALLOWED_AVATAR_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const AVATAR_UPLOAD = {
  storage: diskStorage({
    destination: (_req, _file, cb) => { if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true }); cb(null, avatarDir); },
    filename: (_req, file, cb) => cb(null, uuid() + path.extname(file.originalname)),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: unknown, file: Express.Multer.File, cb: (err: Error | null, accept: boolean) => void) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!file.mimetype.startsWith('image/') || !ALLOWED_AVATAR_EXTS.includes(ext)) {
      const err: Error & { statusCode?: number } = new Error('Only image files (jpg, png, gif, webp) are allowed');
      err.statusCode = 400;
      return cb(err, false);
    }
    cb(null, true);
  },
};

/**
 * Authenticated account endpoints — byte-identical to the legacy Express route
 * (server/src/routes/auth.ts): the same /me/* account ops, avatar upload (with
 * the demo-mode block), settings, key validation, MFA setup/enable/disable, MCP
 * tokens and the short-lived ws/resource tokens. The per-IP rate limits reuse
 * the shared buckets (the inline rateLimiter(5) shares the 'login' bucket, as in
 * the legacy code). create-token answers 201; everything else 200.
 */
@Controller('api/auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly rl: RateLimitService) {}

  private limit(bucket: string, req: Request, max: number): void {
    if (!this.rl.check(bucket, req.ip || 'unknown', max, WINDOW, Date.now())) {
      throw new HttpException({ error: 'Too many attempts. Please try again later.' }, 429);
    }
  }

  @Get('me')
  me(@CurrentUser() user: User) {
    const loaded = this.auth.getCurrentUser(user.id);
    if (!loaded) {
      throw new HttpException({ error: 'User not found' }, 404);
    }
    return { user: loaded };
  }

  @Put('me/password')
  changePassword(@CurrentUser() user: User, @Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.limit('login', req, 5);
    const result = this.auth.changePassword(user.id, user.email, body);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    // Refresh this device's cookie with the new password_version so the user
    // stays logged in here while all other sessions are invalidated.
    if (result.token) this.auth.setAuthCookie(res, result.token, req);
    writeAudit({ userId: user.id, action: 'user.password_change', ip: getClientIp(req) });
    return { success: true };
  }

  @Delete('me')
  deleteAccount(@CurrentUser() user: User, @Req() req: Request) {
    const result = this.auth.deleteAccount(user.id, user.email, user.role);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    writeAudit({ userId: user.id, action: 'user.account_delete', ip: getClientIp(req) });
    return { success: true };
  }

  @Put('me/maps-key')
  mapsKey(@CurrentUser() user: User, @Body() body: { maps_api_key?: unknown }) {
    return this.auth.updateMapsKey(user.id, body.maps_api_key);
  }

  @Put('me/api-keys')
  apiKeys(@CurrentUser() user: User, @Body() body: unknown) {
    return this.auth.updateApiKeys(user.id, body);
  }

  @Put('me/settings')
  updateSettings(@CurrentUser() user: User, @Body() body: unknown) {
    const result = this.auth.updateSettings(user.id, body);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return { success: result.success, user: result.user };
  }

  @Get('me/settings')
  getSettings(@CurrentUser() user: User) {
    const result = this.auth.getSettings(user.id);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return { settings: result.settings };
  }

  @Post('avatar')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('avatar', AVATAR_UPLOAD))
  async avatar(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File | undefined) {
    if (process.env.DEMO_MODE?.toLowerCase() === 'true' && isDemoEmail(user.email)) {
      throw new HttpException({ error: 'Uploads are disabled in demo mode. Self-host TREK for full functionality.' }, 403);
    }
    if (!file) {
      throw new HttpException({ error: 'No image uploaded' }, 400);
    }
    return this.auth.saveAvatar(user.id, file.filename);
  }

  @Delete('avatar')
  async deleteAvatar(@CurrentUser() user: User) {
    return this.auth.deleteAvatar(user.id);
  }

  @Get('users')
  users(@CurrentUser() user: User) {
    return { users: this.auth.listUsers(user.id) };
  }

  @Get('validate-keys')
  async validateKeys(@CurrentUser() user: User) {
    const result = await this.auth.validateKeys(user.id);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return { maps: result.maps, weather: result.weather, maps_details: result.maps_details };
  }

  @Get('app-settings')
  getAppSettings(@CurrentUser() user: User) {
    const result = this.auth.getAppSettings(user.id);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return result.data;
  }

  @Put('app-settings')
  updateAppSettings(@CurrentUser() user: User, @Body() body: unknown, @Req() req: Request) {
    const result = this.auth.updateAppSettings(user.id, body);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    writeAudit({ userId: user.id, action: 'settings.app_update', ip: getClientIp(req), details: result.auditSummary, debugDetails: result.auditDebugDetails });
    return { success: true };
  }

  @Get('travel-stats')
  travelStats(@CurrentUser() user: User) {
    return this.auth.getTravelStats(user.id);
  }

  @Post('mfa/setup')
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
  @HttpCode(200)
  mfaEnable(@CurrentUser() user: User, @Body() body: { code?: unknown }, @Req() req: Request) {
    this.limit('mfa', req, 5);
    const result = this.auth.enableMfa(user.id, body.code);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    writeAudit({ userId: user.id, action: 'user.mfa_enable', ip: getClientIp(req) });
    return { success: true, mfa_enabled: result.mfa_enabled, backup_codes: result.backup_codes };
  }

  @Post('mfa/disable')
  @HttpCode(200)
  mfaDisable(@CurrentUser() user: User, @Body() body: unknown, @Req() req: Request) {
    this.limit('login', req, 5);
    const result = this.auth.disableMfa(user.id, user.email, body);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    writeAudit({ userId: user.id, action: 'user.mfa_disable', ip: getClientIp(req) });
    return { success: true, mfa_enabled: result.mfa_enabled };
  }

  @Get('mcp-tokens')
  listMcpTokens(@CurrentUser() user: User) {
    return { tokens: this.auth.listMcpTokens(user.id) };
  }

  @Post('mcp-tokens')
  @HttpCode(201)
  createMcpToken(@CurrentUser() user: User, @Body() body: { name?: unknown }, @Req() req: Request) {
    this.limit('login', req, 5);
    const result = this.auth.createMcpToken(user.id, body.name);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return { token: result.token };
  }

  @Delete('mcp-tokens/:id')
  deleteMcpToken(@CurrentUser() user: User, @Param('id') id: string) {
    const result = this.auth.deleteMcpToken(user.id, id);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return { success: true };
  }

  @Post('ws-token')
  @HttpCode(200)
  wsToken(@CurrentUser() user: User) {
    const result = this.auth.createWsToken(user.id);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return { token: result.token };
  }

  @Post('resource-token')
  @HttpCode(200)
  resourceToken(@CurrentUser() user: User, @Body() body: { purpose?: unknown }) {
    const token = this.auth.createResourceToken(user.id, body.purpose);
    if (!token) {
      throw new HttpException({ error: 'Service unavailable' }, 503);
    }
    return token;
  }
}
