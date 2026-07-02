import { Controller, Get, HttpException, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RateLimitService } from '../auth/rate-limit.service';
import * as transit from '../../services/transitService';

const RL_WINDOW = 15 * 60 * 1000;

/**
 * /api/transit — public transit routing (#1065) proxied through Transitous
 * (or a self-hosted MOTIS via TRANSIT_API_URL). JWT-guarded and rate-limited:
 * the Transitous usage policy asks integrators to keep expensive routing
 * traffic reasonable, so planning gets a tighter bucket than geocoding.
 */
@Controller('api/transit')
@UseGuards(JwtAuthGuard)
export class TransitController {
  constructor(private readonly rl: RateLimitService) {}

  private limit(bucket: string, req: Request, max: number): void {
    if (!this.rl.check(bucket, req.ip || 'unknown', max, RL_WINDOW, Date.now())) {
      throw new HttpException({ error: 'Too many requests. Please try again later.' }, 429);
    }
  }

  private rethrow(err: unknown): never {
    const status = (err as { status?: number }).status || 502;
    const message = err instanceof Error ? err.message : 'Transit provider error';
    throw new HttpException({ error: message }, status);
  }

  @Get('geocode')
  async geocode(
    @Query('q') q: string | undefined,
    @Query('lang') lang: string | undefined,
    @Query('near') near: string | undefined,
    @Req() req: Request,
  ) {
    this.limit('transit_geocode', req, 300);
    try {
      return await transit.geocode(q || '', lang, near);
    } catch (err) { this.rethrow(err); }
  }

  @Get('plan')
  async plan(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('time') time: string | undefined,
    @Query('arriveBy') arriveBy: string | undefined,
    @Query('modes') modes: string | undefined,
    @Query('maxTransfers') maxTransfers: string | undefined,
    @Req() req: Request,
  ) {
    this.limit('transit_plan', req, 60);
    try {
      return await transit.plan({
        from: from || '',
        to: to || '',
        time,
        arriveBy: arriveBy === 'true' || arriveBy === '1',
        modes,
        maxTransfers: maxTransfers !== undefined && maxTransfers !== '' ? Number(maxTransfers) : undefined,
      });
    } catch (err) { this.rethrow(err); }
  }
}
