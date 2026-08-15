import { SetMetadata } from '@nestjs/common';
import { RuntimeEnvService } from '../app-config/runtime-env.service';

/** Metadata key `@ManagedForbidden()` writes. */
export const MANAGED_FORBIDDEN = 'trek:managed-forbidden';

/**
 * The one 403 body a managed instance returns, shared by REST and MCP.
 *
 * Deliberately a single constant rather than a per-route message. DEMO_MODE grew
 * two texts for the same condition — 'Uploads are disabled in demo mode. Self-host
 * TREK for full functionality.' on REST and 'Write operations are disabled in demo
 * mode.' on MCP — and now neither can be changed without hunting for the other.
 *
 * It says who owns the setting and stops there. A caller learns that the value is
 * not theirs to change, which is all they can act on; the reason belongs to
 * whoever runs the install, not in an API response.
 */
export const MANAGED_FORBIDDEN_ERROR = {
  error: 'This is configured by the operator of this instance.',
  code: 'MANAGED_FORBIDDEN',
} as const;

/**
 * Marks a route as unavailable while the instance is centrally administered.
 *
 * The reason is mandatory and is for the next reader of the source, not for the
 * client: it records why this particular surface cannot be left to the instance
 * admin. Without it the marks turn into a list nobody can audit, which is how
 * the path lists this codebase has already replaced once went stale.
 */
export const ManagedForbidden = (reason: string) => SetMetadata(MANAGED_FORBIDDEN, { reason });

/**
 * The handler-side flavour of the guard below.
 *
 * Needed because a guard throws before the multipart parser has drained the
 * request body, which leaves the client with an ECONNRESET instead of the 403
 * (PROFILE-015, and the reason `isDemoWriteBlocked` is a function too). Upload
 * routes call this after the interceptor instead of carrying the decorator.
 */
export function isManagedBlocked(env: RuntimeEnvService): boolean {
  return env.isManaged();
}
