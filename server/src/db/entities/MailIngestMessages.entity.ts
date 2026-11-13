import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { MailIngestMessagesRepository } from '../repositories/MailIngestMessages.repository';
import { DbTimestampType } from '../types';
import { MailIngestAddresses } from './MailIngestAddresses.entity';
import { MailIngestCandidates } from './MailIngestCandidates.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class MailIngestMessages {
  [EntityRepositoryType]?: MailIngestMessagesRepository;
  id!: number & Opt;
  transport!: string;
  message_id_hdr?: string | null;
  dedupe_hash!: string;
  address?: Ref<MailIngestAddresses> | null;
  address_id?: number | null;
  user!: Ref<Users>;
  user_id!: number;
  trip?: Ref<Trips> | null;
  trip_id?: number | null;
  from_addr?: string | null;
  from_verified: number & Opt = 0;
  auth_results?: string | null;
  subject?: string | null;
  received_at!: string & Opt;
  size!: number;
  raw_eml_enc?: string | null;
  raw_purged_at?: string | null;
  status: string & Opt = 'queued';
  reason?: string | null;
  hints?: string | null;
  attachments?: string | null;
  forwarding_code?: string | null;
  attempts: number & Opt = 0;
  next_attempt_at!: string & Opt;
  lease_until?: string | null;
  ai_used: number & Opt = 0;
  processed_at?: string | null;
  mail_ingest_candidates_collection = new Collection<MailIngestCandidates>(this);
}

export const MailIngestMessagesSchema = defineEntity({
  class: MailIngestMessages,
  repository: () => MailIngestMessagesRepository,
  indexes: [
    {
      name: 'idx_mail_ingest_messages_address',
      properties: ['address_id', 'received_at'],
    },
    {
      name: 'idx_mail_ingest_messages_due',
      properties: ['status', 'next_attempt_at'],
    },
    {
      name: 'idx_mail_ingest_messages_user',
      properties: ['user_id', 'received_at'],
    },
  ],
  uniques: [{ properties: ['dedupe_hash'] }],
  properties: {
    id: p.integer().primary(),
    transport: p.text(),
    message_id_hdr: p.text().nullable(),
    dedupe_hash: p.text(),
    address: () => p.manyToOne(MailIngestAddresses).ref().nullable().hidden(),
    address_id: p.integer().nullable().persist(false),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    trip: () => p.manyToOne(Trips).ref().nullable().hidden().index('idx_mail_ingest_messages_trip'),
    trip_id: p.integer().nullable().persist(false).index('idx_mail_ingest_messages_trip'),
    from_addr: p.text().nullable(),
    from_verified: p.integer().default(0),
    auth_results: p.text().nullable(),
    subject: p.text().nullable(),
    received_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    size: p.integer(),
    raw_eml_enc: p.text().nullable(),
    raw_purged_at: p.type(DbTimestampType).nullable(),
    status: p.text().default('queued'),
    reason: p.text().nullable(),
    hints: p.text().nullable(),
    attachments: p.text().nullable(),
    forwarding_code: p.text().nullable(),
    attempts: p.integer().default(0),
    next_attempt_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    lease_until: p.type(DbTimestampType).nullable(),
    ai_used: p.integer().default(0),
    processed_at: p.type(DbTimestampType).nullable(),
    mail_ingest_candidates_collection: () => p.oneToMany(MailIngestCandidates).mappedBy('message').hidden(),
  },
});
