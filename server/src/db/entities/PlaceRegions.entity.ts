import { PrimaryKeyProp, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Places } from './Places.entity';

export class PlaceRegions {
  [PrimaryKeyProp]?: 'place';
  place?: Ref<Places> | null;
  countryCode!: string;
  regionCode!: string;
  regionName!: string;
}

export class PlaceRegionsRepository extends EntityRepository<PlaceRegions> {}

export const PlaceRegionsSchema = defineEntity({
  class: PlaceRegions,
  repository: () => PlaceRegionsRepository,
  properties: {
    place: () => p.oneToOne(Places).primary().ref().nullable(),
    countryCode: p.text().index('idx_place_regions_country'),
    regionCode: p.text().index('idx_place_regions_region'),
    regionName: p.text(),
  },
});
