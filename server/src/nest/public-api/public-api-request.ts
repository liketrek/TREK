import { HttpException } from '@nestjs/common';
import type { Request } from 'express';
import type { RateLimitService } from '../common/rate-limit.service';

/**
 * What every `/api/v1` route does with the incoming request, in one place because
 * the surface is served by two controllers: the routes in this directory, and the
 * stats route that lives in `atlas/` because that is where its data does.
 *
 * Sharing these is the point. One rate-limit bucket means an integration polling
 * both surfaces spends a single budget rather than two, and one user-narrowing
 * means a route cannot accidentally answer with a different idea of who is calling.
 */

/**
 * Keyed by the caller rather than by IP: a self-hosted integration and its user's
 * browser routinely share an address, and limiting by IP would let one starve the
 * other. Generous — this is a sync surface, not a login form — but bounded, so a
 * runaway poll degrades its own integration instead of the instance.
 */
export const PUBLIC_API_RATE_WINDOW_MS = 60_000;
export const PUBLIC_API_RATE_MAX_PER_MINUTE = 120;

/**
 * Falls back to a constant key when a request somehow carries no user, so the
 * limiter can never end up with one shared bucket for every anonymous caller.
 */
export function enforcePublicApiRateLimit(rl: RateLimitService, req: Request): void {
  const key = `user:${req.user?.id ?? 'unknown'}`;
  if (!rl.check('public-api', key, PUBLIC_API_RATE_MAX_PER_MINUTE, PUBLIC_API_RATE_WINDOW_MS, Date.now())) {
    throw new HttpException({ error: 'Too many requests. Please slow down.' }, 429);
  }
}

/**
 * The guard has already resolved the user; this is the type narrowing plus a
 * belt-and-braces check. If it ever throws, a route was mounted without the guard —
 * a 401 is then the right answer, and a loud one.
 */
export function requireUserId(req: Request): number {
  const id = req.user?.id;
  if (typeof id !== 'number') {
    throw new HttpException({ error: 'API token required', code: 'API_TOKEN_REQUIRED' }, 401);
  }
  return id;
}
