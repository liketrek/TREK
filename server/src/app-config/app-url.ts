import { readEnv } from './env';
import { stripTrailingSlashes } from './parsers';

/**
 * Instance base-URL resolution: APP_URL → first ALLOWED_ORIGINS entry →
 * http://localhost:{PORT}. Moved verbatim from services/notifications.ts
 * (2026-07-28, findings auth-2/notifications-1/admin-3/mcp-1) — the resolution
 * chain, trailing-slash strip and invalid-URL fallthrough are parity-pinned.
 * Live reads: readEnv() per call, never cached.
 */
export function getAppUrl(): string {
  const appUrl = readEnv().app.appUrl;
  if (appUrl) {
    try {
      const _ = new URL(appUrl);
      return stripTrailingSlashes(appUrl);
    } catch (_ignored) {}
  }
  const origins = readEnv().http.allowedOriginsRaw;
  if (origins) {
    const first = origins.split(',')[0]?.trim();
    if (first) {
      try {
        const _ = new URL(first);
        return stripTrailingSlashes(first);
      } catch (_ignored) {}
    }
  }
  const port = readEnv().app.port;
  return `http://localhost:${port}`;
}

/** Returns a URL guaranteed to satisfy the MCP SDK's issuer requirements (HTTPS or localhost).
 *  Falls back to http://localhost:{PORT} when APP_URL/ALLOWED_ORIGINS use a non-HTTPS, non-localhost scheme
 *  that would cause checkIssuerUrl to throw "Issuer URL must be HTTPS". */
export function getMcpSafeUrl(): string {
  const candidate = getAppUrl();
  try {
    const u = new URL(candidate);
    if (u.protocol === 'https:' || u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      return candidate;
    }
  } catch {
    // candidate was somehow invalid — fall through to localhost
  }
  const port = readEnv().app.port;
  return `http://localhost:${port}`;
}
