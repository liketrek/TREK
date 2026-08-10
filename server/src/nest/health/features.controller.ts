import { Controller, Get } from '@nestjs/common';
import { KitineraryExtractorService } from '../booking-import/kitinerary-extractor.service';
import { AddonsService } from '../addons/addons.service';
import { ADDON_IDS } from '../../addons';
import { Public } from '../auth/public.decorator';

/** Exposes server feature flags consumed by the frontend to show/hide optional UI. */
@Public('server capability flags the login screen reads to decide what to offer')
@Controller('api/health')
export class FeaturesController {
  constructor(
    private readonly extractor: KitineraryExtractorService,
    private readonly addons: AddonsService,
  ) {}

  @Get('features')
  features() {
    return {
      bookingImport: this.extractor.isAvailable(),
      // Addon-level flag (per-user config availability is reported per-file in
      // the preview response). Drives whether the client shows AI affordances.
      aiParsing: this.addons.isAddonEnabled(ADDON_IDS.LLM_PARSING),
    };
  }
}
