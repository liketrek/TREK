import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { MailIngestCandidatesRepository } from '../repositories/MailIngestCandidates.repository';
import { DbTimestampType } from '../types';
import { MailIngestMessages } from './MailIngestMessages.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class MailIngestCandidates {
  [EntityRepositoryType]?: MailIngestCandidatesRepository;
  id!: number & Opt;
  message!: Ref<MailIngestMessages>;
  message_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  position: number & Opt = 0;
  item_json?: string | null;
  source?: string | null;
  checks_json?: string | null;
  uncertain_fields?: string | null;
  match_json?: string | null;
  suggestedTrip?: Ref<Trips> | null;
  suggested_trip_id?: number | null;
  dedupe_key?: string | null;
  content_hash?: string | null;
  resolution: string & Opt = 'pending';
  reason?: string | null;
  resolvedTrip?: Ref<Trips> | null;
  resolved_trip_id?: number | null;
  created_ids_json?: string | null;
  attach_error?: string | null;
  resolved_by?: number | null;
  resolved_at?: string | null;
  undo_until?: string | null;
  created_at!: string & Opt;
}

export const MailIngestCandidatesSchema = defineEntity({
  class: MailIngestCandidates,
  repository: () => MailIngestCandidatesRepository,
  indexes: [
    {
      name: 'idx_mail_ingest_candidates_resolved',
      properties: ['resolved_trip_id', 'content_hash'],
    },
    {
      name: 'idx_mail_ingest_candidates_user',
      properties: ['user_id', 'resolution'],
    },
    {
      name: 'idx_mail_ingest_candidates_message',
      properties: ['message_id', 'position'],
    },
  ],
  properties: {
    id: p.integer().primary(),
    message: () => p.manyToOne(MailIngestMessages).ref().deleteRule('cascade').hidden(),
    message_id: p.integer().persist(false),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    position: p.integer().default(0),
    item_json: p.text().nullable(),
    source: p.text().nullable(),
    checks_json: p.text().nullable(),
    uncertain_fields: p.text().nullable(),
    match_json: p.text().nullable(),
    suggestedTrip: () => p.manyToOne(Trips).ref().nullable().hidden().index('idx_mail_ingest_candidates_suggested'),
    suggested_trip_id: p.integer().nullable().persist(false).index('idx_mail_ingest_candidates_suggested'),
    dedupe_key: p.text().nullable(),
    content_hash: p.text().nullable(),
    resolution: p.text().default('pending'),
    reason: p.text().nullable(),
    resolvedTrip: () => p.manyToOne(Trips).ref().nullable().hidden(),
    resolved_trip_id: p.integer().nullable().persist(false),
    created_ids_json: p.text().nullable(),
    attach_error: p.text().nullable(),
    resolved_by: p.integer().nullable(),
    resolved_at: p.type(DbTimestampType).nullable(),
    undo_until: p.type(DbTimestampType).nullable(),
    created_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
