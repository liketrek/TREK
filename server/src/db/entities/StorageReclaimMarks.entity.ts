import { EntityRepositoryType, PrimaryKeyProp, defineEntity, p } from '@mikro-orm/core';
import { StorageReclaimMarksRepository } from '../repositories/StorageReclaimMarks.repository';
import { DbTimestampType } from '../types';

export class StorageReclaimMarks {
  [EntityRepositoryType]?: StorageReclaimMarksRepository;
  [PrimaryKeyProp]?: ['category', 'key'];
  category!: string;
  key!: string;
  first_seen_at!: string;
  size!: number;
}

export const StorageReclaimMarksSchema = defineEntity({
  class: StorageReclaimMarks,
  repository: () => StorageReclaimMarksRepository,
  properties: {
    category: p.text().primary(),
    key: p.text().primary(),
    first_seen_at: p.type(DbTimestampType),
    size: p.integer(),
  },
});
