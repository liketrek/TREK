import { Module } from '@nestjs/common';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { RouteUsageController } from './route-usage.controller';
import { RouteUsageRetentionJob } from './route-usage.job';
import { RouteUsageService } from './route-usage.service';

/**
 * Routing usage counters. Registered in AppModule; exports the service so an admin
 * surface can read the summary without going through HTTP.
 */
@Module({
  imports: [SchedulingModule],
  controllers: [RouteUsageController],
  providers: [RouteUsageService, RouteUsageRetentionJob],
  exports: [RouteUsageService],
})
export class RouteUsageModule {}
