import { hexColorSchema } from '@trek/shared'

/**
 * Allow-list a colour before it goes into a hand-built HTML string.
 *
 * Category and tag colours are plain strings in the older contracts, and both map
 * renderers paste them straight into a style="…" attribute of markup that ends up
 * in L.divIcon / innerHTML / setHTML. Escaping alone would stop the attribute
 * breakout but still let a CSS value through — `url(https://…)` in a background
 * is a working tracking pixel — so a colour is allow-listed instead: anything
 * that is not #rgb or #rrggbb falls back.
 *
 * Server-side validation closes the write path. This closes the read path, which
 * is what covers rows written before that validation existed, instances that have
 * not updated, and anything a compromised admin account left behind.
 */
export function safeHexColor(value: string | null | undefined, fallback: string): string {
  return typeof value === 'string' && hexColorSchema.safeParse(value).success ? value : fallback
}
