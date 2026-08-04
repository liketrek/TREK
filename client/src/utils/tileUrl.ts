/**
 * OpenStreetMap has not needed the a/b/c.tile.openstreetmap.org subdomains
 * since 2022 — tile.openstreetmap.org serves the whole grid on its own — and
 * d.tile.openstreetmap.org has meanwhile lost its DNS record entirely. A
 * template that still carries the `{s}` placeholder therefore depends on which
 * letters the renderer substitutes: everything that lands on `d` fails with
 * ERR_NAME_NOT_RESOLVED, which is console noise plus holes in the offline tile
 * cache (#1733).
 *
 * The presets ship the single-host form now, but a template the user (or an
 * admin default) saved earlier is still in the database. Rewriting it on read
 * fixes those instances without a migration; the settings store rewrites it on
 * save as well, so a legacy URL typed by hand converges on the same host
 * instead of coming back on the next load. Other providers are left untouched.
 */

/** `{s}.` or a bare shard letter in front of tile.openstreetmap.org. */
const OSM_SHARD = /^((?:https?:)?\/\/)(?:\{s\}|[a-d])\.tile\.openstreetmap\.org(?=[/:]|$)/i

/** Collapse a sharded OSM tile template onto the single supported host. */
export function normalizeTileUrl(url: string): string {
  if (!url) return url
  return url.replace(OSM_SHARD, '$1tile.openstreetmap.org')
}
