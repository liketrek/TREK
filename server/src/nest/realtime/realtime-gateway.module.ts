import { AppSettings } from '../../db/entities/AppSettings.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { Users } from '../../db/entities/Users.entity';
import { EphemeralTokenModule } from '../auth-core/ephemeral-token.module';
import { DatabaseLifecycleModule } from '../database/database-lifecycle.module';
import { DatabaseLifecycle } from '../database/database-lifecycle.service';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { RealtimeGateway } from './realtime.gateway';
import { closeSockets, processRooms, RoomRegistry, roomsSlot } from './ws-state';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module, type OnModuleDestroy } from '@nestjs/common';

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
  // The book rooms ask JOURNEY_ACCESS, bound globally by JourneyAccessModule
  // to the same service the REST routes ask. Users/AppSettings: Plan 4 Task
  // 1 — the handshake's password-version and require_mfa reads, moved off
  // DatabaseService onto UsersRepository/AppSettingsRepository. Trips: Plan 4
  // Task 2 — handleJoin's own canAccessTrip delegate, now TripsRepository
  // directly.
  imports: [
    TripMembershipModule,
    EphemeralTokenModule,
    DatabaseLifecycleModule,
    MikroOrmModule.forFeature([Users, AppSettings, Trips]),
  ],
  // The room registry is the process-wide in-memory one; the constructor
  // below hands whichever one the container resolved to the broadcast
  // functions, so the gateway and the broadcasts never use two registries.
  providers: [RealtimeGateway, { provide: RoomRegistry, useValue: processRooms }],
})
export class RealtimeGatewayModule implements OnModuleDestroy {
  constructor(
    private readonly rooms: RoomRegistry,
    lifecycle: DatabaseLifecycle,
  ) {
    roomsSlot.install(rooms);
    // A restore or the demo reset puts another database in place, so every
    // room may now hold sockets of people who cannot see it (and on SQLite a
    // restored id can name another trip). Every socket starts again.
    lifecycle.onReopened(() => {
      closeSockets(1012, 'Database replaced');
      return Promise.resolve();
    });
  }

  onModuleDestroy(): void {
    roomsSlot.release(this.rooms);
  }
}
