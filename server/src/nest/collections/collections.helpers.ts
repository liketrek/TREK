import type { CollectionPlacePosition, CollectionPlaceRow } from '../../db/repositories/Collections.repository';
import type { CollectionFilePlace, CollectionLink, CollectionPlaceUpdateRequest, CollectionStatus } from '@trek/shared';

import { z } from 'zod';

/**
 * Pure helpers of the collections domain, moved verbatim out of
 * collections.service.ts. Nothing here touches the DB, so they stay plain
 * exports rather than methods on CollectionsService.
 */

/** Links are stored as a JSON TEXT column; parse on read, stringify on write. */
export function parseLinks(raw: unknown): CollectionLink[] | undefined {
  if (typeof raw !== 'string' || !raw) return undefined;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as CollectionLink[]) : undefined;
  } catch {
    return undefined;
  }
}

export function serializeLinks(links: CollectionLink[] | undefined): string | null {
  return links && links.length ? JSON.stringify(links) : null;
}

/**
 * A saved place as the list file carries it (#2198), and with it every export
 * written from that file (GPX, KML): no ids, the category by name, the labels
 * by the names given.
 */
export function filePlaceOf(row: CollectionPlaceRow, labels: string[]): CollectionFilePlace {
  return {
    name: row.name,
    description: row.description ?? null,
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    address: row.address ?? null,
    notes: row.notes ?? null,
    price: row.price ?? null,
    currency: row.currency ?? null,
    website: row.website ?? null,
    phone: row.phone ?? null,
    // Only an absolute https URL survives: a /uploads path resolves on this
    // server, not the reader's. See the note in the file contract.
    image_url: typeof row.image_url === 'string' && /^https:\/\//i.test(row.image_url) ? row.image_url : null,
    google_place_id: row.google_place_id ?? null,
    google_ftid: row.google_ftid ?? null,
    osm_id: row.osm_id ?? null,
    status: row.status as CollectionStatus,
    links: parseLinks((row as { links?: unknown }).links),
    category: row.category_name ?? null,
    labels,
  };
}

/** The provider ids, contact and price columns of a saved place, as an update writes them. */
type ListingWrite = Partial<{
  google_place_id: string | null;
  google_ftid: string | null;
  osm_id: string | null;
  website: string | null;
  phone: string | null;
  price: number | null;
  currency: string | null;
}>;

/**
 * The fields saving a place accepts and editing it did not until #2646: each one
 * the update names, null clearing it, the rest left out so the stored value stays.
 * The website arrives normalised and checked by the contract, as on save.
 */
export function listingWriteOf(body: CollectionPlaceUpdateRequest): ListingWrite {
  const write: ListingWrite = {};
  if (body.google_place_id !== undefined) write.google_place_id = body.google_place_id ?? null;
  if (body.google_ftid !== undefined) write.google_ftid = body.google_ftid ?? null;
  if (body.osm_id !== undefined) write.osm_id = body.osm_id ?? null;
  if (body.website !== undefined) write.website = body.website ?? null;
  if (body.phone !== undefined) write.phone = body.phone ?? null;
  if (body.price !== undefined) write.price = body.price ?? null;
  if (body.currency !== undefined) write.currency = body.currency ?? null;
  return write;
}

/** A cursor as list_collection_places hands it out: the position of the last place of a page. */
const placesCursorSchema = z.tuple([z.number().int(), z.string().max(40), z.number().int().positive()]);

/**
 * The cursor of the page after a place (#2647): its position in the list, so
 * the next page starts right after it whatever changed in between. Opaque to
 * the client, which passes it back as it came.
 */
export function encodePlacesCursor(position: CollectionPlacePosition): string {
  return Buffer.from(JSON.stringify([position.sortOrder, position.createdAt, position.id])).toString('base64url');
}

/** The position a cursor names; null for anything encodePlacesCursor did not write. */
export function decodePlacesCursor(cursor: string): CollectionPlacePosition | null {
  let value: unknown;
  try {
    value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  const parsed = placesCursorSchema.safeParse(value);
  if (!parsed.success) return null;
  const [sortOrder, createdAt, id] = parsed.data;
  return { sortOrder, createdAt, id };
}
