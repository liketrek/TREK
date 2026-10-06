import { Days } from '../../db/entities/Days.entity';
import { Reservations } from '../../db/entities/Reservations.entity';
import { AddonsModule } from '../addons/addons.module';
import { BudgetModule } from '../budget/budget.module';
import { LlmParseModule } from '../llm-parse/llm-parse.module';
import { MapsModule } from '../maps/maps.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PlacesModule } from '../places/places.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { BookingImportService } from './booking-import.service';
import { ImportJobsService } from './import-jobs.service';
import { KitineraryExtractorModule } from './kitinerary-extractor.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * `MikroOrmModule.forFeature([Days, Reservations])` (Plan 3h Task 4, BI1/BI2):
 * `BookingImportService.resolveDayId` reaches `DaysRepository.findByTripAndDate`
 * and `ReservationsRepository.findNearestDayId`.
 */
@Module({
  imports: [
    KitineraryExtractorModule,
    LlmParseModule,
    ReservationsModule,
    PermissionsModule,
    BudgetModule,
    AddonsModule,
    MapsModule,
    PlacesModule,
    MikroOrmModule.forFeature([Days, Reservations]),
  ],
  providers: [BookingImportService, ImportJobsService],
  // The HTTP surface lives in reservation-import/, which shares the prefix with
  // the AirTrail import; these are what it needs.
  exports: [BookingImportService, ImportJobsService],
})
export class BookingImportModule {}
