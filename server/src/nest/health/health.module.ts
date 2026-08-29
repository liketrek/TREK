import { AddonsModule } from '../addons/addons.module';
import { KitineraryExtractorModule } from '../booking-import/kitinerary-extractor.module';
import { FeaturesController } from './features.controller';
import { Module } from '@nestjs/common';

/** Server capability reporting. `GET /api/health/features` tells the client which
 *  optional server-side features are usable, so it can hide the affordances it
 *  cannot back. `GET /api/health` is the container probe — the forced-HTTPS
 *  redirect and HSTS exempt it by path inside globalMiddleware, so it answers
 *  plain-HTTP probes no matter where the route itself is registered. */
@Module({
  imports: [KitineraryExtractorModule, AddonsModule],
  controllers: [FeaturesController],
})
export class HealthModule {}
