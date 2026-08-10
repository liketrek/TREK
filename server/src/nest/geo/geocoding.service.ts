import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { startGeoCacheCleanup, stopGeoCacheCleanup } from './nominatim.client';

/**
 * Owns the geo cache's cleanup timer, and nothing else.
 *
 * Deliberately not a facade over `nominatimFetch`. The throttle cursor and the
 * cache have to be module state — the bridges construct their collaborators by
 * hand, outside the container, and a second copy of the cursor is exactly the
 * defect this domain exists to remove. A provider wrapping them would suggest
 * per-instance state that is not there.
 *
 * What the container does add is a lifecycle. Atlas used to start this interval
 * as an import-time side effect, documented as a parity exception; a timer
 * nobody stops is how a test process ends up hanging, and the container has a
 * hook for exactly this.
 */
@Injectable()
export class GeocodingService implements OnModuleInit, OnModuleDestroy {
  onModuleInit(): void {
    startGeoCacheCleanup();
  }

  onModuleDestroy(): void {
    stopGeoCacheCleanup();
  }
}
