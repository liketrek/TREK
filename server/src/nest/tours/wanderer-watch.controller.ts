import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { getClientIp } from '../audit/client-ip';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { WandererEnabledGuard } from '../wanderer/wanderer-enabled.guard';
import { WandererWatchDto } from './dto/wanderer-watch.dto';
import { WandererWatchService } from './wanderer-watch.service';
import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { wandererWatchSchema } from '@trek/shared';

import type { Request } from 'express';

/**
 * `/api/integrations/wanderer/watch` (WAN-02): the optional background watch
 * over the caller's own wanderer snapshots, beside the connection it runs on.
 * It reads and switches only the caller's own watch, and lists only the
 * caller's own hints.
 */
@Controller('api/integrations/wanderer/watch')
@UseGuards(AddonGuard, JwtAuthGuard, WandererEnabledGuard)
@RequireAddon(ADDON_IDS.TOURS, 'Tours')
export class WandererWatchController {
  constructor(private readonly watch: WandererWatchService) {}

  @Get()
  @ResponseContract(wandererWatchSchema)
  status(@CurrentUser() user: User) {
    return this.watch.status(user.id);
  }

  @Put()
  @ResponseContract(wandererWatchSchema)
  setEnabled(@CurrentUser() user: User, @Body() body: WandererWatchDto, @Req() req: Request) {
    return this.watch.setEnabled(user.id, body.enabled, getClientIp(req));
  }
}
