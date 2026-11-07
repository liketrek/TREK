import { EntityRepositoryType, PrimaryKeyProp, defineEntity, p } from '@mikro-orm/core';
import { StorageReleaseQueueRepository } from '../repositories/StorageReleaseQueue.repository';
import { DbTimestampType } from '../types';

export class StorageReleaseQueue {
  [EntityRepositoryType]?: StorageReleaseQueueRepository;
  [PrimaryKeyProp]?: ['category', 'key'];
  category!: string;
  key!: string;
  due_at!: string;
}

export const StorageReleaseQueueSchema = defineEntity({
  class: StorageReleaseQueue,
  repository: () => StorageReleaseQueueRepository,
  properties: {
    category: p.text().primary(),
    key: p.text().primary(),
    due_at: p.type(DbTimestampType),
  },
});
