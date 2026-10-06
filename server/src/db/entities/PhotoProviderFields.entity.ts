import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { PhotoProviderFieldsRepository } from '../repositories/PhotoProviderFields.repository';
import { PhotoProviders } from './PhotoProviders.entity';

export class PhotoProviderFields {
  [EntityRepositoryType]?: PhotoProviderFieldsRepository;
  id!: number & Opt;
  provider!: Ref<PhotoProviders>;
  provider_id!: string;
  field_key!: string;
  label!: string;
  input_type: string & Opt = 'text';
  placeholder?: string | null;
  hint?: string | null;
  required?: number | null = 0;
  secret?: number | null = 0;
  settings_key?: string | null;
  payload_key?: string | null;
  sort_order?: number | null = 0;
}

export const PhotoProviderFieldsSchema = defineEntity({
  class: PhotoProviderFields,
  repository: () => PhotoProviderFieldsRepository,
  uniques: [{ properties: ['provider', 'field_key'] }],
  properties: {
    id: p.integer().primary(),
    provider: () => p.manyToOne(PhotoProviders).ref().deleteRule('cascade').hidden(),
    provider_id: p.text().persist(false),
    field_key: p.text(),
    label: p.text(),
    input_type: p.text().default('text'),
    placeholder: p.text().nullable(),
    hint: p.text().nullable(),
    required: p.integer().nullable(),
    secret: p.integer().nullable(),
    settings_key: p.text().nullable(),
    payload_key: p.text().nullable(),
    sort_order: p.integer().nullable(),
  },
});
