import { Collection, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { CollabMessageReactions } from './CollabMessageReactions.entity';
import { TripFiles } from './TripFiles.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class CollabMessages {
  id?: number | null;
  trip!: Ref<Trips>;
  user!: Ref<Users>;
  text!: string;
  replyTo?: Ref<CollabMessages> | null;
  createdAt?: Date | null;
  deleted?: number | null = 0;
  collabMessageReactionsCollection = new Collection<CollabMessageReactions>(this);
  collabMessagesCollection = new Collection<CollabMessages>(this);
  tripFilesCollection = new Collection<TripFiles>(this);
}

export class CollabMessagesRepository extends EntityRepository<CollabMessages> {}

export const CollabMessagesSchema = defineEntity({
  class: CollabMessages,
  repository: () => CollabMessagesRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').index('idx_collab_messages_trip'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    text: p.text(),
    replyTo: () => p.manyToOne(CollabMessages).ref().name('reply_to').nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    deleted: p.integer().nullable(),
    collabMessageReactionsCollection: () => p.oneToMany(CollabMessageReactions).mappedBy('message'),
    collabMessagesCollection: () => p.oneToMany(CollabMessages).mappedBy('replyTo'),
    tripFilesCollection: () => p.oneToMany(TripFiles).mappedBy('message'),
  },
});
