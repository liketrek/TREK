import { EntityRepositoryType, type Opt, PrimaryKeyProp, defineEntity, p } from '@mikro-orm/core';
import { PlaceDetailsCacheRepository } from '../repositories/PlaceDetailsCache.repository';

export class PlaceDetailsCache {
  [EntityRepositoryType]?: PlaceDetailsCacheRepository;
  [PrimaryKeyProp]?: ['place_id', 'lang', 'expanded'];
  place_id!: string;
  lang: string & Opt = '';
  expanded: number & Opt = 0;
  payload_json!: string;
  fetched_at!: number;
}

export const PlaceDetailsCacheSchema = defineEntity({
  class: PlaceDetailsCache,
  repository: () => PlaceDetailsCacheRepository,
  properties: {
    place_id: p.text().primary(),
    lang: p.text().primary().default(''),
    expanded: p.integer().primary().default(0),
    payload_json: p.text(),
    fetched_at: p.integer(),
  },
});
