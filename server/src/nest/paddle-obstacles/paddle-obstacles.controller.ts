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
import { PaddleObstaclesQueryDto, PaddleRegionCatalogQueryDto, PaddleRegionRequestDto } from './paddle-obstacles.dto';
import { PaddleObstaclesService } from './paddle-obstacles.service';
import { PaddleRegionsService } from './paddle-regions.service';
import { Body, Controller, Get, HttpCode, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  paddleObstaclesResponseSchema,
  paddleRegionCatalogResponseSchema,
  paddleRegionListResponseSchema,
  paddleRegionSchema,
  successResponseSchema,
} from '@trek/shared';

import type { Request } from 'express';

/**
 * GET /api/paddle/obstacles?bbox=: the paddle objects of a map area and its
 * coverage (PAD-05A), for anyone signed in while Tours is on. The data is
 * OpenStreetMap's, read from regional extracts, not trip data.
 */
@Controller('api/paddle')
@UseGuards(AddonGuard, JwtAuthGuard)
@RequireAddon(ADDON_IDS.TOURS, 'Tours')
export class PaddleObstaclesController {
  constructor(private readonly obstacles: PaddleObstaclesService) {}

  @Get('obstacles')
  @ResponseContract(paddleObstaclesResponseSchema)
  async inBox(@Query() query: PaddleObstaclesQueryDto) {
    return await this.obstacles.inBox(query.bbox);
  }
}

/**
 * /api/admin/paddle-regions: which regions TREK reads paddle data for. The
 * list, Geofabrik's catalogue to pick from, adding (which starts the first
 * read), reading again and removing, each change with its audit row. Ids
 * travel in the body or the query: some of Geofabrik's hold a slash, and a
 * route segment is no place for a choice that names an outside source.
 */
@Controller('api/admin/paddle-regions')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PaddleRegionsController {
  constructor(
    private readonly regions: PaddleRegionsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @ResponseContract(paddleRegionListResponseSchema)
  async list() {
    return { regions: await this.regions.list() };
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
