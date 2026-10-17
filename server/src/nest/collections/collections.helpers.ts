import type { CollectionLink } from '@trek/shared';

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
