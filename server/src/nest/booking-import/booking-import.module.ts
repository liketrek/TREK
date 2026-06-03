import { Module } from '@nestjs/common';
import { BookingImportController } from './booking-import.controller';
import { BookingImportService } from './booking-import.service';
import { KitineraryExtractorService } from './kitinerary-extractor.service';
import { FeaturesController } from './features.controller';

@Module({
  controllers: [BookingImportController, FeaturesController],
  providers: [BookingImportService, KitineraryExtractorService],
})
export class BookingImportModule {}
