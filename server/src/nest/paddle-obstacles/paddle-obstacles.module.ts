import { AppSettings } from '../../db/entities/AppSettings.entity';
import { PaddleFeatures } from '../../db/entities/PaddleFeatures.entity';
import { PaddleRegionRequests } from '../../db/entities/PaddleRegionRequests.entity';
import { PaddleRegions } from '../../db/entities/PaddleRegions.entity';
import { AddonsModule } from '../addons/addons.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaddleRoutingModule } from '../paddle-routing/paddle-routing.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { GeofabrikClient } from './geofabrik.client';
import { PADDLE_IMPORT_RUNNER, importRunner } from './import-runner';
import { PaddleObstaclesController, PaddleRegionsController } from './paddle-obstacles.controller';
import { PaddleObstaclesService } from './paddle-obstacles.service';
import { PaddleRegionLoadService } from './paddle-region-load.service';
import { PaddleRegionsJob } from './paddle-regions.job';
import { PaddleRegionsService } from './paddle-regions.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * PAD-05A: paddle obstacles from OpenStreetMap. The regions an admin chose,
 * their background reads from Geofabrik's extracts, and the objects of a map
 * area for the planner. The same read builds the region's water network,
 * which it hands to the paddle routing domain (PAD-11). Where a paddler plans
 * outside every region, the region around the place is loaded or asked for by
 * itself (PAD-11C). PaddleObstaclesService is exported for the tours domain's
 * route checks (PAD-06, PAD-09).
 */
@Module({
  imports: [
    AddonsModule,
    AuditModule,
    NotificationsModule,
    SchedulingModule,
    PaddleRoutingModule,
    MikroOrmModule.forFeature([PaddleRegions, PaddleFeatures, PaddleRegionRequests, AppSettings]),
  ],
  controllers: [PaddleObstaclesController, PaddleRegionsController],
  providers: [
    GeofabrikClient,
    PaddleObstaclesService,
    PaddleRegionsService,
    PaddleRegionLoadService,
    PaddleRegionsJob,
    { provide: PADDLE_IMPORT_RUNNER, useFactory: importRunner },
  ],
  exports: [PaddleObstaclesService],
})
export class PaddleObstaclesModule {}
