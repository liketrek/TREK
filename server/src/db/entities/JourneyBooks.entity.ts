import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { JourneyBooksRepository } from '../repositories/JourneyBooks.repository';
import { DbTimestampType } from '../types';
import { Journeys } from './Journeys.entity';
import { Users } from './Users.entity';

export class JourneyBooks {
  [EntityRepositoryType]?: JourneyBooksRepository;
  id!: number & Opt;
  journey!: Ref<Journeys>;
  journey_id!: number;
  title: string & Opt = '';
  document!: string;
  version: number & Opt = 1;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  updatedByRef?: Ref<Users> | null;
  createdByRef?: Ref<Users> | null;
}

export const JourneyBooksSchema = defineEntity({
  class: JourneyBooks,
  repository: () => JourneyBooksRepository,
  properties: {
    id: p.integer().primary(),
    journey: () => p.manyToOne(Journeys).ref().deleteRule('cascade').hidden().index('idx_journey_books_journey'),
    journey_id: p.integer().persist(false).index('idx_journey_books_journey'),
    title: p.text().default(''),
    document: p.text(),
    version: p.integer().default(1),
    created_by: p.integer().nullable().persist(false),
    updated_by: p.integer().nullable().persist(false),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    updated_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    updatedByRef: () => p.manyToOne(Users).ref().joinColumn('updated_by').nullable().hidden(),
    createdByRef: () => p.manyToOne(Users).ref().joinColumn('created_by').nullable().hidden(),
  },
});
