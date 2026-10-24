import { EntityRepositoryType, type Opt, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TourPackingLinksRepository } from '../repositories/TourPackingLinks.repository';
import { DbTimestampType } from '../types';
import { Tours } from './Tours.entity';
import { Users } from './Users.entity';

export class TourPackingLinks {
  [EntityRepositoryType]?: TourPackingLinksRepository;
  [PrimaryKeyProp]?: 'place';
  place?: Ref<Tours> | null;
  place_id?: number | null;
  category?: string | null;
  linked_by?: number | null;
  linked_at!: string & Opt;
  linkedByRef?: Ref<Users> | null;
}

export const TourPackingLinksSchema = defineEntity({
  class: TourPackingLinks,
  repository: () => TourPackingLinksRepository,
  properties: {
    place: () => p.oneToOne(Tours).primary().ref().name('place_id').deleteRule('cascade').nullable().hidden(),
    place_id: p.integer().nullable().persist(false),
    category: p.text().nullable(),
    linked_by: p.integer().nullable().persist(false).index('idx_tour_packing_links_linked_by'),
    linked_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    linkedByRef: () => p.manyToOne(Users).ref().joinColumn('linked_by').nullable().hidden().index('idx_tour_packing_links_linked_by'),
  },
});
