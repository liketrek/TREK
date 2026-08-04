import { Module } from '@nestjs/common';
import { TransitController } from './transit.controller';
import { TransitService } from './transit.service';
import { TransitMcp } from './transit.mcp';
import { RateLimitService } from '../auth/rate-limit.service';
import { DaysModule } from '../days/days.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Transit domain (#1065) — the Transitous/MOTIS proxy. TransitMcp carries the
 * decorator-registered MCP tools; DaysModule/ReservationsModule feed
 * create_transit_journey. Exports TransitService for in-container consumers.
 */
@Module({
  // DaysModule + ReservationsModule: TransitMcp's create_transit_journey injects both.
  imports: [DaysModule, ReservationsModule, AuthModule],
  controllers: [TransitController],
  providers: [TransitService, TransitMcp, RateLimitService],
  exports: [TransitService],
})
export class TransitModule {}
