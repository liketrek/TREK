import { DayNotes } from '../../db/entities/DayNotes.entity';
import { Days } from '../../db/entities/Days.entity';
import { Reservations } from '../../db/entities/Reservations.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { ReservationsModule } from '../reservations/reservations.module';
import { CalendarService } from './calendar.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/** Calendar export. Imported by trips (the download route) and feeds (the
 *  subscribable URLs); it pulls in neither, which is what lets FeedsModule stop
 *  importing the whole trips aggregate for an ICS string.
 *
 *  `MikroOrmModule.forFeature([...])` registers the repositories CL1/CL3/CL5's
 *  reads (`TripsRepository`/`DaysRepository`/`DayNotesRepository`, all owned
 *  elsewhere already) and CL2/CL4/CL7's own additive methods on
 *  `ReservationsRepository` (Plan 3d Task 4) resolve through. */
@Module({
  imports: [ReservationsModule, MikroOrmModule.forFeature([Trips, Days, DayNotes, Reservations])],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
