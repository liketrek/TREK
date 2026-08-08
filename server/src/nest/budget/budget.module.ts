import { Module } from '@nestjs/common';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { GlobalExchangeRateController, TripExchangeRateController } from './exchange-rate.controller';

/** Budget domain (S4 — Phase 2 trip sub-domain). Registered in AppModule. */
@Module({
  controllers: [BudgetController, GlobalExchangeRateController, TripExchangeRateController],
  providers: [BudgetService],
})
export class BudgetModule {}
