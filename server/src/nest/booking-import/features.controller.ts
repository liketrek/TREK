import { Controller, Get } from '@nestjs/common';
import { KitineraryExtractorService } from './kitinerary-extractor.service';
import { isAddonEnabled } from '../../services/adminService';
import { ADDON_IDS } from '../../addons';
import { hasInstanceLlmConfig } from '../llm-parse/llm-config.resolver';

/** Exposes server feature flags consumed by the frontend to show/hide optional UI. */
@Controller('api/health')
export class FeaturesController {
  constructor(private readonly extractor: KitineraryExtractorService) {}

  @Get('features')
  features() {
    return {
      bookingImport: this.extractor.isAvailable(),
      // Addon-level flag (per-user config availability is reported per-file in
      // the preview response). Drives whether the client shows AI affordances.
      aiParsing: isAddonEnabled(ADDON_IDS.LLM_PARSING),
      // True when the admin defined a usable instance-wide config — it takes over
      // and the client hides the per-user "bring your own key" settings.
      aiParsingManaged: hasInstanceLlmConfig(),
    };
  }
}
