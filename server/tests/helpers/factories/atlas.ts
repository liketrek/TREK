import { BucketList } from '../../../src/db/entities/BucketList.entity';
import { VisitedCountries } from '../../../src/db/entities/VisitedCountries.entity';
import { VisitedRegions } from '../../../src/db/entities/VisitedRegions.entity';
import type { FactoryOrm } from './context';
import { createRow, insertRowIgnoringConflict } from './rows';
import type { EntityData, EntityDTO } from '@mikro-orm/core';

export type BucketListRow = EntityDTO<BucketList>;

/** A destination on the user's bucket list. */
export function makeBucketListItem(
  orm: FactoryOrm,
  userId: number,
  overrides: EntityData<BucketList> = {},
): Promise<BucketListRow> {
  return createRow(orm, BucketList, {
    user: userId,
    name: 'Test Destination',
    lat: null,
    lng: null,
    country_code: null,
    notes: null,
    ...overrides,
  });
}

/** Marks the country visited by hand; marking it twice is a no-op. The code is upper-cased as the atlas stores it. */
export async function markCountryVisited(orm: FactoryOrm, userId: number, countryCode: string): Promise<void> {
  await insertRowIgnoringConflict(orm, VisitedCountries, { user: userId, country_code: countryCode.toUpperCase() });
}

/** Marks the region visited; marking it twice is a no-op. */
export async function markRegionVisited(
  orm: FactoryOrm,
  userId: number,
  region: { region_code: string; region_name: string; country_code: string },
): Promise<void> {
  await insertRowIgnoringConflict(orm, VisitedRegions, { user: userId, ...region });
}
