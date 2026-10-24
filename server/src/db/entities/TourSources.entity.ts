import { EntityRepositoryType, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TourSourcesRepository } from '../repositories/TourSources.repository';
import { DbTimestampType } from '../types';
import { TourSourceHints } from './TourSourceHints.entity';
import { Tours } from './Tours.entity';
import { Users } from './Users.entity';

export class TourSources {
  [EntityRepositoryType]?: TourSourcesRepository;
  [PrimaryKeyProp]?: 'place';
  place?: Ref<Tours> | null;
  place_id?: number | null;
  provider!: string;
  instance!: string;
  external_id!: string;
  external_url?: string | null;
  external_updated?: string | null;
  content_hash!: string;
  local_hash!: string;
  imported_at?: string | null;
  imported_by?: number | null;
  importedByRef?: Ref<Users> | null;
  tour_source_hints: Ref<TourSourceHints> | null = null;
}

export const TourSourcesSchema = defineEntity({
  class: TourSources,
  repository: () => TourSourcesRepository,
  indexes: [
    {
      name: 'idx_tour_sources_external',
      properties: ['provider', 'instance', 'external_id'],
    },
  ],
  properties: {
    place: () => p.oneToOne(Tours).primary().ref().name('place_id').deleteRule('cascade').nullable().hidden(),
    place_id: p.integer().nullable().persist(false),
    provider: p.text(),
    instance: p.text(),
    external_id: p.text(),
    external_url: p.text().nullable(),
    external_updated: p.text().nullable(),
    content_hash: p.text(),
    local_hash: p.text(),
    imported_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    imported_by: p.integer().nullable().persist(false).index('idx_tour_sources_imported_by'),
    importedByRef: () => p.manyToOne(Users).ref().joinColumn('imported_by').nullable().hidden().index('idx_tour_sources_imported_by'),
    tour_source_hints: () => p.oneToOne(TourSourceHints).ref().mappedBy('place').hidden(),
  },
});
