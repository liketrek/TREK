import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { EphemeralTokenModule } from '../auth/ephemeral-token.module';
import { JourneyDomainModule } from '../journey/journey-domain.module';

/**
 * The transport, kept out of RealtimeModule on purpose.
 *
 * RealtimeModule is @Global and every domain pulls it in for the broadcast
 * facade. A gateway there would follow into every e2e TestingModule, and Nest's
 * SocketModule loads a websocket adapter for any app that has one: with none
 * set, it reaches for @nestjs/platform-socket.io and calls process.exit(1) when
 * it is absent. Eighteen harnesses died that way.
 *
 * So this module is imported by AppModule alone. Test apps that assemble a few
 * domain modules by hand get the facade without the transport, which is what
 * they had before; the ones that boot the real buildApp() get both, with
 * TrekWsAdapter already registered.
 */
@Module({
  // JourneyDomainModule for the book rooms: who may open a journey is asked
  // of the same service the REST routes ask.
  imports: [EphemeralTokenModule, JourneyDomainModule],
  providers: [RealtimeGateway],
})
export class RealtimeGatewayModule {}
