import { Body, Controller, Get, HttpCode, HttpException, Post, Put, UseGuards } from '@nestjs/common';
import { MASKED_SETTING_VALUE } from '@trek/shared';
import type { User } from '../../types';
import { SettingsService } from './settings.service';
import { SettingUpsertDto, SettingsBulkDto } from './settings.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

/**
 * /api/settings — per-user key/value preferences: get-all, single upsert
 * (no-op on the masked sentinel), and bulk upsert (500 on a write error). All
 * answer 200. Bodies validate against the @trek/shared settings schemas via
 * the DTO classes in settings.dto.ts + the global ZodValidationPipe (400 with
 * the standard `{ error }` envelope on mismatch — this replaced the legacy
 * bespoke 'Key is required' / 'Settings object is required' checks).
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
  upsert(@CurrentUser() user: User, @Body() body: SettingUpsertDto) {
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
    try {
      const updated = this.settings.bulkUpsertSettings(user.id, body.settings);
      return { success: true, updated };
    } catch (err) {
      console.error('Error saving settings:', err);
      throw new HttpException({ error: 'Error saving settings' }, 500);
    }
  }
}
