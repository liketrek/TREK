import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MaintenanceRepository } from '../../db/repositories/MaintenanceRepository';
import { KitineraryExtractorService } from '../booking-import/kitinerary-extractor.service';
import { AddonsService } from '../addons/addons.service';
import { ADDON_IDS } from '../../addons';
import { Public } from '../auth-core/public.decorator';
import { ReadinessService } from './readiness.service';

/** Exposes the container probe and the server feature flags consumed by the
 *  frontend to show/hide optional UI. */
@Public('server capability flags the login screen reads to decide what to offer')
@Controller('api/health')
export class FeaturesController {
  constructor(
    private readonly extractor: KitineraryExtractorService,
    private readonly addons: AddonsService,
    private readonly maintenance: MaintenanceRepository,
    private readonly readiness: ReadinessService,
  ) {}

  /** The container/uptime probe. The forced-HTTPS redirect and HSTS exempt this
   *  path inside globalMiddleware, so probes work regardless of proxy setup;
   *  @Res() keeps the exact legacy header casing and body bytes. */
  @Get()
  health(@Res() res: Response): void {
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    res.json({ status: 'ok' });
  }

  /**
   * The readiness probe: 503 while the database does not answer (a restore
   * swapping it, a boot still migrating) and once a shutdown has started, so
   * an orchestrator stops sending traffic without killing the process.
   * Liveness stays on the plain probe above, which a long restore must not
   * fail.
   */
  @Get('ready')
  async ready(@Res() res: Response): Promise<void> {
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    if (this.readiness.isDraining()) {
      res.status(503).json({ status: 'unavailable' });
      return;
    }
    try {
      await this.maintenance.ping();
      res.json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'unavailable' });
    }
  }

  @Get('features')
  async features() {
    return {
      bookingImport: this.extractor.isAvailable(),
      // Addon-level flag (per-user config availability is reported per-file in
      // the preview response). Drives whether the client shows AI affordances.
      aiParsing: await this.addons.isAddonEnabled(ADDON_IDS.LLM_PARSING),
    };
  }
}
