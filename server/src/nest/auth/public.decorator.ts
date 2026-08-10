import { SetMetadata } from '@nestjs/common';

/** Metadata key `@Public()` writes. */
export const IS_PUBLIC = 'trek:public';
/** Metadata key `@OptionalAuth()` writes. */
export const OPTIONAL_AUTH = 'trek:optional-auth';

/**
 * Marks a route as reachable without a session, under the global auth guard.
 *
 * The reason is required, and that is the point: with default-deny, the only
 * routes a reader has to think about are the ones carrying this decorator, so
 * each one should say why it is exempt. Same discipline as
 * common/body-contract-allow-list.ts — a list nobody can add to without
 * explaining themselves stays short.
 *
 * `@Public()` does NOT populate req.user. A route that wants the user when a
 * token happens to be present, and no 401 when it is not, wants
 * `@OptionalAuth()` instead.
 */
export const Public = (reason: string) => SetMetadata(IS_PUBLIC, { reason });

/**
 * Marks a route whose response varies by auth state but which never demands it:
 * the global guard loads the user when a valid token is present and leaves
 * `req.user` null otherwise, exactly like the legacy `optionalAuth` middleware.
 *
 * Reach for `@Public()` unless the handler actually reads `req.user`. Populating
 * it has a side effect beyond the handler: the IdempotencyInterceptor steps
 * aside when there is no user, so making a route optional-auth newly enrols its
 * mutations in idempotency replay.
 */
export const OptionalAuth = (reason: string) => SetMetadata(OPTIONAL_AUTH, { reason });
