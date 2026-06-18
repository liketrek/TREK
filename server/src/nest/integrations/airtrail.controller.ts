import { Body, Controller, Get, HttpCode, HttpException, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '../../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AirtrailAddonGuard } from './airtrail-addon.guard';
import { getClientIp } from '../../services/auditLog';
import { airtrailSettingsSchema, type AirtrailSettings } from '@trek/shared';
import {
  getConnectionSettings,
  getConnectionStatus,
  getFlightsForPicker,
  saveSettings,
  testConnection,
} from '../../services/airtrail/airtrailService';
import { runAirtrailSyncForUser } from '../../services/airtrail/airtrailSync';

/**
 * /api/integrations/airtrail — per-user AirTrail connection (#214).
 *
 * `status` and `test` answer 200 even on failure (the service shapes
 * `{ connected: false, error }`); `settings` PUT validates with a 400. The API
 * key is never echoed — `getSettings` returns it masked. The route group is
 * gated on the `airtrail` addon (404 when disabled).
 */
@Controller('api/integrations/airtrail')
@UseGuards(AirtrailAddonGuard, JwtAuthGuard)
export class AirtrailController {
  @Get('settings')
  getSettings(@CurrentUser() user: User) {
    return getConnectionSettings(user.id);
  }

  @Put('settings')
  async putSettings(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(airtrailSettingsSchema)) body: AirtrailSettings,
    @Req() req: Request,
  ) {
    const result = await saveSettings(
      user.id,
      body.url,
      body.apiKey,
      !!body.allowInsecureTls,
      !!body.writeEnabled,
      getClientIp(req),
    );
    if (!result.success) {
      throw new HttpException({ error: result.error }, 400);
    }
    return result.warning ? { success: true, warning: result.warning } : { success: true };
  }

  @Get('status')
  getStatus(@CurrentUser() user: User) {
    return getConnectionStatus(user.id);
  }

  @Get('flights')
  async flights(@CurrentUser() user: User) {
    try {
      return { flights: await getFlightsForPicker(user.id) };
    } catch (err: any) {
      throw new HttpException({ error: err?.message || 'Could not load AirTrail flights' }, err?.status === 400 ? 400 : 502);
    }
  }

  /** Pull this user's AirTrail edits into their linked reservations on demand. */
  @Post('sync')
  @HttpCode(200)
  sync(@CurrentUser() user: User) {
    return runAirtrailSyncForUser(user.id);
  }

  @Post('test')
  @HttpCode(200)
  test(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(airtrailSettingsSchema)) body: AirtrailSettings,
  ) {
    return testConnection(user.id, body.url, body.apiKey, !!body.allowInsecureTls);
  }
}
