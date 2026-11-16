import { AppConfigModule } from '../app-config/app-config.module';
import { RateLimitModule } from '../common/rate-limit.module';
import { MapsModule } from '../maps/maps.module';
import { ServiceIdentityModule } from '../service-identity/service-identity.module';
import { RoutingRelayController } from './routing-relay.controller';
import { RoutingRelayService } from './routing-relay.service';
import { Module } from '@nestjs/common';

/**
 * The TREK services' Valhalla behind this server: the planner in the browser
 * asks it through the controller, the road trip router on the server through
 * the exported service, both under the same limits.
 *
 * MapsModule for PlacesProviderSelector: a question inside China is answered by
 * Amap with the key that module resolves, and only a question outside it is
 * passed on to the Valhalla.
 */
@Module({
  imports: [AppConfigModule, RateLimitModule, ServiceIdentityModule, MapsModule],
  controllers: [RoutingRelayController],
  providers: [RoutingRelayService],
  exports: [RoutingRelayService],
})
export class RoutingRelayModule {}
