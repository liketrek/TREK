import { Collection, EntityRepositoryType, defineEntity, p } from '@mikro-orm/core';
import { DocumentProvidersRepository } from '../repositories/DocumentProviders.repository';
import { DocumentConnections } from './DocumentConnections.entity';
import { DocumentProviderFields } from './DocumentProviderFields.entity';

export class DocumentProviders {
  [EntityRepositoryType]?: DocumentProvidersRepository;
  id?: string | null;
  name!: string;
  description?: string | null;
  icon?: string | null = 'FileText';
  enabled?: number | null = 0;
  sort_order?: number | null = 0;
  document_connections_collection = new Collection<DocumentConnections>(this);
  document_provider_fields_collection = new Collection<DocumentProviderFields>(this);
}

export const DocumentProvidersSchema = defineEntity({
  class: DocumentProviders,
  repository: () => DocumentProvidersRepository,
  properties: {
    id: p.text().primary().nullable(),
    name: p.text(),
    description: p.text().nullable(),
    icon: p.text().nullable(),
    enabled: p.integer().nullable(),
    sort_order: p.integer().nullable(),
    document_connections_collection: () => p.oneToMany(DocumentConnections).mappedBy('provider').hidden(),
    document_provider_fields_collection: () => p.oneToMany(DocumentProviderFields).mappedBy('provider').hidden(),
  },
});
