import { BudgetCategoryOrder } from '../../db/entities/BudgetCategoryOrder.entity';
import { BudgetItemMembers } from '../../db/entities/BudgetItemMembers.entity';
import { BudgetItemPayers } from '../../db/entities/BudgetItemPayers.entity';
import { BudgetItems } from '../../db/entities/BudgetItems.entity';
import { BudgetSettlements } from '../../db/entities/BudgetSettlements.entity';
import { Places } from '../../db/entities/Places.entity';
import { Reservations } from '../../db/entities/Reservations.entity';
import { TripMembers } from '../../db/entities/TripMembers.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { AddonsModule } from '../addons/addons.module';
import { AppConfigModule } from '../app-config/app-config.module';
import { DemoModule } from '../common/demo.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { BudgetController } from './budget.controller';
import { BudgetMcp } from './budget.mcp';
import { BudgetService } from './budget.service';
import { CostsRpc } from './costs.rpc';
import { ExchangeRatesRpc } from './exchange-rates.rpc';
import { ExchangeRatesService } from './exchange-rates.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/** Budget domain (S4 — Phase 2 trip sub-domain). Registered in AppModule.
 *  BudgetMcp carries the decorator-registered MCP tools + resources.
 *  AuthModule is deliberately absent (BudgetMcp's demo guard reads
 *  RuntimeEnvService + the users table, not AuthService) — that absence is
 *  what lets AuthModule import BudgetModule for UserCleanupService.
 *  AppConfigModule is @Global in the app graph; the explicit import keeps the
 *  partial e2e TestingModules resolving RuntimeEnvService. DemoModule is
 *  @Global for the same reason (Plan 3i Task 4 fix wave) — BudgetMcp injects
 *  DemoService, and a hand-built TestingModule never imports AppModule, so
 *  the @Global broadcast never happens unless this module imports it directly. */
@Module({
  imports: [
    McpSharedModule,
    PermissionsModule,
    AppConfigModule,
    DemoModule,
    RealtimeModule,
    PluginGuardsModule,
    AddonsModule,
    TripMembershipModule,
    MikroOrmModule.forFeature([
      BudgetItems,
      BudgetItemMembers,
      BudgetItemPayers,
      BudgetSettlements,
      BudgetCategoryOrder,
      Reservations,
      Places,
      Trips,
      TripMembers,
    ]),
  ],
  controllers: [BudgetController],
  providers: [BudgetService, ExchangeRatesService, BudgetMcp, ExchangeRatesRpc, CostsRpc],
  // For in-container consumers (CostsRpc, TripsService,
  // ReservationsService, BookingImportService).
  exports: [BudgetService, ExchangeRatesService],
})
export class BudgetModule {}
