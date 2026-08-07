import { Body, Controller, Get, HttpCode, HttpException, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '../../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { ADDON_IDS } from '../../addons';
import { AirtrailSettingsDto } from './airtrail.dto';
import { getClientIp } from '../audit/client-ip';
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
@UseGuards(AddonGuard, JwtAuthGuard)
@RequireAddon(ADDON_IDS.AIRTRAIL, 'AirTrail')
export class AirtrailController {
  @Get('settings')
  getSettings(@CurrentUser() user: User) {
    return getConnectionSettings(user.id);
  }

  @Put('settings')
  async putSettings(
    @CurrentUser() user: User,
    @Body() body: AirtrailSettingsDto,
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
    @Body() body: AirtrailSettingsDto,
  ) {
    return testConnection(user.id, body.url, body.apiKey, !!body.allowInsecureTls);
  }
}
