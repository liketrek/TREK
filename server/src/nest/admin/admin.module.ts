import { AddonsModule } from '../addons/addons.module';
import { AppConfigModule } from '../app-config/app-config.module';
import { AuditModule } from '../audit/audit.module';
// AuthModule exports PasskeyService for the admin passkey-reset endpoint.
import { AuthModule } from '../auth/auth.module';
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
import { SettingsModule } from '../settings/settings.module';
import { TokensModule } from '../tokens/tokens.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DemoResetJob } from './demo-reset.job';
import { VersionCheckJob } from './version-check.job';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    AppConfigModule,
    PluginsRuntimeModule,
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
  ],
  controllers: [AdminController],
  providers: [AdminService, VersionCheckJob, DemoResetJob],
})
export class AdminModule {}
