import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { DocumentConnectionsRepository } from '../repositories/DocumentConnections.repository';
import { DbTimestampType } from '../types';
import { DocumentProviders } from './DocumentProviders.entity';
import { TripDocumentLinks } from './TripDocumentLinks.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class DocumentConnections {
  [EntityRepositoryType]?: DocumentConnectionsRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  provider!: Ref<DocumentProviders>;
  provider_id!: string;
  ownerUser!: Ref<Users>;
  owner_user_id!: number;
  base_url!: string;
  secrets?: string | null;
  settings: string & Opt = '{}';
  allow_insecure_tls: number & Opt = 0;
  capabilities?: string | null;
  last_probe_at?: string | null;
  last_probe_state: string & Opt = 'never';
  last_probe_error?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  trip_document_links_collection = new Collection<TripDocumentLinks>(this);
}

export const DocumentConnectionsSchema = defineEntity({
  class: DocumentConnections,
  repository: () => DocumentConnectionsRepository,
  uniques: [{ properties: ['trip', 'provider'] }],
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden().index('idx_document_connections_trip'),
    trip_id: p.integer().persist(false).index('idx_document_connections_trip'),
    provider: () => p.manyToOne(DocumentProviders).ref().deleteRule('cascade').hidden(),
    provider_id: p.text().persist(false),
    ownerUser: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_document_connections_owner'),
    owner_user_id: p.integer().persist(false).index('idx_document_connections_owner'),
    base_url: p.text(),
    secrets: p.text().nullable(),
    settings: p.text().default('{}'),
    allow_insecure_tls: p.integer().default(0),
    capabilities: p.text().nullable(),
    last_probe_at: p.text().nullable(),
    last_probe_state: p.text().default('never'),
    last_probe_error: p.text().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    updated_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    trip_document_links_collection: () => p.oneToMany(TripDocumentLinks).mappedBy('connection').hidden(),
  },
});
