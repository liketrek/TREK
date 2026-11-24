/**
 * The schema a plugin's own data lives in on Postgres (`db:own`): one per
 * plugin, named from its id, beside TREK's schema in the same database.
 *
 * A plugin id is what the manifest allows (`PLUGIN_ID_RE` in
 * `nest/plugins/protocol/manifest-rules.ts`): a lowercase letter, then 2 to 39
 * lowercase letters, digits or dashes. The schema name is the prefix plus the
 * id with each dash spelled as an underscore. An id never holds an underscore,
 * so two ids never share a name, and the longest name (52 characters) stays
 * under Postgres's 63. The pattern is repeated here rather than imported,
 * because `src/db` does not import `src/nest`; a unit test holds the two equal.
 *
 * Every name TREK gives a plugin schema starts with the prefix, so a backup,
 * a restore and the plugin SQL guard can tell them from every other schema of
 * the database. Two TREK instances on one database would share these names,
 * so each instance needs a database of its own (the wiki says so).
 */

/** What every plugin schema's name starts with. */
export const PLUGIN_SCHEMA_PREFIX = 'trek_plugin_';

/** The plugin ids a schema name can be made from: the manifest's rule. */
const PLUGIN_ID = /^[a-z][a-z0-9-]{2,39}$/;

/** A plugin schema's name, as `pluginSchemaName` makes it. */
const PLUGIN_SCHEMA = /^trek_plugin_[a-z][a-z0-9_]{2,39}$/;

/** Whether `id` is a plugin id a schema name can be made from. */
export function isPluginId(id: string): boolean {
  return PLUGIN_ID.test(id);
}

/** The schema of the plugin `id`. Throws for anything the manifest would not accept as an id. */
export function pluginSchemaName(id: string): string {
  if (!isPluginId(id)) throw new Error(`"${id}" is not a plugin id, so it has no data schema.`);
  return PLUGIN_SCHEMA_PREFIX + id.replaceAll('-', '_');
}

/** Whether `name` is a schema name `pluginSchemaName` makes. */
export function isPluginSchemaName(name: string): boolean {
  return PLUGIN_SCHEMA.test(name);
}

/**
 * `name` as a quoted SQL identifier. Only plugin schema names reach it, which
 * hold no quote, so the quoting cannot be escaped; it is checked all the same.
 */
export function quotePluginSchema(name: string): string {
  if (!isPluginSchemaName(name)) throw new Error(`"${name}" is not a plugin schema name.`);
  return `"${name}"`;
}
