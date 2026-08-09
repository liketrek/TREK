import { Module } from '@nestjs/common';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { BudgetMcp } from './budget.mcp';
import { ExchangeRatesService } from './exchange-rates.service';
import { ExchangeRatesRpc } from './exchange-rates.rpc';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';

/** Budget domain (S4 — Phase 2 trip sub-domain). Registered in AppModule.
 *  BudgetMcp carries the decorator-registered MCP tools + resources. */
@Module({
  imports: [PermissionsModule, AuthModule],
  controllers: [BudgetController],
  providers: [BudgetService, ExchangeRatesService, BudgetMcp, ExchangeRatesRpc],
  // For in-container consumers (PluginHostDepsFactory, TripsService,
  // ReservationsService, BookingImportService).
  exports: [BudgetService, ExchangeRatesService],
})
export class BudgetModule {}
