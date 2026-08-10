import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { DatabaseModule } from '../database/database.module';
import { ReservationsModule } from '../reservations/reservations.module';

/** Calendar export. Imported by trips (the download route) and feeds (the
 *  subscribable URLs); it pulls in neither, which is what lets FeedsModule stop
 *  importing the whole trips aggregate for an ICS string. */
@Module({
  imports: [DatabaseModule, ReservationsModule],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
