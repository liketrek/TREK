import { type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { PhotoProviders } from './PhotoProviders.entity';

export class PhotoProviderFields {
  id?: number | null;
  provider!: Ref<PhotoProviders>;
  fieldKey!: string;
  label!: string;
  inputType: string & Opt = 'text';
  placeholder?: string | null;
  hint?: string | null;
  required?: number | null = 0;
  secret?: number | null = 0;
  settingsKey?: string | null;
  payloadKey?: string | null;
  sortOrder?: number | null = 0;
}

export class PhotoProviderFieldsRepository extends EntityRepository<PhotoProviderFields> {}

export const PhotoProviderFieldsSchema = defineEntity({
  class: PhotoProviderFields,
  repository: () => PhotoProviderFieldsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    provider: () => p.manyToOne(PhotoProviders).ref().deleteRule('cascade'),
    fieldKey: p.text(),
    label: p.text(),
    inputType: p.text(),
    placeholder: p.text().nullable(),
    hint: p.text().nullable(),
    required: p.integer().nullable(),
    secret: p.integer().nullable(),
    settingsKey: p.text().nullable(),
    payloadKey: p.text().nullable(),
    sortOrder: p.integer().nullable(),
  },
});
