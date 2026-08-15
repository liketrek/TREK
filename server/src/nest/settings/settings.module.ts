import { Module } from '@nestjs/common';
import { AdminDefaultUserSettingsController, SettingsController } from './settings.controller';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { SettingsService } from './settings.service';
import { AppConfigModule } from '../app-config/app-config.module';

/** Exports SettingsService for in-container consumers (admin, share, llm-parse). */
@Module({
  // AuthModule for the admin gate on the defaults routes.
  imports: [AppConfigModule, AuthModule, AuditModule],
  controllers: [SettingsController, AdminDefaultUserSettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
