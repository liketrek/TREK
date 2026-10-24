import { AppSettings } from '../../db/entities/AppSettings.entity';
import { RouteUsageDaily } from '../../db/entities/RouteUsageDaily.entity';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { RouteUsageController } from './route-usage.controller';
import { RouteUsageRetentionJob } from './route-usage.job';
import { RouteUsageService } from './route-usage.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Routing usage counters. Registered in AppModule; exports the service so an admin
 * surface can read the summary without going through HTTP.
 *
 * MikroOrmModule.forFeature([RouteUsageDaily, AppSettings]) (Plan 3h Task 4):
 * `RouteUsageService` reaches its own table's repository (R4's additive
 * upsert) plus `AppSettingsRepository` for the enabled/kill-switch read.
 */
@Module({
  imports: [SchedulingModule, MikroOrmModule.forFeature([RouteUsageDaily, AppSettings])],
  controllers: [RouteUsageController],
  providers: [RouteUsageService, RouteUsageRetentionJob],
  exports: [RouteUsageService],
})
export class RouteUsageModule {}
