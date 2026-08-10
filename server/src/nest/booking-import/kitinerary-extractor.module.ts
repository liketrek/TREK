import { Module } from '@nestjs/common';
import { KitineraryExtractorService } from './kitinerary-extractor.service';

/** The kitinerary binary probe on its own. It has no dependencies, and the
 *  feature-flag endpoint in health/ needs nothing else from booking-import —
 *  importing the whole domain there would drag llm-parse, reservations, budget,
 *  maps and places along for one `isAvailable()`. */
@Module({
  providers: [KitineraryExtractorService],
  exports: [KitineraryExtractorService],
})
export class KitineraryExtractorModule {}
