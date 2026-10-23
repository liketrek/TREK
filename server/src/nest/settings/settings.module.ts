import { AppSettings } from '../../db/entities/AppSettings.entity';
import { Settings } from '../../db/entities/Settings.entity';
import { AppConfigModule } from '../app-config/app-config.module';
import { AuditModule } from '../audit/audit.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { SettingsWritesService } from './settings-writes.service';
import { AdminDefaultUserSettingsController, SettingsController } from './settings.controller';
import { SettingsMcp } from './settings.mcp';
import { SettingsService } from './settings.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Exports SettingsService for in-container consumers (admin, share, llm-parse,
 * journey, roadtrip, trips, and paddle-obstacles for its instance settings).
 */
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
  // `@InjectRepository(Users)`. TripMembershipModule is here for the planner
  // view row (#2639), which keeps only trips the user can still open: the
  // trips table belongs to another domain, so the ids come from its service.
  // RealtimeModule for SettingsWritesService, which tells a user's other tabs which keys changed.
  imports: [
    AppConfigModule,
    AuditModule,
    TripMembershipModule,
    RealtimeModule,
    MikroOrmModule.forFeature([AppSettings, Settings]),
  ],
  controllers: [SettingsController, AdminDefaultUserSettingsController],
  providers: [SettingsService, SettingsWritesService, SettingsMcp],
  exports: [SettingsService],
})
export class SettingsModule {}
