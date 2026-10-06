import { MigrationsRepository } from '../repositories/Migrations.repository';
import { EntityRepositoryType, defineEntity, p } from '@mikro-orm/core';

export class Migrations {
  [EntityRepositoryType]?: MigrationsRepository;
  id!: number;
  timestamp!: bigint;
  name!: string;
}

export const MigrationsSchema = defineEntity({
  class: Migrations,
  repository: () => MigrationsRepository,
  properties: {
    id: p.integer().primary(),
    timestamp: p.bigint(),
    name: p.string(),
  },
});
