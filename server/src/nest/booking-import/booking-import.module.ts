import { Module } from '@nestjs/common';
import { BookingImportController } from './booking-import.controller';
import { BookingImportService } from './booking-import.service';
import { ImportJobsService } from './import-jobs.service';
import { KitineraryExtractorService } from './kitinerary-extractor.service';
import { FeaturesController } from './features.controller';
import { LlmParseModule } from '../llm-parse/llm-parse.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { BudgetModule } from '../budget/budget.module';
import { AddonsModule } from '../addons/addons.module';
import { MapsModule } from '../maps/maps.module';
import { PlacesModule } from '../places/places.module';

@Module({
  imports: [LlmParseModule, ReservationsModule, PermissionsModule, BudgetModule, AddonsModule, MapsModule, PlacesModule],
  controllers: [BookingImportController, FeaturesController],
  providers: [BookingImportService, KitineraryExtractorService, ImportJobsService],
})
export class BookingImportModule {}
