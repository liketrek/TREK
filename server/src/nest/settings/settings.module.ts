import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AdminDefaultUserSettingsController, SettingsController } from './settings.controller';
import { AuditModule } from '../audit/audit.module';
import { SettingsService } from './settings.service';
import { SettingsMcp } from './settings.mcp';
import { AppConfigModule } from '../app-config/app-config.module';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import { Settings } from '../../db/entities/Settings.entity';

/** Exports SettingsService for in-container consumers (admin, share, llm-parse, journey, roadtrip, trips). */
@Module({
  // MikroOrmModule.forFeature
  // registers AppSettingsRepository/SettingsRepository for the
  // @InjectRepository(...) constructor params below (Plan 3a Task 0/5) — the
  // forFeature + @InjectRepository wiring pattern every later domain copies.
  // No `Users` entry: `instance-api-keys.ts`'s repository-backed functions
  // take a `UsersRepository` as an explicit parameter from their caller
  // (nothing resolves it off an ambient MikroORM request context — an
  // earlier design tried that and broke ~185 hand-built unit tests, see
  // task-5-review.md §4), so nothing in this module ever needs
  // `@InjectRepository(Users)`.
  imports: [AppConfigModule, AuditModule, MikroOrmModule.forFeature([AppSettings, Settings])],
  controllers: [SettingsController, AdminDefaultUserSettingsController],
  providers: [SettingsService, SettingsMcp],
  exports: [SettingsService],
})
export class SettingsModule {}
