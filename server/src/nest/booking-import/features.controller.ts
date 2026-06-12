import { Controller, Get } from '@nestjs/common';
import { KitineraryExtractorService } from './kitinerary-extractor.service';

/** Exposes server feature flags consumed by the frontend to show/hide optional UI. */
@Controller('api/health')
export class FeaturesController {
  constructor(private readonly extractor: KitineraryExtractorService) {}

  @Get('features')
  features() {
    return {
      bookingImport: this.extractor.isAvailable(),
    };
  }
}
