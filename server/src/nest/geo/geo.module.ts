import { Module } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';

/**
 * The single Nominatim seam.
 *
 * A leaf that imports nothing and is registered straight in AppModule, rather
 * than imported by MapsModule and AtlasModule. That is not an oversight: both
 * domains reach `nominatimFetch` as a module-level primitive, because the
 * bridges have to reach the very same throttle cursor from outside the
 * container. An import here would claim an injection edge that does not exist.
 * What the module contributes is the lifecycle hook that starts and stops the
 * cache's cleanup timer.
 */
@Module({
  providers: [GeocodingService],
  exports: [GeocodingService],
})
export class GeoModule {}
