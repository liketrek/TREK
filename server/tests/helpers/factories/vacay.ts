import { VacayEntries } from '../../../src/db/entities/VacayEntries.entity';
import { VacayPlanMembers } from '../../../src/db/entities/VacayPlanMembers.entity';
import { VacayPlans } from '../../../src/db/entities/VacayPlans.entity';
import type { FactoryOrm } from './context';
import { createRow } from './rows';
import type { EntityData, EntityDTO } from '@mikro-orm/core';

export type VacayPlanRow = EntityDTO<VacayPlans>;

/** A vacation plan owned by `ownerId`, with the plan defaults the migration sets. */
export function makeVacayPlan(
  orm: FactoryOrm,
  ownerId: number,
  overrides: EntityData<VacayPlans> = {},
): Promise<VacayPlanRow> {
  return createRow(orm, VacayPlans, { owner: ownerId, ...overrides });
}

/** Invites the user into the plan; `status: 'accepted'` (the default here) makes them a member. */
export function addVacayPlanMember(
  orm: FactoryOrm,
  planId: number,
  userId: number,
  status: 'pending' | 'accepted' = 'accepted',
): Promise<EntityDTO<VacayPlanMembers>> {
  return createRow(orm, VacayPlanMembers, { plan: planId, user: userId, status });
}

/** A full vacation day for the user in the plan. */
export function makeVacayEntry(
  orm: FactoryOrm,
  planId: number,
  userId: number,
  date: string,
  overrides: EntityData<VacayEntries> = {},
): Promise<EntityDTO<VacayEntries>> {
  return createRow(orm, VacayEntries, { plan: planId, user: userId, date, ...overrides });
}
