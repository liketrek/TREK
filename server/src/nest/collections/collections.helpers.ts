import type { CollectionLink, CollectionPlaceUpdateRequest } from '@trek/shared';

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
