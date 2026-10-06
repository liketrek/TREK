import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { CollabMessagesRepository } from '../repositories/CollabMessages.repository';
import { DbTimestampType } from '../types';
import { CollabMessageReactions } from './CollabMessageReactions.entity';
import { TripFiles } from './TripFiles.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class CollabMessages {
  [EntityRepositoryType]?: CollabMessagesRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  text!: string;
  reply_to?: number | null;
  created_at?: string | null;
  deleted?: number | null = 0;
  replyToRef?: Ref<CollabMessages> | null;
  collab_message_reactions_collection = new Collection<CollabMessageReactions>(this);
  collab_messages_collection = new Collection<CollabMessages>(this);
  trip_files_collection = new Collection<TripFiles>(this);
}

export const CollabMessagesSchema = defineEntity({
  class: CollabMessages,
  repository: () => CollabMessagesRepository,
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden().index('idx_collab_messages_trip'),
    trip_id: p.integer().persist(false).index('idx_collab_messages_trip'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    text: p.text(),
    reply_to: p.integer().nullable().persist(false),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    deleted: p.integer().nullable(),
    replyToRef: () => p.manyToOne(CollabMessages).ref().joinColumn('reply_to').nullable().hidden(),
    collab_message_reactions_collection: () => p.oneToMany(CollabMessageReactions).mappedBy('message').hidden(),
    collab_messages_collection: () => p.oneToMany(CollabMessages).mappedBy('replyToRef').hidden(),
    trip_files_collection: () => p.oneToMany(TripFiles).mappedBy('message').hidden(),
  },
});
