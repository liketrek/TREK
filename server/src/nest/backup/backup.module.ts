import { AppConfigModule } from '../app-config/app-config.module';
import { AuditModule } from '../audit/audit.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { StorageModule } from '../storage/storage.module';
import { StorageService } from '../storage/storage.service';
import { AutoBackupJob } from './auto-backup.job';
import { BackupController } from './backup.controller';
import { MAX_BACKUP_UPLOAD_SIZE } from './backup.impl';
import { BackupService } from './backup.service';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

/**
 * Multer options for the restore upload. The uploaded zip is a restore INPUT,
 * not a stored object — it gets no storage category and spools to the
 * driver-agnostic scratch dir (data/tmp), where the handler consumes and
 * unlinks it. Resolved through DI so no path is computed at module load.
 */
export function buildBackupUploadOptions(storage: StorageService): MulterOptions {
  return {
    dest: storage.tempDir(),
    fileFilter: (_req: unknown, file: Express.Multer.File, cb: (err: Error | null, accept: boolean) => void) => {
      if (file.originalname.endsWith('.zip')) return cb(null, true);
      cb(new Error('Only ZIP files allowed'), false);
    },
    limits: { fileSize: MAX_BACKUP_UPLOAD_SIZE },
  };
}

@Module({
  imports: [
    AppConfigModule,
    AuditModule,
    SchedulingModule,
    StorageModule,
    MulterModule.registerAsync({
      imports: [StorageModule],
      inject: [StorageService],
      useFactory: buildBackupUploadOptions,
    }),
  ],
  controllers: [BackupController],
  providers: [BackupService, AutoBackupJob],
})
export class BackupModule {}
