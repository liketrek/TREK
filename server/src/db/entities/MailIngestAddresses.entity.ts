import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { MailIngestAddressesRepository } from '../repositories/MailIngestAddresses.repository';
import { DbTimestampType } from '../types';
import { MailIngestMessages } from './MailIngestMessages.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class MailIngestAddresses {
  [EntityRepositoryType]?: MailIngestAddressesRepository;
  id!: number & Opt;
  token_hash!: string;
  token_enc!: string;
  user!: Ref<Users>;
  user_id!: number;
  trip?: Ref<Trips> | null;
  trip_id?: number | null;
  created_at!: string & Opt;
  revoked_at?: string | null;
  last_used_at?: string | null;
  mail_ingest_messages_collection = new Collection<MailIngestMessages>(this);
}

export const MailIngestAddressesSchema = defineEntity({
  class: MailIngestAddresses,
  repository: () => MailIngestAddressesRepository,
  indexes: [
    {
      name: 'idx_mail_ingest_addresses_user',
      properties: ['user_id', 'trip_id'],
    },
  ],
  uniques: [{ properties: ['token_hash'] }],
  properties: {
    id: p.integer().primary(),
    token_hash: p.text(),
    token_enc: p.text(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').nullable().hidden().index('idx_mail_ingest_addresses_trip'),
    trip_id: p.integer().nullable().persist(false).index('idx_mail_ingest_addresses_trip'),
    created_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    revoked_at: p.type(DbTimestampType).nullable(),
    last_used_at: p.type(DbTimestampType).nullable(),
    mail_ingest_messages_collection: () => p.oneToMany(MailIngestMessages).mappedBy('address').hidden(),
  },
});
