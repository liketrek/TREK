import { Collection, EntityRepositoryType, type Opt, PrimaryKeyProp, defineEntity, p } from '@mikro-orm/core';
import { TourTypesRepository } from '../repositories/TourTypes.repository';
import { Tours } from './Tours.entity';

export class TourTypes {
  [EntityRepositoryType]?: TourTypesRepository;
  [PrimaryKeyProp]?: 'key';
  key?: string | null;
  label_key!: string;
  icon!: string;
  color!: string;
  routing_profile?: string | null;
  is_sport: number & Opt = 1;
  enabled: number & Opt = 1;
  sort_order: number & Opt = 0;
  tours_collection = new Collection<Tours>(this);
}

export const TourTypesSchema = defineEntity({
  class: TourTypes,
  repository: () => TourTypesRepository,
  properties: {
    key: p.text().primary().nullable(),
    label_key: p.text(),
    icon: p.text(),
    color: p.text(),
    routing_profile: p.text().nullable(),
    is_sport: p.integer().default(1),
    enabled: p.integer().default(1),
    sort_order: p.integer().default(0),
    tours_collection: () => p.oneToMany(Tours).mappedBy('tourTypeRef').hidden(),
  },
});
