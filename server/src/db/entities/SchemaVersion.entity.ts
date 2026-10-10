import { EntityRepositoryType, type Opt, defineEntity, p } from '@mikro-orm/core';
import { SchemaVersionRepository } from '../repositories/SchemaVersion.repository';

export class SchemaVersion {
  [EntityRepositoryType]?: SchemaVersionRepository;
  id!: number & Opt;
  version!: number;
}

export const SchemaVersionSchema = defineEntity({
  class: SchemaVersion,
  repository: () => SchemaVersionRepository,
  properties: {
    id: p.integer().primary(),
    version: p.integer(),
  },
});
