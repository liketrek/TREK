import { defineEntity, p, EntityRepository } from '@mikro-orm/core';

export class SchemaVersion {
  id?: number | null;
  version!: number;
}

export class SchemaVersionRepository extends EntityRepository<SchemaVersion> {}

export const SchemaVersionSchema = defineEntity({
  class: SchemaVersion,
  repository: () => SchemaVersionRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    version: p.integer(),
  },
});
