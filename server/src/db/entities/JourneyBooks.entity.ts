import { type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Journeys } from './Journeys.entity';
import { Users } from './Users.entity';

export class JourneyBooks {
  id?: number | null;
  journey!: Ref<Journeys>;
  title: string & Opt = '';
  document!: string;
  version: number & Opt = 1;
  createdBy?: Ref<Users> | null;
  updatedBy?: Ref<Users> | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export class JourneyBooksRepository extends EntityRepository<JourneyBooks> {}

export const JourneyBooksSchema = defineEntity({
  class: JourneyBooks,
  repository: () => JourneyBooksRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    journey: () => p.manyToOne(Journeys).ref().deleteRule('cascade').index('idx_journey_books_journey'),
    title: p.text(),
    document: p.text(),
    version: p.integer(),
    createdBy: () => p.manyToOne(Users).ref().name('created_by').nullable(),
    updatedBy: () => p.manyToOne(Users).ref().name('updated_by').nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    updatedAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
