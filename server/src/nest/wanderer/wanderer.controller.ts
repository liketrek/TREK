import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { getClientIp } from '../audit/client-ip';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { WandererEnabledGuard } from './wanderer-enabled.guard';
import { WandererSettingsDto, WandererTestDto } from './wanderer.dto';
import { WandererService } from './wanderer.service';
import { Body, Controller, Delete, Get, HttpCode, Post, Put, Req, UseGuards } from '@nestjs/common';
import {
  successResponseSchema,
  wandererConnectionSchema,
  wandererSaveResponseSchema,
  wandererTestResponseSchema,
} from '@trek/shared';

import type { Request } from 'express';

/**
 * `/api/integrations/wanderer`: the caller's own wanderer connection. It belongs
 * to the Tours addon, which is what it feeds, and only ever touches the
 * caller's own row. The test answers 200 with the reason in the body, since a
 * form showing someone their own typo needs a field to render, not an error.
 */
@Controller('api/integrations/wanderer')
@UseGuards(AddonGuard, JwtAuthGuard, WandererEnabledGuard)
@RequireAddon(ADDON_IDS.TOURS, 'Tours')
export class WandererController {
  constructor(private readonly wanderer: WandererService) {}

  @Get('settings')
  @ResponseContract(wandererConnectionSchema)
  getSettings(@CurrentUser() user: User) {
    return this.wanderer.getConnection(user.id);
  }

  @Put('settings')
  @ResponseContract(wandererSaveResponseSchema)
  saveSettings(@CurrentUser() user: User, @Body() body: WandererSettingsDto, @Req() req: Request) {
    return this.wanderer.save(user.id, body, getClientIp(req));
  }

  @Delete('settings')
  @HttpCode(200)
  @ResponseContract(successResponseSchema)
  async disconnect(@CurrentUser() user: User, @Req() req: Request) {
    await this.wanderer.disconnect(user.id, getClientIp(req));
    return { success: true as const };
  }

  @Post('test')
  @HttpCode(200)
  @ResponseContract(wandererTestResponseSchema)
  test(@CurrentUser() user: User, @Body() body: WandererTestDto) {
    return this.wanderer.test(user.id, body);
  }
}
