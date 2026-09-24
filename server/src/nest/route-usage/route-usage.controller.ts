import { Body, Controller, Delete, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import type { RouteUsageReportResult, RouteUsageSummaryResult } from '@trek/shared';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RouteUsageReportDto } from './route-usage.dto';
import { RouteUsageService } from './route-usage.service';

/**
 * /api/route-usage — how much routing this instance does.
 *
 * Reporting is open to any signed-in user, because every signed-in user is the one
 * generating the load; reading is admin only, because the totals are everybody's
 * routing and the person entitled to see that is the person running the instance.
 * Nothing here leaves the instance on its own.
 */
@Controller('api/route-usage')
@UseGuards(JwtAuthGuard)
export class RouteUsageController {
  constructor(private readonly usage: RouteUsageService) {}

  /**
   * 200 with `{ recorded: false }` when counting is off, rather than a 403. The
   * client flushes and moves on; a rejection would be a permanent error in the
   * console of every install that switched the counters off.
   */
  @Post('report')
  @HttpCode(200)
  report(@Body() body: RouteUsageReportDto): RouteUsageReportResult {
    return { recorded: this.usage.record(body) };
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard, AdminGuard)
  summary(): RouteUsageSummaryResult {
    return this.usage.summary();
  }

  @Delete()
  @UseGuards(JwtAuthGuard, AdminGuard)
  clear(): { removed: number } {
    return { removed: this.usage.clear() };
  }
}
