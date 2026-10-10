import { Categories } from '../../../src/db/entities/Categories.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import { Tags } from '../../../src/db/entities/Tags.entity';
import { inContext, nextSeq, type FactoryOrm } from './context';
import { createRow } from './rows';
import type { EntityData, EntityDTO } from '@mikro-orm/core';

export type PlaceRow = EntityDTO<Places>;
export type CategoryRow = EntityDTO<Categories>;
export type TagRow = EntityDTO<Tags>;

/** A category; global unless `user` names an owner. */
export function makeCategory(orm: FactoryOrm, overrides: EntityData<Categories> = {}): Promise<CategoryRow> {
  return createRow(orm, Categories, {
    name: `Test Category ${nextSeq('category')}`,
    color: '#6366f1',
    icon: '📍',
    ...overrides,
  });
}

/** A tag owned by `userId`. */
export function makeTag(orm: FactoryOrm, userId: number, overrides: EntityData<Tags> = {}): Promise<TagRow> {
  return createRow(orm, Tags, {
    user: userId,
    name: `Test Tag ${nextSeq('tag')}`,
    color: '#10b981',
    ...overrides,
  });
}

/** The lowest-id category, the one a place gets when the test names none. */
function firstCategoryId(orm: FactoryOrm): Promise<number | null> {
  return inContext(orm, async (em) => {
    const [first] = await em.find(Categories, {}, { orderBy: { id: 'asc' }, limit: 1, disableIdentityMap: true });
    return first?.id ?? null;
  });
}

/**
 * A place on the trip, in Paris unless told otherwise, filed under the first
 * seeded category when `category` is not given (pass `category: null` for
 * an uncategorised one).
 */
export async function makePlace(
  orm: FactoryOrm,
  tripId: number,
  overrides: EntityData<Places> = {},
): Promise<PlaceRow> {
  const category = 'category' in overrides ? overrides.category : await firstCategoryId(orm);
  return createRow(orm, Places, {
    trip: tripId,
    name: 'Test Place',
    lat: 48.8566,
    lng: 2.3522,
    description: null,
    ...overrides,
    category,
  });
}

/** Puts the tags on the place; tags it already has are skipped. */
export async function tagPlace(orm: FactoryOrm, placeId: number, tagIds: number[]): Promise<void> {
  await inContext(orm, (em) => em.getRepository(Tags).insertIgnore(placeId, tagIds));
}
