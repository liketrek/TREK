/**
 * Dev-link: register a plugin from a LOCAL build directory and hot-reload it
 * against a real instance's data (#plugins, developer experience).
 *
 * This is an explicit, opt-in DEVELOPMENT capability and must NEVER be reachable
 * in production. A dev-linked plugin (a) bypasses the install-time signature /
 * integrity model — its code mutates live between restarts with no re-consent —
 * and (b) under `npm run dev` runs with the OS permission jail OFF. Its DATA access
 * is still fully gated by the capability RPC host (grants + the acting user's real
 * membership, no impersonation) exactly like any other plugin — code origin never
 * touches that gate — but the two properties above are why loading unsigned local
 * code must be gated behind an explicit flag on top of the admin + kill-switch gates.
 *
 * Enable ONLY by setting `TREK_PLUGINS_DEV_LINK=1`. Off (absent/any other value)
 * by default, so it can never be silently on in a shared or production deployment.
 */
export function devLinkEnabled(): boolean {
  return process.env.TREK_PLUGINS_DEV_LINK === '1';
}

/** Provenance marker stamped on a dev-linked plugin row (free-text `source_repo`). */
export const DEV_LINK_SOURCE = 'local:link';
