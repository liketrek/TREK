import { CollectionMembers } from '../../../src/db/entities/CollectionMembers.entity';
import { CollectionPlaces } from '../../../src/db/entities/CollectionPlaces.entity';
import { Collections } from '../../../src/db/entities/Collections.entity';
import { inContext, nextSeq, type FactoryOrm } from './context';
import { createRow } from './rows';
import type { EntityData, EntityDTO } from '@mikro-orm/core';

export type CollectionRow = EntityDTO<Collections>;
export type CollectionPlaceRow = EntityDTO<CollectionPlaces>;

/** A collection owned by `ownerId`. */
export function makeCollection(
  orm: FactoryOrm,
  ownerId: number,
  overrides: EntityData<Collections> = {},
): Promise<CollectionRow> {
  return createRow(orm, Collections, {
    owner: ownerId,
    name: `Test Collection ${nextSeq('collection')}`,
    ...overrides,
  });
}

/** Invites the user into the collection; `status: 'accepted'` makes them a member right away. */
export function addCollectionMember(
  orm: FactoryOrm,
  collectionId: number,
  userId: number,
  overrides: EntityData<CollectionMembers> = {},
): Promise<EntityDTO<CollectionMembers>> {
  return createRow(orm, CollectionMembers, {
    collection: collectionId,
    user: userId,
    status: 'accepted',
    role: 'editor',
    ...overrides,
  });
}

/** A place saved into the collection by `ownerId`. */
export function makeCollectionPlace(
  orm: FactoryOrm,
  collectionId: number,
  ownerId: number,
  overrides: EntityData<CollectionPlaces> = {},
): Promise<CollectionPlaceRow> {
  return createRow(orm, CollectionPlaces, {
    collection: collectionId,
    owner: ownerId,
    name: `Saved Place ${nextSeq('collection-place')}`,
    lat: 48.8566,
    lng: 2.3522,
    ...overrides,
  });
}

/** Puts the tags on the saved place. */
export async function tagCollectionPlace(orm: FactoryOrm, collectionPlaceId: number, tagIds: number[]): Promise<void> {
  await inContext(orm, (em) => em.getRepository(CollectionPlaces).attachTags(collectionPlaceId, tagIds));
}

/** Files the saved place under the collection label. */
export async function labelCollectionPlace(orm: FactoryOrm, collectionPlaceId: number, labelId: number): Promise<void> {
  await inContext(orm, (em) => em.getRepository(CollectionPlaces).assignLabel(collectionPlaceId, labelId));
}
