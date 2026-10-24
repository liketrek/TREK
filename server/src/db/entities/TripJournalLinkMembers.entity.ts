import { EntityRepositoryType, type Opt, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TripJournalLinkMembersRepository } from '../repositories/TripJournalLinkMembers.repository';
import { TripJournalLinks } from './TripJournalLinks.entity';
import { Users } from './Users.entity';

export class TripJournalLinkMembers {
  [EntityRepositoryType]?: TripJournalLinkMembersRepository;
  [PrimaryKeyProp]?: ['link', 'user'];
  link!: Ref<TripJournalLinks>;
  link_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  role: TTripJournalLinkMembersRole & Opt = TripJournalLinkMembersRole.VIEWER;
  hide_skeletons: number & Opt = 0;
  added_at!: number;
}

export const TripJournalLinkMembersRole = {
  VIEWER: 'viewer',
  EDITOR: 'editor',
} as const;

export type TTripJournalLinkMembersRole = (typeof TripJournalLinkMembersRole)[keyof typeof TripJournalLinkMembersRole];

export const TripJournalLinkMembersSchema = defineEntity({
  class: TripJournalLinkMembers,
  repository: () => TripJournalLinkMembersRepository,
  uniques: [{ properties: ['link', 'user'] }],
  properties: {
    link: () => p.manyToOne(TripJournalLinks).primary().ref().hidden(),
    link_id: p.integer().persist(false),
    user: () => p.manyToOne(Users).primary().ref().hidden().index('idx_trip_journal_link_members_user'),
    user_id: p.integer().persist(false).index('idx_trip_journal_link_members_user'),
    role: p.enum(() => TripJournalLinkMembersRole).default('viewer'),
    hide_skeletons: p.integer().default(0),
    added_at: p.integer(),
  },
});
