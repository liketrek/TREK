import { Module } from '@nestjs/common';
import { BookingImportController } from './booking-import.controller';
import { BookingImportService } from './booking-import.service';
import { KitineraryExtractorService } from './kitinerary-extractor.service';
import { FeaturesController } from './features.controller';
import { LlmParseModule } from '../llm-parse/llm-parse.module';

@Module({
  imports: [LlmParseModule],
  controllers: [BookingImportController, FeaturesController],
  providers: [BookingImportService, KitineraryExtractorService],
})
export class BookingImportModule {}
