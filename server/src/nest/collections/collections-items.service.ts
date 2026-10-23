import { CollectionLabels } from '../../db/entities/CollectionLabels.entity';
import { Collections } from '../../db/entities/Collections.entity';
import { CollectionLabelsRepository } from '../../db/repositories/CollectionLabels.repository';
import { CollectionsRepository } from '../../db/repositories/Collections.repository';
import { DomainError } from '../common/domain-error';
import { CollectionsService } from './collections.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { CollectionDetailResponse, CollectionItemsRequest, CollectionItemsResponse } from '@trek/shared';

/** The most lists one lookup opens: 50 places and 20 labels can sit in no more than 70. */
const MAX_LISTS = 70;

/** A list the lookup opened, with whether the user may take places out of it. */
type OpenedList = CollectionDetailResponse & { canDelete: boolean };

/**
 * Saved places and labels by their own ids, wherever they are filed (the
 * get_collection_items tool): what an assistant's card needs to name a place
 * a change touches, and what the model needs to read one place of a long list
 * without the whole list. Every list is read through the collections
 * service's own access check, so an id the caller cannot see is simply left
 * out, the same as one that does not exist.
 */
@Injectable()
export class CollectionsItemsService {
  constructor(
    private readonly collections: CollectionsService,
    @InjectRepository(Collections) private readonly collectionsRepo: CollectionsRepository,
    @InjectRepository(CollectionLabels) private readonly labels: CollectionLabelsRepository,
  ) {}

  async getItems(userId: number, request: CollectionItemsRequest): Promise<CollectionItemsResponse> {
    const placeIds = [...new Set(request.placeIds ?? [])];
    const labelIds = [...new Set(request.labelIds ?? [])];
    const [ofPlaces, ofLabels] = await Promise.all([
      Promise.all(placeIds.map((placeId) => this.collectionsRepo.collectionIdOfPlace(placeId))),
      Promise.all(labelIds.map((labelId) => this.labels.collectionIdOf(labelId))),
    ]);
    const listIds = new Set([...ofPlaces, ...ofLabels].filter((listId): listId is number => listId !== undefined));
    const opened = await Promise.all([...listIds].slice(0, MAX_LISTS).map((listId) => this.withDelete(userId, listId)));
    const read = opened.filter((list): list is OpenedList => list !== null);
    const wantedPlaces = new Set(placeIds);
    const wantedLabels = new Set(labelIds);
    return {
      lists: read.map(({ collection, canDelete }) => ({
        id: collection.id,
        name: collection.name,
        color: collection.color ?? null,
        place_count: collection.place_count,
        is_owner: collection.is_owner,
        can_delete: canDelete,
        labels: collection.labels ?? [],
        members: (collection.members ?? []).map(({ user_id, username, status, role, is_owner }) => ({
          user_id,
          username,
          status,
          role,
          is_owner,
        })),
      })),
      places: read.flatMap(({ places }) => places.filter((place) => wantedPlaces.has(place.id))),
      labels: read.flatMap(({ collection }) => (collection.labels ?? []).filter((label) => wantedLabels.has(label.id))),
    };
  }

  /** One list as its members read it, with whether the user may take places out of it. */
  private async withDelete(userId: number, listId: number): Promise<OpenedList | null> {
    const detail = await this.readable(userId, listId);
    if (!detail) return null;
    // Places leave a list only by its owner or an admin (assertCanDelete); an editor adds.
    const role = await this.collections.roleOf(userId, listId);
    return { ...detail, canDelete: role === 'owner' || role === 'admin' };
  }

  /** One list as its members read it; null for one the user may not see or that is gone. */
  private async readable(userId: number, listId: number): Promise<CollectionDetailResponse | null> {
    try {
      return await this.collections.getCollection(userId, listId);
    } catch (err) {
      if (err instanceof DomainError) return null;
      throw err;
    }
  }
}
