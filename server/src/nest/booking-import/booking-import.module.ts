import { Module } from '@nestjs/common';
import { BookingImportController } from './booking-import.controller';
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
  controllers: [BookingImportController],
  providers: [BookingImportService, ImportJobsService],
})
export class BookingImportModule {}
