import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesDownloadController } from './files-download.controller';
import { FilesService } from './files.service';
import { PermissionsModule } from '../permissions/permissions.module';
import { AppConfigModule } from '../app-config/app-config.module';

@Module({
  imports: [PermissionsModule, AppConfigModule],
  controllers: [FilesController, FilesDownloadController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
