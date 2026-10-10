import { JourneyContributors } from '../../../src/db/entities/JourneyContributors.entity';
import { JourneyEntries } from '../../../src/db/entities/JourneyEntries.entity';
import { JourneyTrips } from '../../../src/db/entities/JourneyTrips.entity';
import { Journeys } from '../../../src/db/entities/Journeys.entity';
import { nextSeq, type FactoryOrm } from './context';
import { createRow, insertRow, insertRowIgnoringConflict } from './rows';
import type { EntityData, EntityDTO } from '@mikro-orm/core';

export type JourneyRow = EntityDTO<Journeys>;
export type JourneyEntryRow = EntityDTO<JourneyEntries>;

/**
 * An active journey owned by `userId`, with the owner already on its
 * contributor list as the journeys service adds them. Journey timestamps are
 * epoch milliseconds, not DATETIME text.
 */
export async function makeJourney(
  orm: FactoryOrm,
  userId: number,
  overrides: EntityData<Journeys> = {},
): Promise<JourneyRow> {
  const now = Date.now();
  const journey = await createRow(orm, Journeys, {
    user: userId,
    title: `Test Journey ${nextSeq('journey')}`,
    subtitle: null,
    status: 'active',
    created_at: now,
    updated_at: now,
    ...overrides,
  });
  await insertRow(orm, JourneyContributors, { journey: journey.id, user: userId, role: 'owner', added_at: now });
  return journey;
}

/** A private entry in the journey, dated 2026-01-15 unless told otherwise. */
export function makeJourneyEntry(
  orm: FactoryOrm,
  journeyId: number,
  authorId: number,
  overrides: EntityData<JourneyEntries> = {},
): Promise<JourneyEntryRow> {
  const now = Date.now();
  return createRow(orm, JourneyEntries, {
    journey: journeyId,
    author: authorId,
    type: 'entry',
    entry_date: '2026-01-15',
    visibility: 'private',
    sort_order: 0,
    created_at: now,
    updated_at: now,
    ...overrides,
  });
}

/** Adds the user as a contributor; an existing contributor keeps their role. */
export async function addJourneyContributor(
  orm: FactoryOrm,
  journeyId: number,
  userId: number,
  role: 'editor' | 'viewer' = 'editor',
): Promise<void> {
  await insertRowIgnoringConflict(orm, JourneyContributors, {
    journey: journeyId,
    user: userId,
    role,
    added_at: Date.now(),
  });
}

/** Links the trip to the journey; linking it twice keeps the first link. */
export async function linkTripToJourney(orm: FactoryOrm, journeyId: number, tripId: number): Promise<void> {
  await insertRowIgnoringConflict(orm, JourneyTrips, { journey: journeyId, trip: tripId, added_at: Date.now() });
}
