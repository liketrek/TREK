import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { RoadtripViasRepository } from '../repositories/RoadtripVias.repository';
import { Days } from './Days.entity';

export class RoadtripVias {
  [EntityRepositoryType]?: RoadtripViasRepository;
  id!: number & Opt;
  day!: Ref<Days>;
  day_id!: number;
  after_order_index!: number;
  sequence: number & Opt = 0;
  lat!: number;
  lng!: number;
  created_at?: string | null;
}

export const RoadtripViasSchema = defineEntity({
  class: RoadtripVias,
  repository: () => RoadtripViasRepository,
  indexes: [
    {
      name: 'idx_roadtrip_vias_day',
      properties: ['day_id', 'after_order_index', 'sequence'],
    },
  ],
  properties: {
    id: p.integer().primary(),
    day: () => p.manyToOne(Days).ref().deleteRule('cascade').hidden(),
    day_id: p.integer().persist(false),
    after_order_index: p.integer(),
    sequence: p.integer().default(0),
    lat: p.double(),
    lng: p.double(),
    created_at: p.text().nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
