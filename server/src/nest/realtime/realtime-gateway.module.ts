import { Module, type OnModuleDestroy } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { RealtimeGateway } from './realtime.gateway';
import { EphemeralTokenModule } from '../auth-core/ephemeral-token.module';
import { JourneyDomainModule } from '../journey/journey-domain.module';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import { Users } from '../../db/entities/Users.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { processRooms, RoomRegistry, roomsSlot } from './ws-state';

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
  // of the same service the REST routes ask. Users/AppSettings: Plan 4 Task
  // 1 — the handshake's password-version and require_mfa reads, moved off
  // DatabaseService onto UsersRepository/AppSettingsRepository. Trips: Plan 4
  // Task 2 — handleJoin's own canAccessTrip delegate, now TripsRepository
  // directly.
  imports: [EphemeralTokenModule, JourneyDomainModule, MikroOrmModule.forFeature([Users, AppSettings, Trips])],
  // The room registry is the process-wide in-memory one; the constructor
  // below hands whichever one the container resolved to the broadcast
  // functions, so the gateway and the broadcasts never use two registries.
  providers: [RealtimeGateway, { provide: RoomRegistry, useValue: processRooms }],
})
export class RealtimeGatewayModule implements OnModuleDestroy {
  constructor(private readonly rooms: RoomRegistry) {
    roomsSlot.install(rooms);
  }

  onModuleDestroy(): void {
    roomsSlot.release(this.rooms);
  }
}
