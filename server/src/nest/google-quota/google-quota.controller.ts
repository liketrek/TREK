import type { User } from '../../types';
import { AuditService } from '../audit/audit.service';
import { getClientIp } from '../audit/client-ip';
import { AdminGuard } from '../auth-core/admin.guard';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { GoogleQuotaUpdateDto } from './google-quota.dto';
import { GoogleQuotaService } from './google-quota.service';
import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import type { GoogleQuotaStatus } from '@trek/shared';

import type { Request } from 'express';

/** /api/admin/google-quota — the daily ceiling on Google API calls and today's count (#1582). */
@Controller('api/admin/google-quota')
@UseGuards(JwtAuthGuard, AdminGuard)
export class GoogleQuotaController {
  constructor(
    private readonly quota: GoogleQuotaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  async status(): Promise<GoogleQuotaStatus> {
    return this.quota.status();
  }

  @Put()
  async update(
    @CurrentUser() user: User,
    @Body() body: GoogleQuotaUpdateDto,
    @Req() req: Request,
  ): Promise<GoogleQuotaStatus> {
    const result = await this.quota.setDailyLimit(body.daily_limit);
    await this.audit.writeAudit({
      userId: user.id,
      action: 'admin.google_daily_limit',
      ip: getClientIp(req),
      details: { daily_limit: result.daily_limit },
    });
    return result;
  }
}
