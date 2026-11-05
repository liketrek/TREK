import { PLACE_DETAILS_CACHE_PAYLOAD } from '../../db/json-columns';
import type { CachedProviderPayload, PlaceShareableRow } from '../../db/repositories/PlaceFieldOrigin.repository';
import { decodeJson } from '../../utils/json-column';
import {
  PLACE_CONTRIB_FIELDS,
  normalizePlaceWebsite,
  type PlaceContribField,
  type PlaceFieldOrigin,
  type PlaceFieldOrigins,
} from '@trek/shared';

/**
 * Who wrote a place: a client reporting per field, or a path that decides the
 * origin of all it changed. A path that writes one field only names it in
 * `field`, so a value another writer changed meanwhile keeps its own origin.
 */
export type OriginWriter =
  | { kind: 'client'; claims: PlaceFieldOrigins | undefined }
  | { kind: 'fixed'; origin: PlaceFieldOrigin; field?: PlaceContribField };

/** The shareable values of a place, one per field, null where it holds none. */
export type OriginSnapshot = Record<PlaceContribField, string | null>;

/** A value a provider handed out for the place, and which provider that was. */
export interface ProviderValue {
  field: PlaceContribField;
  value: string;
  origin: PlaceFieldOrigin;
}

const COLUMN: Record<PlaceContribField, keyof PlaceShareableRow> = {
  website: 'website',
  phone: 'phone',
  email: 'email',
  opening_hours: 'opening_hours',
  description: 'description',
  image: 'image_url',
};

/** The place's shareable values as stored, an empty text read as none. */
export function snapshotOf(row: PlaceShareableRow): OriginSnapshot {
  const snapshot = {} as OriginSnapshot;
  for (const field of PLACE_CONTRIB_FIELDS) {
    const value = row[COLUMN[field]];
    snapshot[field] = typeof value === 'string' && value.trim() !== '' ? value : null;
  }
  return snapshot;
}

/** The fields whose value this write changed. */
export function changedFields(before: OriginSnapshot | null, after: OriginSnapshot): PlaceContribField[] {
  return PLACE_CONTRIB_FIELDS.filter((field) => (before?.[field] ?? null) !== after[field]);
}

/** The provider ids a place carries, which its cached details records are keyed by. */
export function providerIdsOf(row: PlaceShareableRow): string[] {
  return [row.google_place_id, row.amap_poi_id, row.osm_id].filter(
    (id): id is string => typeof id === 'string' && id.trim() !== '',
  );
}

/** Which provider a cached record belongs to, by the id it is keyed under. */
function originOfId(placeId: string): PlaceFieldOrigin {
  if (placeId.startsWith('gers:')) return 'trek';
  if (placeId.startsWith('amap:')) return 'amap';
  if (/^(node|way|relation):/.test(placeId)) return 'osm';
  return 'google';
}

/** The source an enrichment description names, as an origin. */
function originOfSource(source: unknown): PlaceFieldOrigin {
  if (source === 'website') return 'website';
  if (source === 'osm') return 'osm';
  if (source === 'google') return 'google';
  if (typeof source === 'string' && /^wiki/.test(source)) return 'wikimedia';
  return 'enrichment';
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/**
 * The values the cached records hand out for a place: a details record's
 * website, phone, e-mail and description, an enrichment record's description.
 * A record that does not read as an object adds nothing.
 */
export function providerValuesOf(payloads: CachedProviderPayload[]): ProviderValue[] {
  const values: ProviderValue[] = [];
  for (const payload of payloads) {
    const record = decodeJson(PLACE_DETAILS_CACHE_PAYLOAD, payload.payload_json, payload.place_id);
    if (!record) continue;
    const origin = originOfId(payload.place_id);
    for (const field of ['website', 'phone', 'email'] as const) {
      const value = text(record[field]);
      if (value) values.push({ field, value, origin });
    }
    const description = record.description;
    const described =
      typeof description === 'object' && description !== null ? (description as Record<string, unknown>) : null;
    const descriptionText = described ? text(described.text) : text(description);
    if (descriptionText) {
      values.push({
        field: 'description',
        value: descriptionText,
        origin: payload.expanded === 2 && described ? originOfSource(described.source) : origin,
      });
    }
  }
  return values;
}

/** Two values of one field compared the way they are read: case, spacing and a website's scheme aside. */
export function sameValue(field: PlaceContribField, a: string, b: string): boolean {
  if (field === 'website') return (normalizePlaceWebsite(a) ?? a.trim()) === (normalizePlaceWebsite(b) ?? b.trim());
  if (field === 'phone') return a.replace(/[^\d+]/g, '') === b.replace(/[^\d+]/g, '');
  if (field === 'email') return a.trim().toLowerCase() === b.trim().toLowerCase();
  return a.replace(/\s+/g, ' ').trim() === b.replace(/\s+/g, ' ').trim();
}

/**
 * The origin a changed field is stored with.
 *
 * A path that decides (MCP, a plugin, an import, an attachment, an upload)
 * gives its own. A client is believed for a provider, since claiming one only
 * keeps a value home; a value it claims as typed is the user's only when no
 * provider handed out the same, and otherwise the provider's. A changed field
 * the client reported nothing for is unknown, and so is a picture a client
 * claims: the user's own picture arrives through the upload route only.
 */
export function originFor(
  field: PlaceContribField,
  value: string,
  writer: OriginWriter,
  providers: readonly ProviderValue[],
): PlaceFieldOrigin {
  if (writer.kind === 'fixed') return writer.origin;
  const claim = writer.claims?.[field];
  if (!claim) return 'unknown';
  if (claim !== 'user') return claim;
  if (field === 'image') return 'unknown';
  return providers.find((p) => p.field === field && sameValue(field, p.value, value))?.origin ?? 'user';
}

/** Whether origins of this writer could need the cached provider records at all. */
export function needsProviders(writer: OriginWriter, fields: readonly PlaceContribField[]): boolean {
  return writer.kind === 'client' && fields.some((field) => writer.claims?.[field] === 'user');
}
