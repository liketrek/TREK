import type { User } from '../../types';
import { AuditService } from '../audit/audit.service';
import { getClientIp } from '../audit/client-ip';
import { AdminGuard } from '../auth-core/admin.guard';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ManagedForbidden } from '../common/managed';
import { ResponseContract } from '../common/response-contract';
import { ServiceIdentityService } from './service-identity.service';
import { Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { serviceIdentityStatusSchema, type ServiceIdentityStatus } from '@trek/shared';

import type { Request } from 'express';

/** /api/admin/service-identity: how this installation stands with the liketrek services, and a fresh start. */
@Controller('api/admin/service-identity')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ServiceIdentityController {
  constructor(
    private readonly identity: ServiceIdentityService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @ResponseContract(serviceIdentityStatusSchema)
  async status(): Promise<ServiceIdentityStatus> {
    return this.identity.status();
  }

  @Post('regenerate')
  @HttpCode(200)
  @ManagedForbidden('the installation key of a managed install comes from its operator through TREK_SERVICES_KEY')
  @ResponseContract(serviceIdentityStatusSchema)
  async regenerate(@CurrentUser() user: User, @Req() req: Request): Promise<ServiceIdentityStatus> {
    const status = await this.identity.regenerate();
    await this.audit.writeAudit({ userId: user.id, action: 'admin.service_identity_regenerate', ip: getClientIp(req) });
    return status;
  }
}
