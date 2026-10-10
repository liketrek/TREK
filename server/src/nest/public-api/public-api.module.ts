import { BucketList } from '../../db/entities/BucketList.entity';
import { DayNotes } from '../../db/entities/DayNotes.entity';
import { Days } from '../../db/entities/Days.entity';
import { Places } from '../../db/entities/Places.entity';
import { Reservations } from '../../db/entities/Reservations.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { RateLimitModule } from '../common/rate-limit.module';
import { TokensModule } from '../tokens/tokens.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { ApiTokenGuard } from './api-token.guard';
import { PublicApiController } from './public-api.controller';
import { PublicApiService } from './public-api.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Public API v1 — the versioned read-only surface for third-party integrations.
 *
 * Imports rather than re-implements: token verification comes from TokensModule,
 * trip access from TripMembershipModule and DatabaseService. This module owns the
 * payload shaping and nothing else, so there is no second place where "who may read
 * this trip" is decided.
 *
 * Deliberately a leaf. Pulling in a domain module for one table drags its whole
 * graph along: AtlasModule needs AuthModule, which boots the storage registry,
 * which reads app_settings on init. A read-only surface that cannot start without
 * half the application is one that breaks for reasons it has nothing to do with.
 *
 * That constraint is why `GET /api/v1/stats` is not declared here: its figures are
 * AtlasService's, so the route lives in `atlas/` instead and provides this guard
 * class itself. No module edge either way — which is the point.
 */
@Module({
  // `MikroOrmModule.forFeature([Trips, Reservations, Days, Places, DayNotes,
  // BucketList])` registers `TripsRepository` (Plan 3d Task 5 — its trip
  // reads convert onto the same repository `TripsModule` owns) and
  // `ReservationsRepository` (Plan 3d Task 4's pickup —
  // `reservationsByDay`/`buildAccommodations`/`buildUnplannedPlaces`/
  // `buildUnscheduledReservations`), plus `DaysRepository`/
  // `PlacesRepository`/`DayNotesRepository`/`BucketListRepository` (Plan 4
  // Task 1's pickup — `buildDays`/`placesByDay`/`dayNotesByDay`/
  // `listBucketList`) for `PublicApiService`'s `@InjectRepository`
  // constructor params, without pulling `TripsModule`/`ReservationsModule`/
  // `DaysModule`/`PlacesModule`/`DayNotesModule`/`AtlasModule` themselves in,
  // per this module's leaf-module constraint above.
  imports: [
    TokensModule,
    TripMembershipModule,
    RateLimitModule,
    MikroOrmModule.forFeature([Trips, Reservations, Days, Places, DayNotes, BucketList]),
  ],
  controllers: [PublicApiController],
  providers: [PublicApiService, ApiTokenGuard],
})
export class PublicApiModule {}
