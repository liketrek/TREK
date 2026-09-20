import { type Opt, PrimaryKeyProp, defineEntity, p, EntityRepository } from '@mikro-orm/core';

export class TrekPhotoCacheMeta {
  [PrimaryKeyProp]?: 'cacheKey';
  cacheKey?: string | null;
  contentType: string & Opt = 'image/jpeg';
  fetchedAt!: number;
}

export class TrekPhotoCacheMetaRepository extends EntityRepository<TrekPhotoCacheMeta> {}

export const TrekPhotoCacheMetaSchema = defineEntity({
  class: TrekPhotoCacheMeta,
  repository: () => TrekPhotoCacheMetaRepository,
  properties: {
    cacheKey: p.text().primary().nullable(),
    contentType: p.text(),
    fetchedAt: p.integer().index('idx_trek_photo_cache_meta_fetched_at'),
  },
});
