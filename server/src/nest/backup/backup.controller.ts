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
  list() {
    try {
      return { backups: this.backup.listBackups() };
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

  @Delete(':filename')
  remove(@CurrentUser() user: User, @Param('filename') filename: string, @Req() req: Request) {
    if (!this.backup.isValidBackupFilename(filename)) {
      throw new HttpException({ error: 'Invalid filename' }, 400);
    }
    if (!this.backup.backupFileExists(filename)) {
      throw new HttpException({ error: 'Backup not found' }, 404);
    }
    this.backup.deleteBackup(filename);
    writeAudit({ userId: user.id, action: 'backup.delete', resource: filename, ip: getClientIp(req) });
    return { success: true };
  }
}
