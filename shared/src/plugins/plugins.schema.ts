import { z } from 'zod';

/**
 * Plugin settings contracts (#plugins).
 *
 * A plugin declares its settings fields in its manifest (validated at install,
 * stored in plugin_settings_fields); the server serves them back as form
 * metadata and both settings forms — the user Settings tab (`scope:'user'`)
 * and the admin instance-settings dialog (`scope:'instance'`) — render from
 * this ONE descriptor shape. Nullable-vs-optional is deliberate: the server
 * emits SQL NULLs for absent labels/placeholders/hints, and the forms branch
 * on them (`f.label || f.key`).
 *
 * Shared Zod pins SHAPE only. Which keys a plugin may store, secret
 * encryption, and the mask sentinel stay server-side (plugins.service.ts) —
 * the settled two-layer pattern.
 */
export const pluginSettingsFieldSchema = z.object({
  key: z.string(),
  label: z.string().nullish(),
  /** 'text' | 'number' | 'checkbox' | 'select' | … — server defaults absent to 'text'. */
  input_type: z.string().optional(),
  placeholder: z.string().nullish(),
  hint: z.string().nullish(),
  required: z.boolean().optional(),
  secret: z.boolean().optional(),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
export type PluginSettingsField = z.infer<typeof pluginSettingsFieldSchema>;

/** GET /api/admin/plugins/:id/config — the declared `scope:'instance'` fields
 * plus the stored values, secrets masked. */
export const pluginInstanceConfigResponseSchema = z.object({
  fields: z.array(pluginSettingsFieldSchema),
  config: z.record(z.string(), z.unknown()),
});
export type PluginInstanceConfigResponse = z.infer<typeof pluginInstanceConfigResponseSchema>;

/** PUT /api/admin/plugins/:id/config body — the config record itself. Loose on
 * purpose (journey-contract doctrine): the service drops undeclared keys and
 * keeps every decision it already makes, so the schema only refuses non-objects. */
export const pluginInstanceConfigUpdateSchema = z.record(z.string(), z.unknown());
export type PluginInstanceConfigUpdate = z.infer<typeof pluginInstanceConfigUpdateSchema>;

/** PUT /api/admin/plugins/:id/config response — the saved (masked) config, and
 * whether the save re-spawned a RUNNING plugin (its child reads config once, at init). */
export const pluginInstanceConfigUpdatedSchema = z.object({
  config: z.record(z.string(), z.unknown()),
  restarted: z.boolean(),
});
export type PluginInstanceConfigUpdated = z.infer<typeof pluginInstanceConfigUpdatedSchema>;
