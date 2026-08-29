import { readEnv } from '../../app-config';
import type { User } from '../../types';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { AuditService } from '../audit/audit.service';
import { getClientIp } from '../audit/client-ip';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ManagedForbidden, isManagedBlocked, MANAGED_FORBIDDEN_ERROR } from '../common/managed';
import { StorageNotFoundError } from '../storage/storage.types';
import { AutoBackupJob } from './auto-backup.job';
import { AutoBackupSettingsDto } from './backup.dto';
import { BackupService } from './backup.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  Param,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import type { Request, Response } from 'express';
import fs from 'fs';

/**
 * /api/backup — admin-only database backup management (list, create, download,
 * restore from a stored or uploaded zip, auto-backup settings, delete).
 *
 * Byte-identical to the legacy Express route (server/src/routes/backup.ts):
 * admin-gated, the create rate-limit (429), the filename validation (400/404),
 * the audit-log writes, res.download for downloads and the tmp-file cleanup for
 * uploads. All JSON responses answer 200.
 */
@Controller('api/backup')
@UseGuards(JwtAuthGuard, AdminGuard)
export class BackupController {
  constructor(
    private readonly backup: BackupService,
    private readonly audit: AuditService,
    private readonly autoBackup: AutoBackupJob,
    private readonly env: RuntimeEnvService,
  ) {}

  @Get('list')
  async list() {
    try {
      return { backups: await this.backup.listBackups() };
    } catch {
      throw new HttpException({ error: 'Error loading backups' }, 500);
    }
  }

  @Post('create')
  @HttpCode(200) // Express answers create with res.json (200), not the POST-default 201.
  async create(@CurrentUser() user: User, @Req() req: Request) {
    if (!this.backup.checkRateLimit(req.ip || 'unknown', 3, this.backup.rateWindow)) {
      throw new HttpException({ error: 'Too many backup requests. Please try again later.' }, 429);
    }
    try {
      const backup = await this.backup.createBackup();
      this.audit.writeAudit({
        userId: user.id,
        action: 'backup.create',
        resource: backup.filename,
        ip: getClientIp(req),
        details: { size: backup.size },
      });
      return { success: true, backup };
    } catch {
      throw new HttpException({ error: 'Error creating backup' }, 500);
    }
  }

  @Get('download/:filename')
  async download(@Param('filename') filename: string, @Res() res: Response): Promise<void> {
    if (!this.backup.isValidBackupFilename(filename)) {
      throw new HttpException({ error: 'Invalid filename' }, 400);
    }
    if (!(await this.backup.backupFileExists(filename))) {
      throw new HttpException({ error: 'Backup not found' }, 404);
    }
    try {
      await this.backup.sendBackupToResponse(filename, res);
    } catch (err) {
      // The pre-check above owns the normal miss; this only covers a delete
      // racing between the check and the send.
      if (err instanceof StorageNotFoundError) {
        throw new HttpException({ error: 'Backup not found' }, 404);
      }
      throw err;
    }
  }

  @ManagedForbidden('a restore replaces database and uploads, and the operator owns the recovery point')
  @Post('restore/:filename')
  @HttpCode(200) // Express answers restore with res.json (200).
  async restore(@CurrentUser() user: User, @Param('filename') filename: string, @Req() req: Request) {
    if (!this.backup.isValidBackupFilename(filename)) {
      throw new HttpException({ error: 'Invalid filename' }, 400);
    }
    if (!(await this.backup.backupFileExists(filename))) {
      throw new HttpException({ error: 'Backup not found' }, 404);
    }
    try {
      const result = await this.backup.restoreBackup(filename);
      if (!result.success) {
        throw new HttpException({ error: result.error }, result.status || 400);
      }
      this.audit.writeAudit({ userId: user.id, action: 'backup.restore', resource: filename, ip: getClientIp(req) });
      return { success: true };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException({ error: 'Error restoring backup' }, 500);
    }
  }

  @ManagedForbidden('restoring from an uploaded archive replaces the database and the encryption key', {
    enforcedInHandler: true,
  })
  @Post('upload-restore')
  @HttpCode(200) // Express answers upload-restore with res.json (200).
  @UseInterceptors(FileInterceptor('backup'))
  async uploadRestore(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ) {
    // Checked here rather than in the guard: a guard runs before the multipart
    // parser, so throwing there leaves the body unread and the client sees an
    // ECONNRESET instead of this 403 (PROFILE-015). The marker above still puts
    // the route in the boot-gate inventory.
    if (isManagedBlocked(this.env)) {
      throw new HttpException(MANAGED_FORBIDDEN_ERROR, 403);
    }
    if (!file) {
      throw new HttpException({ error: 'No file uploaded' }, 400);
    }
    const zipPath = file.path;
    const origName = file.originalname || 'upload.zip';
    try {
      const result = await this.backup.restoreFromZip(zipPath);
      if (!result.success) {
        throw new HttpException({ error: result.error }, result.status || 400);
      }
      this.audit.writeAudit({
        userId: user.id,
        action: 'backup.upload_restore',
        resource: origName,
        ip: getClientIp(req),
      });
      return { success: true };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException({ error: 'Error restoring backup' }, 500);
    } finally {
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    }
  }

  @Get('auto-settings')
  autoSettings() {
    try {
      return this.autoBackup.getAutoSettings();
    } catch (err) {
      console.error('[backup] GET auto-settings:', err);
      throw new HttpException({ error: 'Could not load backup settings' }, 500);
    }
  }

  @ManagedForbidden('the operator schedules backups off-volume; a second schedule inside it is not one')
  @Put('auto-settings')
  updateAutoSettings(@CurrentUser() user: User, @Body() body: AutoBackupSettingsDto, @Req() req: Request) {
    try {
      const settings = this.autoBackup.updateAutoSettings(body || {});
      this.audit.writeAudit({
        userId: user.id,
        action: 'backup.auto_settings',
        ip: getClientIp(req),
        details: { enabled: settings.enabled, interval: settings.interval, keep_days: settings.keep_days },
      });
      return { settings };
    } catch (err) {
      console.error('[backup] PUT auto-settings:', err);
      const msg = err instanceof Error ? err.message : String(err);
      throw new HttpException(
        { error: 'Could not save auto-backup settings', detail: !readEnv().app.isProduction ? msg : undefined },
        500,
      );
    }
  }

  @Delete(':filename')
  async remove(@CurrentUser() user: User, @Param('filename') filename: string, @Req() req: Request) {
    if (!this.backup.isValidBackupFilename(filename)) {
      throw new HttpException({ error: 'Invalid filename' }, 400);
    }
    if (!(await this.backup.backupFileExists(filename))) {
      throw new HttpException({ error: 'Backup not found' }, 404);
    }
    await this.backup.deleteBackup(filename);
    this.audit.writeAudit({ userId: user.id, action: 'backup.delete', resource: filename, ip: getClientIp(req) });
    return { success: true };
  }
}
