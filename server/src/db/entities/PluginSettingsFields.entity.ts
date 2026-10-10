import { EntityRepositoryType, type Opt, defineEntity, p } from '@mikro-orm/core';
import { PluginSettingsFieldsRepository } from '../repositories/PluginSettingsFields.repository';

export class PluginSettingsFields {
  [EntityRepositoryType]?: PluginSettingsFieldsRepository;
  id!: number & Opt;
  plugin_id!: string;
  field_key!: string;
  label?: string | null;
  input_type: string & Opt = 'text';
  placeholder?: string | null;
  hint?: string | null;
  required: number & Opt = 0;
  secret: number & Opt = 0;
  scope: string & Opt = 'instance';
  options?: string | null;
  oauth_config?: string | null;
  sort_order: number & Opt = 0;
  default_value?: string | null;
}

export const PluginSettingsFieldsSchema = defineEntity({
  class: PluginSettingsFields,
  repository: () => PluginSettingsFieldsRepository,
  uniques: [{ properties: ['plugin_id', 'field_key'] }],
  properties: {
    id: p.integer().primary(),
    plugin_id: p.text(),
    field_key: p.text(),
    label: p.text().nullable(),
    input_type: p.text().default('text'),
    placeholder: p.text().nullable(),
    hint: p.text().nullable(),
    required: p.integer().default(0),
    secret: p.integer().default(0),
    scope: p.text().default('instance'),
    options: p.text().nullable(),
    oauth_config: p.text().nullable(),
    sort_order: p.integer().default(0),
    default_value: p.text().nullable(),
  },
});
