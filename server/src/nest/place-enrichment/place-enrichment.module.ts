import { AppSettings } from '../../db/entities/AppSettings.entity';
import { PlaceDetailsCache } from '../../db/entities/PlaceDetailsCache.entity';
import { RateLimitModule } from '../common/rate-limit.module';
import { MapsModule } from '../maps/maps.module';
import { PlacePhotosModule } from '../place-photos/place-photos.module';
import { PlaceEnrichmentController } from './place-enrichment.controller';
import { PlaceEnrichmentService } from './place-enrichment.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Place enrichment (L4 leaf module). Registered in AppModule.
 *
 * Consumes MapsService for the provider primitives and PlacePhotoCacheService
 * for the picture bytes — both already single instances in the container, which
 * matters here: the photo cache's stampede guard and the maps concurrency limit
 * only hold if this module queues behind the same ones everything else uses.
 * Nothing outside the container consumes it, so there is no bridge.
 *
 * MikroOrmModule.forFeature registers PlaceDetailsCacheRepository/
 * AppSettingsRepository for PlaceEnrichmentService's @InjectRepository
 * constructor (Plan 3c Task 1).
 */
@Module({
  imports: [
    MapsModule,
    PlacePhotosModule,
    RateLimitModule,
    MikroOrmModule.forFeature([PlaceDetailsCache, AppSettings]),
  ],
  controllers: [PlaceEnrichmentController],
  providers: [PlaceEnrichmentService],
})
export class PlaceEnrichmentModule {}
