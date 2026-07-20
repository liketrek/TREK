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
import type { User } from '../../types';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { writeAudit, getClientIp } from '../../services/auditLog';
import { getUploadTmpDir, MAX_BACKUP_UPLOAD_SIZE } from '../../services/backupService';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  backupTargetRequestSchema,
  type BackupTargetBackfillResult,
  type ChannelTestResult,
  type BackupTargetRequest,
  type BackupTargetResponse,
} from '@trek/shared';

const UPLOAD = {
  dest: getUploadTmpDir(),
  fileFilter: (_req: unknown, file: Express.Multer.File, cb: (err: Error | null, accept: boolean) => void) => {
    if (file.originalname.endsWith('.zip')) return cb(null, true);
    cb(new Error('Only ZIP files allowed'), false);
  },
  limits: { fileSize: MAX_BACKUP_UPLOAD_SIZE },
};

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
  constructor(private readonly backup: BackupService) {}

  @Get('list')
  async list() {
    try {
      // Merged across disk and the external target. A remote outage degrades to
      // the local list plus `remoteError` rather than failing the whole call —
      // an unreachable bucket must never hide the backups you still have.
      return await this.backup.listBackupsMerged();
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
      writeAudit({ userId: user.id, action: 'backup.create', resource: backup.filename, ip: getClientIp(req), details: { size: backup.size } });
      return { success: true, backup };
    } catch {
      throw new HttpException({ error: 'Error creating backup' }, 500);
    }
  }

  @Get('download/:filename')
  download(@Param('filename') filename: string, @Res() res: Response): void {
    if (!this.backup.isValidBackupFilename(filename)) {
      throw new HttpException({ error: 'Invalid filename' }, 400);
    }
    if (!this.backup.backupFileExists(filename)) {
      throw new HttpException({ error: 'Backup not found' }, 404);
    }
    res.download(this.backup.backupFilePath(filename), filename);
  }

  @Post('restore/:filename')
  @HttpCode(200) // Express answers restore with res.json (200).
  async restore(@CurrentUser() user: User, @Param('filename') filename: string, @Req() req: Request) {
    if (!this.backup.isValidBackupFilename(filename)) {
      throw new HttpException({ error: 'Invalid filename' }, 400);
    }
    if (!this.backup.backupFileExists(filename)) {
      throw new HttpException({ error: 'Backup not found' }, 404);
    }
    try {
      const result = await this.backup.restoreFromZip(this.backup.backupFilePath(filename));
      if (!result.success) {
        throw new HttpException({ error: result.error }, result.status || 400);
      }
      writeAudit({ userId: user.id, action: 'backup.restore', resource: filename, ip: getClientIp(req) });
      return { success: true };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException({ error: 'Error restoring backup' }, 500);
    }
  }

  @Post('upload-restore')
  @HttpCode(200) // Express answers upload-restore with res.json (200).
  @UseInterceptors(FileInterceptor('backup', UPLOAD))
  async uploadRestore(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File | undefined, @Req() req: Request) {
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
      writeAudit({ userId: user.id, action: 'backup.upload_restore', resource: origName, ip: getClientIp(req) });
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
      return this.backup.getAutoSettings();
    } catch (err) {
      console.error('[backup] GET auto-settings:', err);
      throw new HttpException({ error: 'Could not load backup settings' }, 500);
    }
  }

  @Put('auto-settings')
  updateAutoSettings(@CurrentUser() user: User, @Body() body: Record<string, unknown>, @Req() req: Request) {
    try {
      const settings = this.backup.updateAutoSettings(body || {});
      writeAudit({ userId: user.id, action: 'backup.auto_settings', ip: getClientIp(req), details: { enabled: settings.enabled, interval: settings.interval, keep_days: settings.keep_days } });
      return { settings };
    } catch (err) {
      console.error('[backup] PUT auto-settings:', err);
      const msg = err instanceof Error ? err.message : String(err);
      throw new HttpException({ error: 'Could not save auto-backup settings', detail: process.env.NODE_ENV?.toLowerCase() !== 'production' ? msg : undefined }, 500);
    }
  }

  // --- External S3 backup target -------------------------------------------

  @Get('target')
  getTarget(): BackupTargetResponse {
    try {
      return this.backup.readTarget();
    } catch (err) {
      console.error('[backup] GET target:', err);
      throw new HttpException({ error: 'Could not load the backup target' }, 500);
    }
  }

  @Put('target')
  saveTarget(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(backupTargetRequestSchema)) body: BackupTargetRequest,
    @Req() req: Request,
  ) {
    // An env-configured target would silently ignore an edit — say so instead
    // of accepting a write that cannot take effect.
    if (this.backup.targetManagedByEnv()) {
      throw new HttpException(
        { error: 'The storage backends are configured through BACKUP_LOCAL_* / BACKUP_S3_* environment variables and cannot be edited here.' },
        409,
      );
    }
    try {
      this.backup.saveTarget(body);
    } catch (err) {
      console.error('[backup] PUT target:', err);
      throw new HttpException({ error: 'Could not save the backup target' }, 500);
    }
    // The secret never reaches the audit log — only whether one was supplied.
    writeAudit({
      userId: user.id,
      action: 'backup.target_settings',
      ip: getClientIp(req),
      details: {
        local_enabled: body.local_enabled,
        s3_enabled: body.s3_enabled,
        bucket: body.bucket,
        endpoint: body.endpoint,
        secret_updated: body.secret_access_key !== undefined,
      },
    });
    return this.backup.readTarget();
  }

  @Post('target/test')
  @HttpCode(200) // A failed probe is a successful test call reporting failure.
  async testTarget(@CurrentUser() user: User, @Req() req: Request): Promise<ChannelTestResult> {
    const result = await this.backup.testTarget();
    writeAudit({
      userId: user.id,
      action: 'backup.target_test',
      ip: getClientIp(req),
      details: { success: result.success },
    });
    return result;
  }

  @Post('restore-remote/:filename')
  @HttpCode(200)
  async restoreRemote(@CurrentUser() user: User, @Param('filename') filename: string, @Req() req: Request) {
    // Same filename shape check the local paths use — it is what keeps a crafted
    // name from escaping the prefix when it becomes an object key.
    if (!this.backup.isValidBackupFilename(filename)) {
      throw new HttpException({ error: 'Invalid filename' }, 400);
    }
    try {
      const result = await this.backup.restoreFromRemote(filename);
      if (!result.success) {
        throw new HttpException({ error: result.error }, result.status || 400);
      }
      writeAudit({ userId: user.id, action: 'backup.restore_remote', resource: filename, ip: getClientIp(req) });
      return { success: true };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      console.error('[backup] restore-remote:', err);
      throw new HttpException({ error: 'Error restoring the backup from the external target' }, 500);
    }
  }

  @Post('target/sync')
  @HttpCode(200)
  async syncTarget(@CurrentUser() user: User, @Req() req: Request): Promise<BackupTargetBackfillResult> {
    const result = await this.backup.mirrorExistingBackups();
    writeAudit({
      userId: user.id,
      action: 'backup.target_backfill',
      ip: getClientIp(req),
      details: { total: result.total, uploaded: result.uploaded, skipped: result.skipped, failed: result.failed },
    });
    return result;
  }

  @Delete(':filename')
  async remove(@CurrentUser() user: User, @Param('filename') filename: string, @Req() req: Request) {
    if (!this.backup.isValidBackupFilename(filename)) {
      throw new HttpException({ error: 'Invalid filename' }, 400);
    }
    // An S3-only archive is listed in the UI and must be deletable there too,
    // so the precondition is "exists in EITHER place" rather than "exists on
    // disk". deleteBackup removes whichever copies are actually present.
    const { found, remoteError } = await this.backup.deleteBackup(filename);
    if (!found) {
      throw new HttpException({ error: 'Backup not found' }, 404);
    }
    writeAudit({ userId: user.id, action: 'backup.delete', resource: filename, ip: getClientIp(req), details: { remoteError } });
    return { success: true, remoteError };
  }
}
