import { CollectionLabels } from '../../db/entities/CollectionLabels.entity';
import { Collections } from '../../db/entities/Collections.entity';
import { CollectionLabelsRepository } from '../../db/repositories/CollectionLabels.repository';
import {
  CollectionsRepository,
  type CollectionPlacePageRow,
  type CollectionPlacePosition,
} from '../../db/repositories/Collections.repository';
import { DomainError } from '../common/domain-error';
import { decodePlacesCursor, encodePlacesCursor } from './collections.helpers';
import { CollectionsService } from './collections.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { COLLECTION_PLACES_PAGE_DEFAULT, type CollectionPlacesPageRequest } from '@trek/shared';

/**
 * How long the places of one page may run as JSON. The in-app assistant cuts a
 * tool answer at 40,000 characters, and a page cut there would leave its last
 * places unread while next_cursor goes on after them. So a page ends early,
 * before that cut, and next_cursor goes on after the last place it holds.
 */
const PAGE_CHARS = 30_000;

/** The fields a page carries only where a place has them, so an empty one costs nothing. */
const FIELDS_WHEN_SET = ['address', 'lat', 'lng', 'google_place_id', 'website', 'phone'] as const;

/** A saved place as a page lists it: id, name, status, its labels and the fields it has. */
type CompactPlace = Record<string, unknown>;

/** One page of a list's places, next to what the list is and how far the filter reaches. */
interface CollectionPlacesPage {
  collection: { id: number; name: string };
  labels: Array<{ id: number; name: string; color: string | null }>;
  /** Places of the list the filter matches, on every page. */
  total: number;
  places: CompactPlace[];
  next_cursor: string | null;
}

function compactPlace(row: CollectionPlacePageRow, labelIds: number[]): CompactPlace {
  const place: CompactPlace = { id: row.id, name: row.name, status: row.status };
  if (labelIds.length > 0) place.label_ids = labelIds;
  for (const field of FIELDS_WHEN_SET) {
    const value = row[field];
    if (value !== null && value !== '') place[field] = value;
  }
  return place;
}

/** The places of a page in order until their JSON would pass PAGE_CHARS; always at least one. */
function fillPage(rows: CollectionPlacePageRow[], labelIds: Map<number, number[]>): CompactPlace[] {
  const page: CompactPlace[] = [];
  let chars = 0;
  for (const row of rows) {
    const place = compactPlace(row, labelIds.get(row.id) ?? []);
    chars += JSON.stringify(place).length + 1;
    if (page.length > 0 && chars > PAGE_CHARS) break;
    page.push(place);
  }
  return page;
}

function positionOf(row: CollectionPlacePageRow): CollectionPlacePosition {
  return { sortOrder: row.sort_key, createdAt: row.created_key, id: row.id };
}

/**
 * A long list a page at a time (the list_collection_places tool, #2647).
 * get_collection answers a list whole, every place with its full row, tags and
 * every member's vote, which an MCP client cuts down to its first and last
 * places on a long list. A page is the list's own order, compact, and goes on
 * from a cursor: the position of its last place, so places that stop matching
 * the filter in between (labelled while paging through the unlabelled ones)
 * move none of the others. Read through the collections service's own access
 * check, like get_collection.
 */
@Injectable()
export class CollectionsPlacesPageService {
  constructor(
    private readonly collections: CollectionsService,
    @InjectRepository(Collections) private readonly collectionsRepo: CollectionsRepository,
    @InjectRepository(CollectionLabels) private readonly labels: CollectionLabelsRepository,
  ) {}

  async listPlaces(userId: number, request: CollectionPlacesPageRequest): Promise<CollectionPlacesPage> {
    const { collectionId, status, labelId, unlabeled } = request;
    await this.collections.assertAccess(userId, collectionId);
    if (labelId !== undefined && unlabeled) {
      throw new DomainError(400, 'Pass either labelId or unlabeled, not both');
    }
    const after = this.positionAfter(request.cursor);
    const labels = await this.labels.listByCollection(collectionId);
    if (labelId !== undefined && !labels.some((label) => label.id === labelId)) {
      throw new DomainError(404, 'Label not found in this list');
    }

    const filter = { status, labelId, unlabeled };
    const limit = request.limit ?? COLLECTION_PLACES_PAGE_DEFAULT;
    const total = await this.collectionsRepo.countPlacePage(collectionId, filter);
    // One place more than the page holds says whether another page follows.
    const rows = await this.collectionsRepo.listPlacePage(collectionId, filter, after, limit + 1);
    const candidates = rows.slice(0, limit);
    const places = fillPage(candidates, await this.labelIdsOf(candidates.map((row) => row.id)));
    const last = rows[places.length - 1];
    const collection = await this.collectionsRepo.findRow(collectionId);
    return {
      collection: { id: collectionId, name: collection?.name ?? '' },
      labels: labels.map(({ id, name, color }) => ({ id, name, color })),
      total,
      places,
      next_cursor: places.length < rows.length && last ? encodePlacesCursor(positionOf(last)) : null,
    };
  }

  /** Where a page starts: after the place the cursor names, or at the top without one. */
  private positionAfter(cursor: string | undefined): CollectionPlacePosition | null {
    if (cursor === undefined) return null;
    const position = decodePlacesCursor(cursor);
    if (!position) throw new DomainError(400, 'Invalid cursor: pass the next_cursor of the page before');
    return position;
  }

  /** Each place's label ids, in one read for the whole page. */
  private async labelIdsOf(placeIds: number[]): Promise<Map<number, number[]>> {
    const byPlace = new Map<number, number[]>();
    for (const { pid, label_id } of await this.collectionsRepo.loadLabelIdsByPlaceIds(placeIds)) {
      byPlace.set(pid, [...(byPlace.get(pid) ?? []), label_id]);
    }
    return byPlace;
  }
}
