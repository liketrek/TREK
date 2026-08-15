import { Module } from '@nestjs/common';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { AutoBackupJob } from './auto-backup.job';
import { AuditModule } from '../audit/audit.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { AppConfigModule } from '../app-config/app-config.module';

@Module({
  imports: [AppConfigModule, AuditModule, SchedulingModule],
  controllers: [BackupController],
  providers: [BackupService, AutoBackupJob],
})
export class BackupModule {}
