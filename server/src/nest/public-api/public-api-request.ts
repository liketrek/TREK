import { HttpException } from '@nestjs/common';
import type { Request } from 'express';
import { PUBLIC_API_SCOPES, type PublicApiScope } from '@trek/shared';
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

/**
 * What the key on this request may read.
 *
 * A request that somehow reached a route without the guard has no grant, and
 * the honest answer there is "nothing" rather than "everything" — the same
 * fail-closed reasoning as `requireUserId` throwing a 401. A key with no
 * narrowing has already been resolved to the full list by the token service,
 * so there is no absent-means-all rule left to get wrong here.
 */
export function grantedScopes(req: Request): readonly PublicApiScope[] {
  return req.apiToken?.scopes ?? [];
}

/**
 * Refuse a request whose key does not cover the section it asked for.
 *
 * **403, and a code of its own.** Not 401: the credential is valid and
 * re-authenticating will not help. Not 404: an integrator debugging a key they
 * narrowed themselves needs to be told that, not sent looking for a missing
 * trip. The two existing codes are deliberately left alone so
 * "expired/invalid" and "not enough access" stay distinguishable.
 */
export function requireScope(req: Request, scope: PublicApiScope): void {
  if (!grantedScopes(req).includes(scope)) {
    throw new HttpException(
      {
        error: `This API key is not allowed to read ${scope}`,
        code: 'API_SCOPE_FORBIDDEN',
        required_scope: scope,
      },
      403,
    );
  }
}

/**
 * Narrow a set of requested sections to what the key may actually read.
 *
 * Filtering rather than refusing, for one specific case: `include` defaults to
 * everything, so a narrow key asking for a trip with no `include` at all would
 * otherwise be refused for wanting sections it never named. It gets what it may
 * have. A caller that *names* a forbidden section is a different matter and is
 * refused by `requireScope` at the controller, because silently dropping what
 * somebody explicitly asked for is how integrators end up debugging their own
 * correct code.
 */
export function narrowToGrant<T extends string>(sections: readonly T[], req: Request): T[] {
  const granted = new Set<string>(grantedScopes(req));
  return sections.filter((section) => granted.has(section));
}

/** Every section, for the callers that need the canonical list. */
export const ALL_PUBLIC_API_SCOPES: readonly PublicApiScope[] = PUBLIC_API_SCOPES;
