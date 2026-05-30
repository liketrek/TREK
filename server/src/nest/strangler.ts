/**
 * Strangler toggle for the incremental NestJS migration.
 *
 * `getNestPrefixes()` returns the request path prefixes that NestJS handles;
 * every other path falls through to the legacy Express app. The default is the
 * set of prefixes whose Nest modules exist. Operators can override it at runtime
 * via the `NEST_PREFIXES` env var (comma-separated) for instant Nest<->Express
 * rollback — no redeploy, no code change. Setting `NEST_PREFIXES=` (empty) routes
 * everything back to the legacy app.
 */
const DEFAULT_NEST_PREFIXES = [
  '/api/_nest',
  '/api/weather',
  '/api/airports',
  '/api/config',
  '/api/system-notices',
  '/api/maps',
  '/api/categories',
  '/api/tags',
  '/api/notifications',
  '/api/addons/atlas',
  '/api/addons/vacay',
  '/api/trips/:tripId/packing',
  '/api/trips/:tripId/todo',
  '/api/trips/:tripId/budget',
  '/api/trips/:tripId/reservations',
  '/api/trips/:tripId/accommodations',
  '/api/trips/:tripId/days',
  '/api/trips/:tripId/assignments',
  '/api/trips/:tripId/places',
  '/api/trips/:tripId/collab',
  '/api/trips/:tripId/files',
  '/api/photos',
  '/api/journeys',
  '/api/public/journey',
  '/api/shared',
  '/api/settings',
  '/api/backup',
  // Auth — listed as explicit sub-paths (rather than one broad /api/auth prefix)
  // so each endpoint was flipped to Nest individually as it was migrated. All
  // current /api/auth/* endpoints below, including /api/auth/oidc, are handled
  // by Nest; nothing here falls through to Express anymore.
  '/api/auth/app-config',
  '/api/auth/demo-login',
  '/api/auth/invite',
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/me',
  '/api/auth/logout',
  '/api/auth/avatar',
  '/api/auth/users',
  '/api/auth/validate-keys',
  '/api/auth/app-settings',
  '/api/auth/travel-stats',
  '/api/auth/mfa',
  '/api/auth/mcp-tokens',
  '/api/auth/ws-token',
  '/api/auth/resource-token',
  '/api/auth/oidc',
  '/api/oauth',
  // OAuth public endpoints — explicit so the SDK-mounted /oauth/authorize,
  // /oauth/register and /oauth/consent keep falling through to Express.
  '/oauth/token',
  '/oauth/userinfo',
  '/oauth/revoke',
  '/api/admin',
  '/api/trips/:tripId/share-link',
  '/api/trips|',
  '/api/trips/:tripId|',
  '/api/trips/:tripId/members',
  '/api/trips/:tripId/cover',
  '/api/trips/:tripId/copy',
  '/api/trips/:tripId/bundle',
  '/api/trips/:tripId/export.ics',
];

export function getNestPrefixes(): string[] {
  const raw = process.env.NEST_PREFIXES;
  if (raw !== undefined) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return DEFAULT_NEST_PREFIXES;
}

function escapeRegExp(segment: string): string {
  return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Turns one prefix into a matcher.
 *
 * - A static prefix (no `:param`) uses a plain exact/sub-path match.
 * - A pattern prefix containing `:param` segments — needed for trip-scoped
 *   routes like `/api/trips/:tripId/packing`, where the legacy mount sits
 *   between dynamic ids — compiles to a regex in which each `:param` matches
 *   exactly one path segment, so a single nested mount routes to Nest without
 *   capturing sibling routes (days, places, ...) still served by Express.
 * - A trailing `|` marks the prefix as EXACT — it matches that path only, NOT
 *   its sub-paths. This is what lets an aggregate-root like `/api/trips` migrate
 *   (its own /api/trips and /api/trips/:id routes) without swallowing the
 *   not-yet-migrated nested mounts (/api/trips/:id/collab, /files, ...).
 */
function prefixToMatcher(prefix: string): (path: string) => boolean {
  const exact = prefix.endsWith('|');
  const p = exact ? prefix.slice(0, -1) : prefix;

  if (!p.includes(':')) {
    if (exact) return (path) => path === p;
    return (path) => path === p || path.startsWith(p + '/');
  }

  const pattern = p
    .split('/')
    .map((segment) => (segment.startsWith(':') ? '[^/]+' : escapeRegExp(segment)))
    .join('/');
  const re = new RegExp(exact ? `^${pattern}$` : `^${pattern}(?:/.*)?$`);
  return (path) => re.test(path);
}

/** Builds a matcher: true when `path` belongs to one of the migrated prefixes. */
export function makeNestPathMatcher(prefixes: string[]): (path: string) => boolean {
  const matchers = prefixes.map(prefixToMatcher);
  return (path) => matchers.some((matches) => matches(path));
}
