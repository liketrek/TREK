import type { PlaceClientOrigin, PlaceContribField, PlaceFieldOrigins } from '@trek/shared';

/**
 * Where the place form's shareable fields got their values, for the
 * `fieldOrigins` a create or update carries: `user` for what was typed, the
 * provider for what a search pick, a map POI or the details column filled in.
 * The server keeps the record of it (and decides for MCP, plugins and imports),
 * so this only has to say what the form saw; nothing here is shown.
 */

const SHAREABLE: ReadonlySet<string> = new Set<PlaceContribField>([
  'website',
  'phone',
  'email',
  'opening_hours',
  'description',
  'image',
]);

/** The form field a shareable detail lives in (`image_url` is the picture). */
function contribFieldOf(formField: string): PlaceContribField | null {
  const field = formField === 'image_url' ? 'image' : formField;
  return SHAREABLE.has(field) ? (field as PlaceContribField) : null;
}

/**
 * Which provider a picked search result or a prefilled POI came from, read off
 * the ids it carries: the TREK index, Amap, Google, OpenStreetMap.
 */
export function resultOrigin(result: Record<string, unknown>): PlaceClientOrigin {
  const osmId = typeof result.osm_id === 'string' ? result.osm_id : '';
  if (result.source === 'trek-places' || osmId.startsWith('gers:')) return 'trek';
  if (typeof result.amap_poi_id === 'string' && result.amap_poi_id) return 'amap';
  if (typeof result.google_place_id === 'string' && result.google_place_id) return 'google';
  if (osmId) return 'osm';
  return 'enrichment';
}

/**
 * The origins with one form field set (or, for `null`, forgotten: a value that
 * belonged to the last pick and was cleared). A field that is not shareable
 * leaves them as they are.
 */
export function withOrigin(
  origins: PlaceFieldOrigins | undefined,
  formField: string,
  origin: PlaceClientOrigin | null
): PlaceFieldOrigins | undefined {
  const field = contribFieldOf(formField);
  if (!field) return origins;
  const next: PlaceFieldOrigins = { ...origins };
  if (origin) next[field] = origin;
  else delete next[field];
  return next;
}

/** The origins after a search pick wrote or cleared these form fields. */
export function originsAfterPick(
  origins: PlaceFieldOrigins | undefined,
  written: readonly string[],
  cleared: readonly string[],
  origin: PlaceClientOrigin
): PlaceFieldOrigins | undefined {
  let next = origins;
  for (const field of written) next = withOrigin(next, field, origin);
  for (const field of cleared) next = withOrigin(next, field, null);
  return next;
}
