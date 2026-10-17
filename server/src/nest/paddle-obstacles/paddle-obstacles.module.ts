import { PaddleFeatures } from '../../db/entities/PaddleFeatures.entity';
import { PaddleRegions } from '../../db/entities/PaddleRegions.entity';
import { AddonsModule } from '../addons/addons.module';
import { AuditModule } from '../audit/audit.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { GeofabrikClient } from './geofabrik.client';
import { PaddleObstaclesController, PaddleRegionsController } from './paddle-obstacles.controller';
import { PaddleObstaclesService } from './paddle-obstacles.service';
import { PaddleRegionsJob } from './paddle-regions.job';
import { PaddleRegionsService } from './paddle-regions.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * PAD-05A: paddle obstacles from OpenStreetMap. The regions an admin chose,
 * their background reads from Geofabrik's extracts, and the objects of a map
 * area for the planner. PaddleObstaclesService is exported for the tours
 * domain's route checks (PAD-06, PAD-09).
 */
@Module({
  imports: [AddonsModule, AuditModule, SchedulingModule, MikroOrmModule.forFeature([PaddleRegions, PaddleFeatures])],
  controllers: [PaddleObstaclesController, PaddleRegionsController],
  providers: [GeofabrikClient, PaddleObstaclesService, PaddleRegionsService, PaddleRegionsJob],
  exports: [PaddleObstaclesService],
})
export class PaddleObstaclesModule {}
