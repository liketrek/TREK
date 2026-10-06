import { EntityRepositoryType, type Opt, PrimaryKeyProp, defineEntity, p } from '@mikro-orm/core';
import { TrekPhotoCacheMetaRepository } from '../repositories/TrekPhotoCacheMeta.repository';

export class TrekPhotoCacheMeta {
  [EntityRepositoryType]?: TrekPhotoCacheMetaRepository;
  [PrimaryKeyProp]?: 'cache_key';
  cache_key!: string;
  content_type: string & Opt = 'image/jpeg';
  fetched_at!: number;
}

export const TrekPhotoCacheMetaSchema = defineEntity({
  class: TrekPhotoCacheMeta,
  repository: () => TrekPhotoCacheMetaRepository,
  properties: {
    cache_key: p.text().primary(),
    content_type: p.text().default('image/jpeg'),
    fetched_at: p.integer().index('idx_trek_photo_cache_meta_fetched_at'),
  },
});
