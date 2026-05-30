import { Module } from '@nestjs/common';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';

@Module({
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}
