import { Body, Controller, Get, HttpCode, HttpException, Post, Put, UseGuards } from '@nestjs/common';
import type { User } from '../../types';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

const MASKED_VALUE = '••••••••';

/**
 * /api/settings — per-user key/value preferences.
 *
 * Byte-identical to the legacy Express route (server/src/routes/settings.ts):
 * get-all, single upsert (400 without a key, no-op on the masked sentinel), and
 * bulk upsert (400 without an object, 500 on a write error). All answer 200.
 */
@Controller('api/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return { settings: this.settings.getUserSettings(user.id) };
  }

  @Put()
  upsert(@CurrentUser() user: User, @Body() body: { key?: string; value?: unknown }) {
    if (!body.key) {
      throw new HttpException({ error: 'Key is required' }, 400);
    }
    // The client echoes a redacted secret back unchanged — treat as a no-op.
    if (body.value === MASKED_VALUE) {
      return { success: true, key: body.key, unchanged: true };
    }
    this.settings.upsertSetting(user.id, body.key, body.value);
    return { success: true, key: body.key, value: body.value };
  }

  @Post('bulk')
  @HttpCode(200) // Express answers bulk with res.json (200), not the POST-default 201.
  bulk(@CurrentUser() user: User, @Body() body: { settings?: unknown }) {
    if (!body.settings || typeof body.settings !== 'object') {
      throw new HttpException({ error: 'Settings object is required' }, 400);
    }
    try {
      const updated = this.settings.bulkUpsertSettings(user.id, body.settings as Record<string, unknown>);
      return { success: true, updated };
    } catch (err) {
      console.error('Error saving settings:', err);
      throw new HttpException({ error: 'Error saving settings' }, 500);
    }
  }
}
