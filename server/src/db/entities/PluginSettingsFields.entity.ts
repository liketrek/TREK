import { type Opt, defineEntity, p, EntityRepository } from '@mikro-orm/core';

export class PluginSettingsFields {
  id?: number | null;
  pluginId!: string;
  fieldKey!: string;
  label?: string | null;
  inputType: string & Opt = 'text';
  placeholder?: string | null;
  hint?: string | null;
  required: number & Opt = 0;
  secret: number & Opt = 0;
  scope: string & Opt = 'instance';
  options?: string | null;
  oauthConfig?: string | null;
  sortOrder: number & Opt = 0;
  defaultValue?: string | null;
}

export class PluginSettingsFieldsRepository extends EntityRepository<PluginSettingsFields> {}

export const PluginSettingsFieldsSchema = defineEntity({
  class: PluginSettingsFields,
  repository: () => PluginSettingsFieldsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    pluginId: p.text(),
    fieldKey: p.text(),
    label: p.text().nullable(),
    inputType: p.text(),
    placeholder: p.text().nullable(),
    hint: p.text().nullable(),
    required: p.integer(),
    secret: p.integer(),
    scope: p.text(),
    options: p.text().nullable(),
    oauthConfig: p.text().nullable(),
    sortOrder: p.integer(),
    defaultValue: p.text().nullable(),
  },
});
