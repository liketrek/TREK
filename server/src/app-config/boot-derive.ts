/**
 * Derive functions for the BOOT-STABLE values that Nest injects through a
 * registerAs token (src/nest/app-config/tokens.ts) and nothing else reads.
 *
 * Every environment variable has exactly one owner. A variable derived here is
 * owned by its token: `deriveAll()` (and so `readEnv()`) never reads it, which
 * tests/unit/app-config/config-ownership.test.ts checks by recording the keys
 * each side touches. A value that pre-container code needs, or that tests
 * mutate mid-lifetime, belongs in derive.ts instead.
 */
import type { RawEnv } from './derive';
import { parseBool, positiveIntOr, stripTrailingSlashes } from './parsers';

/**
 * Longer than the upstream idle timeout of the common reverse proxies and load
 * balancers (60 s for nginx and most load balancers, 90 s for Traefik), so the
 * proxy closes an idle upstream connection before Node does. The other way
 * round the proxy reuses a socket Node just closed and answers that request
 * with a 502. The headers timeout follows one second above, still well under
 * Node's 300 s request timeout.
 */
export const DEFAULT_KEEP_ALIVE_TIMEOUT_MS = 95_000;

/** What the pre-init Express layer and the HTTP server freeze when buildApp() runs. */
export function deriveHttpBoot(raw: RawEnv) {
  // env.schema.ts accepts 0 as a valid hop count, so `|| 1` would quietly turn
  // "trust nothing" into "trust one hop" and let a forged X-Forwarded-For through.
  const trustProxyHops = Number.parseInt(raw.TRUST_PROXY ?? '', 10);
  return {
    trustProxyRaw: raw.TRUST_PROXY,
    trustProxy: Number.isFinite(trustProxyHops) ? trustProxyHops : 1,
    hstsIncludeSubdomains: parseBool(raw.HSTS_INCLUDE_SUBDOMAINS) === true,
    /** How long the HTTP server keeps an idle keep-alive connection open. */
    keepAliveTimeoutMs: positiveIntOr(raw.HTTP_KEEP_ALIVE_TIMEOUT_MS, DEFAULT_KEEP_ALIVE_TIMEOUT_MS),
  };
}

/** Where the storage registry puts its conditional place-photo backend. */
export function deriveStorage(raw: RawEnv) {
  return {
    placePhotoDir: raw.TREK_PLACE_PHOTO_DIR,
  };
}

/** The Transitous/MOTIS instance TransitService proxies to. */
export function deriveTransit(raw: RawEnv) {
  return {
    apiBase: stripTrailingSlashes(raw.TRANSIT_API_URL || 'https://api.transitous.org'),
  };
}

/** Where KitineraryExtractorService looks for its binary when the module starts. */
export function deriveKitinerary(raw: RawEnv) {
  return {
    extractorPath: raw.KITINERARY_EXTRACTOR_PATH,
    // Windows spells it Path; every other platform PATH. Split here so the
    // probe gets a list and never re-implements the delimiter.
    searchPath: (raw.PATH || raw.Path || '')
      .split(process.platform === 'win32' ? ';' : ':')
      .map((p) => p.trim())
      .filter(Boolean),
  };
}

/** One entry per token: the namespace it registers under and the function it derives with. */
export const BOOT_DERIVERS = {
  http: deriveHttpBoot,
  storage: deriveStorage,
  transit: deriveTransit,
  kitinerary: deriveKitinerary,
} as const;

export type BootNamespace = keyof typeof BOOT_DERIVERS;
