import { type Opt, PrimaryKeyProp, defineEntity, p, EntityRepository } from '@mikro-orm/core';

export class PlaceDetailsCache {
  [PrimaryKeyProp]?: ['placeId', 'lang', 'expanded'];
  placeId!: string;
  lang: string & Opt = '';
  expanded: number & Opt = 0;
  payloadJson!: string;
  fetchedAt!: number;
}

export class PlaceDetailsCacheRepository extends EntityRepository<PlaceDetailsCache> {}

export const PlaceDetailsCacheSchema = defineEntity({
  class: PlaceDetailsCache,
  repository: () => PlaceDetailsCacheRepository,
  properties: {
    placeId: p.text().primary(),
    lang: p.text().primary(),
    expanded: p.integer().primary(),
    payloadJson: p.text(),
    fetchedAt: p.integer(),
  },
});
