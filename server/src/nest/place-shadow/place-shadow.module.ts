import { AppSettings } from '../../db/entities/AppSettings.entity';
import { PlaceShadowPicks } from '../../db/entities/PlaceShadowPicks.entity';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { PlaceShadowController } from './place-shadow.controller';
import { PlaceShadowRetentionJob } from './place-shadow.job';
import { PlaceShadowService } from './place-shadow.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Place shadow log. Registered in AppModule; exports the service so the admin
 * surface can read the summary without going through HTTP.
 *
 * MikroOrmModule.forFeature registers PlaceShadowPicksRepository/
 * AppSettingsRepository for PlaceShadowService's @InjectRepository
 * constructor (Plan 3c Task 1).
 */
@Module({
  imports: [SchedulingModule, MikroOrmModule.forFeature([PlaceShadowPicks, AppSettings])],
  controllers: [PlaceShadowController],
  providers: [PlaceShadowService, PlaceShadowRetentionJob],
  exports: [PlaceShadowService],
})
export class PlaceShadowModule {}
