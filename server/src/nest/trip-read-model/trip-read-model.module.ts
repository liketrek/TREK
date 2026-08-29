import { AccommodationsModule } from '../accommodations/accommodations.module';
import { BudgetModule } from '../budget/budget.module';
import { CollabModule } from '../collab/collab.module';
import { DatabaseModule } from '../database/database.module';
import { DaysModule } from '../days/days.module';
import { FilesModule } from '../files/files.module';
import { PackingModule } from '../packing/packing.module';
import { PlacesModule } from '../places/places.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { TodoModule } from '../todo/todo.module';
import { TripMembersModule } from '../trip-members/trip-members.module';
import { TripReadModelService } from './trip-read-model.service';
import { Module } from '@nestjs/common';

/** Where the trip read aggregates keep their fan-out, so the write path does not
 *  have to carry it. Nothing imports this except trips. */
@Module({
  imports: [
    DatabaseModule,
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
