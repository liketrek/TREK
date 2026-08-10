import { Module } from '@nestjs/common';
import { BookingImportService } from './booking-import.service';
import { ImportJobsService } from './import-jobs.service';
import { KitineraryExtractorModule } from './kitinerary-extractor.module';
import { LlmParseModule } from '../llm-parse/llm-parse.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { BudgetModule } from '../budget/budget.module';
import { AddonsModule } from '../addons/addons.module';
import { MapsModule } from '../maps/maps.module';
import { PlacesModule } from '../places/places.module';

@Module({
  imports: [KitineraryExtractorModule, LlmParseModule, ReservationsModule, PermissionsModule, BudgetModule, AddonsModule, MapsModule, PlacesModule],
  providers: [BookingImportService, ImportJobsService],
  // The HTTP surface lives in reservation-import/, which shares the prefix with
  // the AirTrail import; these are what it needs.
  exports: [BookingImportService, ImportJobsService],
})
export class BookingImportModule {}
