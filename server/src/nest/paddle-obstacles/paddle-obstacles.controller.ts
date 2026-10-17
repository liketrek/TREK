import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { AuditService } from '../audit/audit.service';
import { getClientIp } from '../audit/client-ip';
import { AdminGuard } from '../auth-core/admin.guard';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import {
  PaddleObstaclesQueryDto,
  PaddleRegionCatalogQueryDto,
  PaddleRegionLoadRequestDto,
  PaddleRegionRequestDto,
  PaddleRegionSettingsDto,
} from './paddle-obstacles.dto';
import { PaddleObstaclesService } from './paddle-obstacles.service';
import { PaddleRegionLoadService } from './paddle-region-load.service';
import { PaddleRegionsService } from './paddle-regions.service';
import { Body, Controller, Get, HttpCode, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import {
  paddleObstaclesResponseSchema,
  paddleRegionCatalogResponseSchema,
  paddleRegionListResponseSchema,
  paddleRegionLoadResponseSchema,
  paddleRegionSchema,
  paddleRegionSettingsSchema,
  successResponseSchema,
} from '@trek/shared';

import type { Request } from 'express';

/**
 * GET /api/paddle/obstacles?bbox=: the paddle objects of a map area and its
 * coverage (PAD-05A), for anyone signed in while Tours is on. The data is
 * OpenStreetMap's, read from regional extracts, not trip data.
 *
 * POST /api/paddle/regions/load: the water data around places no region
 * covers yet (PAD-11C), loaded or asked for as the admin's setting says.
 * Asking again follows the load; it never starts a second one.
 */
@Controller('api/paddle')
@UseGuards(AddonGuard, JwtAuthGuard)
@RequireAddon(ADDON_IDS.TOURS, 'Tours')
export class PaddleObstaclesController {
  constructor(
    private readonly obstacles: PaddleObstaclesService,
    private readonly load: PaddleRegionLoadService,
  ) {}

  @Get('obstacles')
  @ResponseContract(paddleObstaclesResponseSchema)
  async inBox(@Query() query: PaddleObstaclesQueryDto) {
    return await this.obstacles.inBox(query.bbox);
  }

  @Post('regions/load')
  @HttpCode(200)
  @ResponseContract(paddleRegionLoadResponseSchema)
  async loadRegions(@CurrentUser() user: User, @Body() body: PaddleRegionLoadRequestDto) {
    return { points: await this.load.load(user, body) };
  }
}

/**
 * /api/admin/paddle-regions: which regions TREK reads paddle data for. The
 * list (with the regions paddlers asked for), Geofabrik's catalogue to pick
 * from, adding (which starts the first read and settles a request), reading
 * again, removing, declining a request, and how TREK loads regions by itself,
 * each change with its audit row. Ids travel in the body or the query: some
 * of Geofabrik's hold a slash, and a route segment is no place for a choice
 * that names an outside source.
 */
@Controller('api/admin/paddle-regions')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PaddleRegionsController {
  constructor(
    private readonly regions: PaddleRegionsService,
    private readonly load: PaddleRegionLoadService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @ResponseContract(paddleRegionListResponseSchema)
  async list() {
    return { regions: await this.regions.list(), requests: await this.load.pending() };
  }

  @Get('settings')
  @ResponseContract(paddleRegionSettingsSchema)
  async settings() {
    return await this.load.settings();
  }

  @Put('settings')
  @ResponseContract(paddleRegionSettingsSchema)
  async updateSettings(@CurrentUser() user: User, @Body() body: PaddleRegionSettingsDto, @Req() req: Request) {
    const settings = await this.load.updateSettings(body);
    await this.audit.writeAudit({
      userId: user.id,
      action: 'admin.paddle_region_settings',
      ip: getClientIp(req),
      details: { ...settings },
    });
    return settings;
  }

  @Post('decline')
  @HttpCode(200)
  @ResponseContract(successResponseSchema)
  async decline(@CurrentUser() user: User, @Body() body: PaddleRegionRequestDto, @Req() req: Request) {
    await this.load.decline(body.id);
    await this.record(user, 'admin.paddle_region_decline', body.id, req);
    return { success: true as const };
  }

  @Get('catalog')
  @ResponseContract(paddleRegionCatalogResponseSchema)
  async catalog(@Query() query: PaddleRegionCatalogQueryDto) {
    return { regions: await this.regions.catalog(query.q) };
  }

  @Post()
  @ResponseContract(paddleRegionSchema)
  async add(@CurrentUser() user: User, @Body() body: PaddleRegionRequestDto, @Req() req: Request) {
    const region = await this.regions.add(body.id);
    await this.record(user, 'admin.paddle_region_add', body.id, req);
    return region;
  }

  @Post('refresh')
  @HttpCode(200)
  @ResponseContract(paddleRegionSchema)
  async refresh(@CurrentUser() user: User, @Body() body: PaddleRegionRequestDto, @Req() req: Request) {
    const region = await this.regions.refresh(body.id);
    await this.record(user, 'admin.paddle_region_refresh', body.id, req);
    return region;
  }

  @Post('remove')
  @HttpCode(200)
  @ResponseContract(successResponseSchema)
  async remove(@CurrentUser() user: User, @Body() body: PaddleRegionRequestDto, @Req() req: Request) {
    await this.regions.remove(body.id);
    await this.record(user, 'admin.paddle_region_remove', body.id, req);
    return { success: true as const };
  }

  private async record(user: User, action: string, region: string, req: Request): Promise<void> {
    await this.audit.writeAudit({ userId: user.id, action, ip: getClientIp(req), details: { region } });
  }
}
