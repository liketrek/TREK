import { GoogleApiUsageRepository } from '../repositories/GoogleApiUsage.repository';
import { EntityRepositoryType, type Opt, PrimaryKeyProp, defineEntity, p } from '@mikro-orm/core';

export class GoogleApiUsage {
  [EntityRepositoryType]?: GoogleApiUsageRepository;
  [PrimaryKeyProp]?: 'day';
  day?: string | null;
  calls: number & Opt = 0;
}

export const GoogleApiUsageSchema = defineEntity({
  class: GoogleApiUsage,
  repository: () => GoogleApiUsageRepository,
  properties: {
    day: p.text().primary().nullable(),
    calls: p.integer().default(0),
  },
});
