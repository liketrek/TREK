import { SchoolHolidayRegions } from '../../db/entities/SchoolHolidayRegions.entity';
import { VacayCompanyHolidays } from '../../db/entities/VacayCompanyHolidays.entity';
import { VacayEntries } from '../../db/entities/VacayEntries.entity';
import { VacayHolidayCalendars } from '../../db/entities/VacayHolidayCalendars.entity';
import { VacayPlanMembers } from '../../db/entities/VacayPlanMembers.entity';
import { VacayPlans } from '../../db/entities/VacayPlans.entity';
import { VacayShares } from '../../db/entities/VacayShares.entity';
import { VacayUserColors } from '../../db/entities/VacayUserColors.entity';
import { VacayUserSettings } from '../../db/entities/VacayUserSettings.entity';
import { VacayUserYears } from '../../db/entities/VacayUserYears.entity';
import { VacayYears } from '../../db/entities/VacayYears.entity';
import { PluginGuardsModule } from '../../nest-rpc/plugin-guards.module';
import { AddonsModule } from '../addons/addons.module';
import { UserLookupModule } from '../auth-core/user-lookup.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { VacayController } from './vacay.controller';
import { VacayMcp } from './vacay.mcp';
import { VacayRpc } from './vacay.rpc';
import { VacayService } from './vacay.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Vacay addon domain (S1 — Phase 2 trip sub-domain). Registered in AppModule.
 * VacayService is exported for the plugin host surface (VacayRpc);
 * VacayMcp carries the DI-discovered MCP tools/resources.
 *
 * `MikroOrmModule.forFeature([...])` (Plan 3f Task 5) registers every
 * repository `VacayService`'s constructor injects via `@InjectRepository`:
 * the ten vacay tables plus `SchoolHolidayRegions` (Task 2's, additive —
 * `validateManualRegion`'s VC45 cross-domain read consumes its
 * `existsForCountry` method; this module never writes to that table). No
 * OTHER module constructs `VacayService` directly (`TripsModule` only
 * imports `VacayModule` and injects the exported provider), so this is the
 * only `forFeature` array the BOOT GATE requires updating.
 */
@Module({
  imports: [
    NotificationsModule,
    // VacayMcp's invite and share tools read the caller's username/email.
    UserLookupModule,
    PluginGuardsModule,
    AddonsModule,
    MikroOrmModule.forFeature([
      VacayPlans,
      VacayPlanMembers,
      VacayYears,
      VacayUserYears,
      VacayUserColors,
      VacayEntries,
      VacayCompanyHolidays,
      VacayHolidayCalendars,
      VacayShares,
      VacayUserSettings,
      SchoolHolidayRegions,
    ]),
  ],
  controllers: [VacayController],
  providers: [VacayService, VacayMcp, VacayRpc],
  exports: [VacayService],
})
export class VacayModule {}
