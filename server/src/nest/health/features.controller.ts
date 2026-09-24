import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { KitineraryExtractorService } from '../booking-import/kitinerary-extractor.service';
import { AddonsService } from '../addons/addons.service';
import { ADDON_IDS } from '../../addons';
import { Public } from '../auth/public.decorator';

/** Exposes the container probe and the server feature flags consumed by the
 *  frontend to show/hide optional UI. */
@Public('server capability flags the login screen reads to decide what to offer')
@Controller('api/health')
export class FeaturesController {
  constructor(
    private readonly extractor: KitineraryExtractorService,
    private readonly addons: AddonsService,
  ) {}

  /** The container/uptime probe. The forced-HTTPS redirect and HSTS exempt this
   *  path inside globalMiddleware, so probes work regardless of proxy setup;
   *  @Res() keeps the exact legacy header casing and body bytes. */
  @Get()
  health(@Res() res: Response): void {
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    res.json({ status: 'ok' });
  }

  @Get('features')
  features() {
    return {
      bookingImport: this.extractor.isAvailable(),
      // Addon-level flag (per-user config availability is reported per-file in
      // the preview response). Drives whether the client shows AI affordances.
      aiParsing: this.addons.isAddonEnabled(ADDON_IDS.LLM_PARSING),
      // The native apps refuse to connect to a server without this: an older
      // one serves a UI that knows neither the sign-in hand-off nor the way
      // back to the server picker, and the user would be stuck in it.
      nativeApp: true,
    };
  }
}
