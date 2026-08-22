import { Body, Controller, Delete, Get, HttpCode, HttpException, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { StorageUsage } from '@trek/shared';
import { redactStorageSecrets } from './storage-secrets';
import type { User } from '../../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { getClientIp } from '../audit/client-ip';
import { ManagedForbidden } from '../common/managed';
import { StorageAdminService } from './storage-admin.service';
import { StorageConfigDto, StorageMigrationRequestDto, StorageTestRequestDto } from './storage-admin.dto';
import {
  BackfillBusyError,
  BackfillTargetError,
  MigrationRequestError,
  MigrationTargetError,
} from './storage-jobs.service';
import { StatsBusyError } from './storage-stats.service';
import { StorageConflictError } from './storage.types';

/**
 * /api/admin/storage — the admin surface over the storage registry (spec:
 * docs/superpowers/specs/2026-08-19-storage-admin-config-design.md). Backends,
 * category assignment, and mirror composition are managed here; secrets are
 * stored encrypted and only ever rendered as the mask. Pipeline refusals are
 * operator-grade registry messages, surfaced verbatim in the 400 envelope.
 */
@Controller('api/admin/storage')
@UseGuards(JwtAuthGuard, AdminGuard)
@ManagedForbidden('storage backends and their credentials are hoster-level configuration')
export class StorageAdminController {
  constructor(
    private readonly service: StorageAdminService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  get() {
    return this.service.state();
  }

  @Put()
  update(@CurrentUser() user: User, @Body() body: StorageConfigDto, @Req() req: Request) {
    try {
      this.service.applyConfig(body);
    } catch (err) {
      // The conflict branch must come before the blanket 400: a
      // StorageConflictError IS an Error, so the generic catch-all below
      // would otherwise swallow it into a 400 (audit #7 — the client can't
      // tell "stale version, reload and retry" from "bad config" without 409).
      if (err instanceof StorageConflictError) throw new HttpException({ error: err.message }, 409);
      throw new HttpException({ error: err instanceof Error ? err.message : String(err) }, 400);
    }
    this.audit.writeAudit({
      userId: user.id,
      action: 'admin.storage_update',
      ip: getClientIp(req),
      details: redactStorageSecrets(body) as unknown as Record<string, unknown>,
    });
    // The defaults-tab contract: never echo the request — answer the fresh effective world.
    return this.service.state();
  }

  @Post('test')
  @HttpCode(200) // a probe answers 200 with per-target results, not a 201 resource
  async test(@CurrentUser() user: User, @Body() body: StorageTestRequestDto, @Req() req: Request) {
    let result;
    try {
      result = await this.service.testBackend(body.backend);
    } catch (err) {
      throw new HttpException({ error: err instanceof Error ? err.message : String(err) }, 400);
    }
    // Audited because the probe writes and deletes an object; names only, never options.
    this.audit.writeAudit({
      userId: user.id,
      action: 'admin.storage_test',
      ip: getClientIp(req),
      details: {
        backend: body.backend.name,
        type: body.backend.type,
        ok: result.ok,
        targets: result.targets.map(({ name, ok }) => ({ name, ok })),
      },
    });
    return result;
  }

  /** Start a replica catch-up for a routed mirror. One at a time, globally. */
  @Post('backends/:name/backfill')
  @HttpCode(200)
  backfillStart(@CurrentUser() user: User, @Param('name') name: string, @Req() req: Request): { started: true } {
    try {
      this.service.startBackfill(name);
    } catch (err) {
      if (err instanceof BackfillTargetError) throw new HttpException({ error: err.message }, 404);
      if (err instanceof BackfillBusyError) throw new HttpException({ error: err.message }, 409);
      throw err;
    }
    this.audit.writeAudit({
      userId: user.id,
      action: 'admin.storage_backfill',
      ip: getClientIp(req),
      details: { backend: name },
    });
    return { started: true };
  }

  @Delete('backends/:name/backfill')
  backfillCancel(@CurrentUser() user: User, @Param('name') name: string, @Req() req: Request): { cancelled: true } {
    if (!this.service.cancelBackfill(name)) {
      throw new HttpException({ error: `no active sync for '${name}'` }, 404);
    }
    this.audit.writeAudit({
      userId: user.id,
      action: 'admin.storage_backfill_cancel',
      ip: getClientIp(req),
      details: { backend: name },
    });
    return { cancelled: true };
  }

  /** Start a category migration: copy → flip → delta sweep. One storage job at a time. */
  @Post('migrations')
  @HttpCode(200)
  migrationStart(@CurrentUser() user: User, @Body() body: StorageMigrationRequestDto, @Req() req: Request): { started: true } {
    const { category, to } = body;
    try {
      this.service.startMigration(category, to);
    } catch (err) {
      if (err instanceof MigrationRequestError) throw new HttpException({ error: err.message }, 400);
      if (err instanceof MigrationTargetError) throw new HttpException({ error: err.message }, 404);
      if (err instanceof BackfillBusyError) throw new HttpException({ error: err.message }, 409);
      throw err;
    }
    this.audit.writeAudit({
      userId: user.id,
      action: 'admin.storage_migration',
      ip: getClientIp(req),
      details: { category, to },
    });
    return { started: true };
  }

  @Delete('migrations/:category')
  migrationCancel(@CurrentUser() user: User, @Param('category') category: string, @Req() req: Request): { cancelled: true } {
    if (!this.service.cancelMigration(category)) {
      throw new HttpException({ error: `no running migration for '${category}'` }, 404);
    }
    this.audit.writeAudit({
      userId: user.id,
      action: 'admin.storage_migration_cancel',
      ip: getClientIp(req),
      details: { category },
    });
    return { cancelled: true };
  }

  @Post('stats/refresh')
  @HttpCode(200)
  async statsRefresh(@CurrentUser() user: User, @Req() req: Request): Promise<StorageUsage> {
    let usage: StorageUsage;
    try {
      usage = await this.service.refreshStats();
    } catch (err) {
      if (err instanceof StatsBusyError) throw new HttpException({ error: err.message }, 409);
      throw err;
    }
    this.audit.writeAudit({
      userId: user.id,
      action: 'admin.storage_stats_refresh',
      ip: getClientIp(req),
    });
    return usage;
  }
}
