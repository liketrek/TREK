import type { User } from '../../types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { Body, Controller, Delete, Get, HttpCode, HttpException, Param, Post, Put, UseGuards } from '@nestjs/common';
import { commonCurrencyListSchema, settingResetKeySchema, settingResetResponseSchema } from '@trek/shared';

const MASKED_VALUE = '••••••••';

/**
 * /api/settings — per-user key/value preferences.
 *
 * Supports get-all, validated single and bulk upserts, plus removal of the
 * common-currency override so the effective administrator default applies.
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
    const value = body.key === 'common_currencies' ? this.parseCommonCurrencies(body.value) : body.value;
    this.settings.upsertSetting(user.id, body.key, value);
    return { success: true, key: body.key, value };
  }

  @Post('bulk')
  @HttpCode(200) // Express answers bulk with res.json (200), not the POST-default 201.
  bulk(@CurrentUser() user: User, @Body() body: { settings?: unknown }) {
    if (!body.settings || typeof body.settings !== 'object') {
      throw new HttpException({ error: 'Settings object is required' }, 400);
    }
    try {
      const values = body.settings as Record<string, unknown>;
      if ('common_currencies' in values)
        values.common_currencies = this.parseCommonCurrencies(values.common_currencies);
      const updated = this.settings.bulkUpsertSettings(user.id, values);
      return { success: true, updated };
    } catch (err) {
      console.error('Error saving settings:', err);
      if (err instanceof HttpException) throw err;
      throw new HttpException({ error: 'Error saving settings' }, 500);
    }
  }

  @Delete(':key')
  delete(@CurrentUser() user: User, @Param('key') key: string) {
    const parsedKey = settingResetKeySchema.safeParse(key);
    if (!parsedKey.success) throw new HttpException({ error: 'Setting cannot be reset' }, 400);
    return settingResetResponseSchema.parse({
      success: true,
      key: parsedKey.data,
      value: this.settings.deleteSetting(user.id, parsedKey.data),
    });
  }

  private parseCommonCurrencies(value: unknown): string[] {
    const result = commonCurrencyListSchema.safeParse(value);
    if (!result.success) {
      throw new HttpException({ error: result.error.issues[0]?.message || 'Invalid common currencies' }, 400);
    }
    return result.data;
  }
}
