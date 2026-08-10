import { Module } from '@nestjs/common';
import { FeaturesController } from './features.controller';
import { KitineraryExtractorModule } from '../booking-import/kitinerary-extractor.module';
import { AddonsModule } from '../addons/addons.module';

/** Server capability reporting. `GET /api/health/features` tells the client which
 *  optional server-side features are usable, so it can hide the affordances it
 *  cannot back. `GET /api/health` itself is the container probe and stays on the
 *  raw express layer (`platform.routes.ts`) — it must answer before Nest routing
 *  and before the HTTPS redirect. */
@Module({
  imports: [KitineraryExtractorModule, AddonsModule],
  controllers: [FeaturesController],
})
export class HealthModule {}
