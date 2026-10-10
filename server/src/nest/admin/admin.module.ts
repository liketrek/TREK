import { Addons } from '../../db/entities/Addons.entity';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import { AuditLog } from '../../db/entities/AuditLog.entity';
import { DocumentProviders } from '../../db/entities/DocumentProviders.entity';
import { McpTokens } from '../../db/entities/McpTokens.entity';
import { OauthTokens } from '../../db/entities/OauthTokens.entity';
import { PhotoProviderFields } from '../../db/entities/PhotoProviderFields.entity';
import { PhotoProviders } from '../../db/entities/PhotoProviders.entity';
import { Places } from '../../db/entities/Places.entity';
import { PushSubscriptions } from '../../db/entities/PushSubscriptions.entity';
import { TripFiles } from '../../db/entities/TripFiles.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { Users } from '../../db/entities/Users.entity';
import { AddonsModule } from '../addons/addons.module';
import { AppConfigModule } from '../app-config/app-config.module';
import { AuditModule } from '../audit/audit.module';
// AuthModule exports PasskeyService for the admin passkey-reset endpoint.
import { AuthModule } from '../auth/auth.module';
import { KitineraryExtractorModule } from '../booking-import/kitinerary-extractor.module';
// AdminService and DemoResetJob inject DATABASE_BACKUP, which the @Global
// DatabaseBackupModule (nest/backup/) provides once BackupModule is in the
// graph. It is not imported here on purpose: see that module for the cycle an
// import would close.
// DemoResetJob also listens for reopens on DatabaseLifecycle (the shared
// database kernel, not a domain), to save the first demo baseline after a
// restore's re-bootstrap seeded the example trips.
import { DatabaseLifecycleModule } from '../database/database-lifecycle.module';
// NotificationsModule exports NotificationsService for the dev test-notification send.
import { NotificationsModule } from '../notifications/notifications.module';
import { OauthModule } from '../oauth/oauth.module';
// PackingModule exports PackingService, which owns the packing-template tables
// backing the admin /packing-templates routes. Cycle-free: PackingModule imports
// only PermissionsModule + AuthModule, neither of which reaches AdminModule.
import { PackingModule } from '../packing/packing.module';
// PermissionsModule exports PermissionsService for the permission matrix — it is
// not @Global, so the import must be explicit.
import { PermissionsModule } from '../permissions/permissions.module';
import { PluginsRuntimeModule } from '../plugins/plugins-runtime.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { SessionsModule } from '../sessions/sessions.module';
import { SettingsModule } from '../settings/settings.module';
import { TokensModule } from '../tokens/tokens.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DemoResetJob } from './demo-reset.job';
import { VersionCheckJob } from './version-check.job';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * MikroOrmModule.forFeature registers the repositories `AdminService`'s
 * `@InjectRepository` constructor needs (Plan 3i Task 1 — AD1-AD40's
 * conversion off `DatabaseService`): `Users`/`AuditLog`/`AppSettings` for the
 * user-CRUD + audit-log + instance-settings surface, `Addons`/
 * `PhotoProviders`/`PhotoProviderFields`/`DocumentProviders` for the addon
 * shelf, `McpTokens`/`OauthTokens` for the password-reset session revoke, and
 * `Trips`/`Places`/`TripFiles` (owned by other domains, 3c/3e) for
 * `getStats`'s three bare cross-domain counts, and `PushSubscriptions` (owned
 * by notifications) so a password reset also forgets the user's push devices
 * — the same forFeature + @InjectRepository wiring pattern `AddonsModule`
 * already uses.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      Users,
      AuditLog,
      AppSettings,
      Addons,
      PhotoProviders,
      PhotoProviderFields,
      DocumentProviders,
      McpTokens,
      OauthTokens,
      Trips,
      Places,
      TripFiles,
      PushSubscriptions,
    ]),
    AppConfigModule,
    DatabaseLifecycleModule,
    PluginsRuntimeModule,
    SessionsModule,
    SettingsModule,
    AuditModule,
    AddonsModule,
    AuthModule,
    NotificationsModule,
    PackingModule,
    PermissionsModule,
    TokensModule,
    OauthModule,
    SchedulingModule,
    KitineraryExtractorModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, VersionCheckJob, DemoResetJob],
})
export class AdminModule {}
