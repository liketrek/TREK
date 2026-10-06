import { Trips } from '../../db/entities/Trips.entity';
import { AccommodationsModule } from '../accommodations/accommodations.module';
import { BudgetModule } from '../budget/budget.module';
import { CollabModule } from '../collab/collab.module';
import { DaysModule } from '../days/days.module';
import { FilesModule } from '../files/files.module';
import { PackingModule } from '../packing/packing.module';
import { PlacesModule } from '../places/places.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { TodoModule } from '../todo/todo.module';
import { TripMembersModule } from '../trip-members/trip-members.module';
import { TripReadModelService } from './trip-read-model.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/** Where the trip read aggregates keep their fan-out, so the write path does not
 *  have to carry it. Nothing imports this except trips.
 *
 *  `MikroOrmModule.forFeature([Trips])` replaces `DatabaseModule` (Plan 3c
 *  Task 6): `TripReadModelService` is now SQL-free — its two sites
 *  (`getOwner`/`getTripSummary`'s trip read) both convert to `TripsRepository`
 *  methods, unlike `TripMembersModule`'s carve-out next door. */
@Module({
  imports: [
    MikroOrmModule.forFeature([Trips]),
    TripMembersModule,
    DaysModule,
    AccommodationsModule,
    BudgetModule,
    PackingModule,
    ReservationsModule,
    CollabModule,
    PlacesModule,
    TodoModule,
    FilesModule,
  ],
  providers: [TripReadModelService],
  exports: [TripReadModelService],
})
export class TripReadModelModule {}
