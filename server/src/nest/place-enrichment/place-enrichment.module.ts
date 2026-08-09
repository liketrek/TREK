import { Module } from '@nestjs/common';
import { MapsModule } from '../maps/maps.module';
import { PlacePhotosModule } from '../place-photos/place-photos.module';
import { RateLimitModule } from '../common/rate-limit.module';
import { PlaceEnrichmentController } from './place-enrichment.controller';
import { PlaceEnrichmentService } from './place-enrichment.service';

/**
 * Place enrichment (L4 leaf module). Registered in AppModule.
 *
 * Consumes MapsService for the provider primitives and PlacePhotoCacheService
 * for the picture bytes — both already single instances in the container, which
 * matters here: the photo cache's stampede guard and the maps concurrency limit
 * only hold if this module queues behind the same ones everything else uses.
 * Nothing outside the container consumes it, so there is no bridge.
 */
@Module({
  imports: [MapsModule, PlacePhotosModule, RateLimitModule],
  controllers: [PlaceEnrichmentController],
  providers: [PlaceEnrichmentService],
})
export class PlaceEnrichmentModule {}
