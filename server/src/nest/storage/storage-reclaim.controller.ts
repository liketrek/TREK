import type { User } from '../../types';
import { AuditService } from '../audit/audit.service';
import { getClientIp } from '../audit/client-ip';
import { AdminGuard } from '../auth-core/admin.guard';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ManagedForbidden } from '../common/managed';
import { ResponseContract } from '../common/response-contract';
import { StorageReclaimConfirmDto, StorageReclaimSettingsDto } from './storage-admin.dto';
import { StorageReclaimService } from './storage-reclaim.service';
import { Body, Controller, HttpCode, Post, Put, Req, UseGuards } from '@nestjs/common';
import { storageReclaimRunStartedSchema, storageReclaimStateSchema, type StorageReclaimState } from '@trek/shared';

import type { Request } from 'express';

/**
 * /api/admin/storage/reclaim: the admin's switch for the reclaim pass, a check
 * on demand and the confirmation a category with a large unreferenced share
 * waits for. The state itself rides on GET /api/admin/storage. Deleting stays
 * off until an admin turns it on here; a pass then still deletes only what has
 * been unreferenced for a week (StorageReclaimService).
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

  /**
   * Starts a report-only pass in the background and answers 202 at once; the
   * admin state says `running` until its report lands. 409 on a demo or while
   * another storage job, a reclaim pass included, runs (a release tick, which
   * takes seconds, is waited for).
   */
  @Post('run')
  @HttpCode(202)
  @ResponseContract(storageReclaimRunStartedSchema)
  async run(@CurrentUser() user: User, @Req() req: Request): Promise<{ started: true }> {
    await this.reclaim.start();
    await this.audit.writeAudit({
      userId: user.id,
      action: 'admin.storage_reclaim_run',
      ip: getClientIp(req),
      details: { mode: 'report' },
    });
    return { started: true };
  }

  /**
   * Lets the pass delete in a category whose unreferenced share is over a
   * fifth, for the count the admin was shown (`unreferenced`). 409
   * `reclaim_nothing_to_confirm` when nothing waits, `reclaim_confirm_stale`
   * when the last report's count is no longer the one shown.
   */
  @Post('confirm')
  @HttpCode(200)
  @ResponseContract(storageReclaimStateSchema)
  async confirm(
    @CurrentUser() user: User,
    @Body() body: StorageReclaimConfirmDto,
    @Req() req: Request,
  ): Promise<StorageReclaimState> {
    const state = await this.reclaim.confirm(body.category, body.unreferenced);
    await this.audit.writeAudit({
      userId: user.id,
      action: 'admin.storage_reclaim_confirm',
      ip: getClientIp(req),
      details: { category: body.category, unreferenced: body.unreferenced },
    });
    return state;
  }
}
