import { AppSettings } from '../../db/entities/AppSettings.entity';
import { AppConfigModule } from '../app-config/app-config.module';
import { AuditModule } from '../audit/audit.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { StorageAdminController } from './storage-admin.controller';
import { StorageAdminService } from './storage-admin.service';
import { StorageEventsService } from './storage-events.service';
import { StorageJobsService } from './storage-jobs.service';
import { StorageRegistryService } from './storage-registry.service';
import { StorageStatsService } from './storage-stats.service';
import { StorageUsageScanJob } from './storage-usage-scan.job';
import { StorageService } from './storage.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Storage container: registry (config), facade (byte-paths), admin surface.
 * AuditModule feeds the write audits. AuthModule is deliberately NOT imported
 * here — AuthModule itself imports StorageModule (avatar uploads), so the
 * reverse import is a real module cycle (Nest resolves it as `imports[1] is
 * undefined`, not a clean forwardRef case). JwtAuthGuard/AdminGuard need no
 * provider from AuthModule to begin with — they carry no constructor
 * dependencies, so `@UseGuards(JwtAuthGuard, AdminGuard)` instantiates them
 * directly, the same as BackupModule/BackupController (which also sits behind
 * StorageModule) already does. StorageRegistryService stays UNEXPORTED — the
 * admin controller reaches it as a same-module provider, and nothing outside
 * may cache drivers or trigger reloads. MikroOrmModule.forFeature registers
 * AppSettingsRepository for StorageRegistryService/StorageAdminService/
 * StorageStatsService's @InjectRepository (Plan 3i, storage task — SR/SA/SS's
 * 14 call sites, all on app_settings).
 */
@Module({
  imports: [AppConfigModule, AuditModule, SchedulingModule, MikroOrmModule.forFeature([AppSettings])],
  controllers: [StorageAdminController],
  providers: [
    StorageRegistryService,
    StorageService,
    StorageAdminService,
    StorageEventsService,
    StorageJobsService,
    StorageStatsService,
    StorageUsageScanJob,
  ],
  exports: [StorageService, StorageEventsService],
})
export class StorageModule {}
