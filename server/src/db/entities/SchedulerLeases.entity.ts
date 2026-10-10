import { EntityRepositoryType, PrimaryKeyProp, defineEntity, p } from '@mikro-orm/core';
import { SchedulerLeasesRepository } from '../repositories/SchedulerLeases.repository';

export class SchedulerLeases {
  [EntityRepositoryType]?: SchedulerLeasesRepository;
  [PrimaryKeyProp]?: 'name';
  name!: string;
  owner!: string;
  expires_at!: number;
}

export const SchedulerLeasesSchema = defineEntity({
  class: SchedulerLeases,
  repository: () => SchedulerLeasesRepository,
  properties: {
    name: p.text().primary(),
    owner: p.text(),
    expires_at: p.integer(),
  },
});
