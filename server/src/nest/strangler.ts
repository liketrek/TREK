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
const DEFAULT_NEST_PREFIXES = ['/api/_nest', '/api/weather'];

export function getNestPrefixes(): string[] {
  const raw = process.env.NEST_PREFIXES;
  if (raw !== undefined) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return DEFAULT_NEST_PREFIXES;
}

/** Builds a matcher: true when `path` belongs to one of the migrated prefixes. */
export function makeNestPathMatcher(prefixes: string[]): (path: string) => boolean {
  return (path) => prefixes.some((prefix) => path === prefix || path.startsWith(prefix + '/'));
}
