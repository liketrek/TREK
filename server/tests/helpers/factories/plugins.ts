import { PluginSettingsFields } from '../../../src/db/entities/PluginSettingsFields.entity';
import { PluginUserConfig } from '../../../src/db/entities/PluginUserConfig.entity';
import { Plugins } from '../../../src/db/entities/Plugins.entity';
import { dbNow } from '../../../src/db/types/db-timestamp.type';
import type { FactoryOrm } from './context';
import { createRow, findRow, insertRow, upsertRow } from './rows';
import type { EntityData, EntityDTO } from '@mikro-orm/core';

export type PluginRow = EntityDTO<Plugins>;

/**
 * An installed plugin row, inactive and disabled unless told otherwise. Only
 * the row: no child process is spawned, which is what a test of the admin or
 * settings surface wants.
 */
export async function makePlugin(orm: FactoryOrm, id: string, overrides: EntityData<Plugins> = {}): Promise<PluginRow> {
  await insertRow(orm, Plugins, { id, name: id, version: '1.0.0', ...overrides });
  const plugin = await findRow(orm, Plugins, { id });
  if (!plugin) throw new Error(`makePlugin: no plugin ${id} after its insert`);
  return plugin;
}

/** One settings field the plugin declares: instance-scoped text unless told otherwise. */
export function makePluginSettingsField(
  orm: FactoryOrm,
  pluginId: string,
  fieldKey: string,
  overrides: EntityData<PluginSettingsFields> = {},
): Promise<EntityDTO<PluginSettingsFields>> {
  return createRow(orm, PluginSettingsFields, {
    plugin_id: pluginId,
    field_key: fieldKey,
    label: fieldKey,
    ...overrides,
  });
}

/** Stores the user's config for the plugin as JSON, replacing any earlier one. */
export async function setPluginUserConfig(
  orm: FactoryOrm,
  pluginId: string,
  userId: number,
  config: Record<string, unknown>,
): Promise<void> {
  await upsertRow(orm, PluginUserConfig, {
    plugin_id: pluginId,
    user_id: userId,
    config: JSON.stringify(config),
    updated_at: dbNow(),
  });
}
