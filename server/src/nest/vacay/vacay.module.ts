import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { VacayController } from './vacay.controller';
import { VacayService } from './vacay.service';
import { VacayRpc } from './vacay.rpc';
import { PluginGuardsModule } from '../../nest-rpc/plugin-guards.module';
import { VacayMcp } from './vacay.mcp';
import { Users } from '../../db/entities/Users.entity';
import { AddonsModule } from '../addons/addons.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { VacayPlans } from '../../db/entities/VacayPlans.entity';
import { VacayPlanMembers } from '../../db/entities/VacayPlanMembers.entity';
import { VacayYears } from '../../db/entities/VacayYears.entity';
import { VacayUserYears } from '../../db/entities/VacayUserYears.entity';
import { VacayUserColors } from '../../db/entities/VacayUserColors.entity';
import { VacayEntries } from '../../db/entities/VacayEntries.entity';
import { VacayCompanyHolidays } from '../../db/entities/VacayCompanyHolidays.entity';
import { VacayHolidayCalendars } from '../../db/entities/VacayHolidayCalendars.entity';
import { VacayShares } from '../../db/entities/VacayShares.entity';
import { VacayUserSettings } from '../../db/entities/VacayUserSettings.entity';
import { SchoolHolidayRegions } from '../../db/entities/SchoolHolidayRegions.entity';

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
    PluginGuardsModule,
    AddonsModule,
    MikroOrmModule.forFeature([
      VacayPlans, VacayPlanMembers, VacayYears, VacayUserYears, VacayUserColors,
      VacayEntries, VacayCompanyHolidays, VacayHolidayCalendars, VacayShares, VacayUserSettings,
      SchoolHolidayRegions,
      // VacayMcp's invite and share tools read the caller's username/email.
      Users,
    ]),
  ],
  controllers: [VacayController],
  providers: [VacayService, VacayMcp, VacayRpc],
  exports: [VacayService],
})
export class VacayModule {}
