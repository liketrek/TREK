import { defineEntity, p, EntityRepository } from '@mikro-orm/core';

export class Migrations {
  id!: number;
  timestamp!: bigint;
  name!: string;
}

export class MigrationsRepository extends EntityRepository<Migrations> {}

export const MigrationsSchema = defineEntity({
  class: Migrations,
  repository: () => MigrationsRepository,
  properties: {
    id: p.integer().primary(),
    timestamp: p.bigint(),
    name: p.string(),
  },
});
