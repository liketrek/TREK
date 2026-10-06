import type { User } from '../../types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RateLimitService } from '../common/rate-limit.service';
import { PlaceEnrichmentDto } from './place-enrichment.dto';
import { PlaceEnrichmentService } from './place-enrichment.service';
import { Body, Controller, Get, HttpCode, HttpException, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { MapsPlaceEnrichmentResult } from '@trek/shared';

import type { Request } from 'express';

const MINUTE = 60_000;
/**
 * Generous enough that browsing a shortlist never trips it, tight enough that a
 * script cannot walk the provider APIs on an admin's key. One request covers one
 * selected search result, and the answer is cached for a week afterwards.
 */
const MAX_PER_MINUTE = 60;

/**
 * /api/maps/enrichment — pictures and a description for a place that is being
 * looked at but has not been saved.
 *
 * Sits next to the maps endpoints because that is where the client already
 * looks, but in its own module: this is the only maps-adjacent route that fans
 * out to several providers per call, and it is the only one with a rate limit.
 */
@Controller('api/maps/enrichment')
@UseGuards(JwtAuthGuard)
export class PlaceEnrichmentController {
  constructor(
    private readonly enrichment: PlaceEnrichmentService,
    private readonly rl: RateLimitService,
  ) {}

  @Post()
  @HttpCode(200) // Nest would otherwise default POST to 201; every other maps route answers 200.
  async enrich(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Body() body: PlaceEnrichmentDto,
  ): Promise<MapsPlaceEnrichmentResult> {
    // Keyed by user, not by IP: the cost lands on the key of whoever is signed
    // in, and a household behind one address should not share a budget.
    if (!this.rl.check('place_enrichment', String(user.id), MAX_PER_MINUTE, MINUTE, Date.now())) {
      throw new HttpException({ error: 'Too many requests' }, 429);
    }

    try {
      return await this.enrichment.enrich(user.id, body);
    } catch (err: unknown) {
      // A provider being unreachable must not break adding a place — the column
      // is an aid, not a step. Log it and answer with an empty result.
      console.error('Place enrichment error:', err);
      return { photos: [], description: null, facts: [] };
    }
  }

  /**
   * Author and licence for an already-stored picture. Read-only and purely
   * local — no provider is contacted, so it needs no rate limit.
   */
  @Get('credit/:key')
  credit(@Param('key') key: string): Promise<{ credit: string | null }> {
    return this.enrichment.credit(key);
  }
}
