import type { User } from '../../types';
import { AuditService } from '../audit/audit.service';
import { getClientIp } from '../audit/client-ip';
import { AdminGuard } from '../auth-core/admin.guard';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ManagedForbidden } from '../common/managed';
import { ResponseContract } from '../common/response-contract';
import { StorageReclaimRunDto, StorageReclaimSettingsDto } from './storage-admin.dto';
import { StorageReclaimService } from './storage-reclaim.service';
import { Body, Controller, HttpCode, Post, Put, Req, UseGuards } from '@nestjs/common';
import {
  storageReclaimReportSchema,
  storageReclaimStateSchema,
  type StorageReclaimReport,
  type StorageReclaimState,
} from '@trek/shared';

import type { Request } from 'express';

/**
 * /api/admin/storage/reclaim: the admin's switch for the reclaim pass and a
 * pass on demand. The state itself rides on GET /api/admin/storage. Deleting
 * stays off until an admin turns it on here; a pass then still deletes only
 * what has been unreferenced for a week (StorageReclaimService).
 */
@Controller('api/admin/storage/reclaim')
@UseGuards(JwtAuthGuard, AdminGuard)
@ManagedForbidden('storage backends and their contents are hoster-level configuration')
export class StorageReclaimController {
  constructor(
    private readonly reclaim: StorageReclaimService,
    private readonly audit: AuditService,
  ) {}

  @Put()
  @ResponseContract(storageReclaimStateSchema)
  async update(
    @CurrentUser() user: User,
    @Body() body: StorageReclaimSettingsDto,
    @Req() req: Request,
  ): Promise<StorageReclaimState> {
    const state = await this.reclaim.setDeleteEnabled(body.deleteEnabled);
    await this.audit.writeAudit({
      userId: user.id,
      action: 'admin.storage_reclaim_update',
      ip: getClientIp(req),
      details: { deleteEnabled: body.deleteEnabled },
    });
    return state;
  }

  /** One pass now, honouring the switch unless `reportOnly`. 409 on a demo or while another storage job runs. */
  @Post('run')
  @HttpCode(200)
  @ResponseContract(storageReclaimReportSchema)
  async run(
    @CurrentUser() user: User,
    @Body() body: StorageReclaimRunDto,
    @Req() req: Request,
  ): Promise<StorageReclaimReport> {
    const report = await this.reclaim.run({ reportOnly: body.reportOnly === true });
    const rows = Object.values(report.categories);
    await this.audit.writeAudit({
      userId: user.id,
      action: 'admin.storage_reclaim_run',
      ip: getClientIp(req),
      details: {
        mode: report.mode,
        deleted: rows.reduce((sum, row) => sum + row.deleted.objects, 0),
        bytes: rows.reduce((sum, row) => sum + row.deleted.bytes, 0),
      },
    });
    return report;
  }
}
