import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { DocumentProviderFieldsRepository } from '../repositories/DocumentProviderFields.repository';
import { DocumentProviders } from './DocumentProviders.entity';

export class DocumentProviderFields {
  [EntityRepositoryType]?: DocumentProviderFieldsRepository;
  id!: number & Opt;
  provider!: Ref<DocumentProviders>;
  provider_id!: string;
  field_key!: string;
  label!: string;
  input_type: string & Opt = 'text';
  placeholder?: string | null;
  hint?: string | null;
  required?: number | null = 0;
  secret?: number | null = 0;
  sort_order?: number | null = 0;
}

export const DocumentProviderFieldsSchema = defineEntity({
  class: DocumentProviderFields,
  repository: () => DocumentProviderFieldsRepository,
  uniques: [{ properties: ['provider', 'field_key'] }],
  properties: {
    id: p.integer().primary(),
    provider: () => p.manyToOne(DocumentProviders).ref().deleteRule('cascade').hidden(),
    provider_id: p.text().persist(false),
    field_key: p.text(),
    label: p.text(),
    input_type: p.text().default('text'),
    placeholder: p.text().nullable(),
    hint: p.text().nullable(),
    required: p.integer().nullable(),
    secret: p.integer().nullable(),
    sort_order: p.integer().nullable(),
  },
});
