import { EntityRepositoryType, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { PlaceRegionsRepository } from '../repositories/PlaceRegions.repository';
import { Places } from './Places.entity';

export class PlaceRegions {
  [EntityRepositoryType]?: PlaceRegionsRepository;
  [PrimaryKeyProp]?: 'place';
  place?: Ref<Places> | null;
  place_id?: number | null;
  country_code!: string;
  region_code!: string;
  region_name!: string;
}

export const PlaceRegionsSchema = defineEntity({
  class: PlaceRegions,
  repository: () => PlaceRegionsRepository,
  properties: {
    place: () => p.oneToOne(Places).primary().ref().deleteRule('cascade').nullable().hidden(),
    place_id: p.integer().nullable().persist(false),
    country_code: p.text().index('idx_place_regions_country'),
    region_code: p.text().index('idx_place_regions_region'),
    region_name: p.text(),
  },
});
