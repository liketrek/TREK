import { Module } from '@nestjs/common';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';

/** Budget domain (S4 — Phase 2 trip sub-domain). Registered in AppModule. */
@Module({
  controllers: [BudgetController],
  providers: [BudgetService],
})
export class BudgetModule {}
