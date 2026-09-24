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
  /** The field's effective value when nothing is stored: the form pre-fills it and the
   *  runtime resolves it, so the form shows what the plugin gets. Never on a secret field. */
  default: z.union([z.string(), z.number(), z.boolean()]).nullish(),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
export type PluginSettingsField = z.infer<typeof pluginSettingsFieldSchema>;

/**
 * A settings-form action button a plugin declared in its manifest (`actions`). Which
 * form renders it is the `scope`, exactly like a settings field: `'user'` on the user
 * Settings tab (runs as the clicking user), `'instance'` in the admin instance-settings
 * dialog (runs as the clicking admin). One action lives in exactly one form.
 */
export const pluginActionScopeSchema = z.enum(['user', 'instance']);
export type PluginActionScope = z.infer<typeof pluginActionScopeSchema>;

export const pluginActionDescriptorSchema = z.object({
  key: z.string(),
  label: z.string(),
  hint: z.string().optional(),
  danger: z.boolean(),
  scope: pluginActionScopeSchema,
});
export type PluginActionDescriptor = z.infer<typeof pluginActionDescriptorSchema>;

/** What an action answers, after the host bounded the plugin-supplied message. */
export const pluginActionResultSchema = z.object({
  ok: z.boolean(),
  message: z.string().optional(),
});
export type PluginActionResult = z.infer<typeof pluginActionResultSchema>;

/** GET /api/admin/plugins/:id/config — the declared `scope:'instance'` fields
 * plus the stored values, secrets masked, plus the `scope:'instance'` actions. */
export const pluginInstanceConfigResponseSchema = z.object({
  fields: z.array(pluginSettingsFieldSchema),
  config: z.record(z.string(), z.unknown()),
  actions: z.array(pluginActionDescriptorSchema),
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

/**
 * Body contracts for the admin plugin surfaces, written to DESCRIBE rather than
 * to tighten (the journey-contract doctrine, #1842).
 *
 * Every one of these handlers already owns its own rejection, and several of
 * them answer something other than 400 for a body they dislike: activate and
 * install answer 503 when plugins are disabled, and they check that BEFORE
 * looking at the body. A schema that rejected first would move a 503 to a 400
 * for an operator whose server has plugins off. So the fields stay optional and
 * the objects stay loose: the schema pins the wire TYPES, and the handler keeps
 * every decision it already made, in the order it already made it.
 */

/** POST /api/admin/plugins/install — `id is required` stays the handler's answer. */
export const pluginInstallRequestSchema = z.looseObject({
  id: z.string().optional(),
  version: z.string().optional(),
  constraint: z.string().optional(),
  withDependencies: z.boolean().optional(),
});
export type PluginInstallRequest = z.infer<typeof pluginInstallRequestSchema>;

/** POST /api/admin/plugins/link — `path is required` likewise, and dev-link answers 403 before reading it. */
export const pluginLinkRequestSchema = z.looseObject({ path: z.string().optional() });
export type PluginLinkRequest = z.infer<typeof pluginLinkRequestSchema>;

/** POST /api/admin/plugins/:id/activate */
export const pluginActivateRequestSchema = z.looseObject({ consent: z.boolean().optional() });
export type PluginActivateRequest = z.infer<typeof pluginActivateRequestSchema>;

/** POST /api/admin/plugins/:id/uninstall */
export const pluginUninstallRequestSchema = z.looseObject({ deleteData: z.boolean().optional() });
export type PluginUninstallRequest = z.infer<typeof pluginUninstallRequestSchema>;

/** POST /api/admin/plugins/:id/retrust */
export const pluginRetrustRequestSchema = z.looseObject({
  version: z.string().optional(),
  publicKey: z.string().optional(),
});
export type PluginRetrustRequest = z.infer<typeof pluginRetrustRequestSchema>;

/**
 * POST /api/admin/plugins/:id/update — `version` pins the exact version to
 * install (the rollback path). Omitted, the runtime resolves the newest
 * TREK-compatible version itself (the classic update).
 */
export const pluginUpdateRequestSchema = z.looseObject({ version: z.string().optional() });
export type PluginUpdateRequest = z.infer<typeof pluginUpdateRequestSchema>;

/**
 * PUT /api/admin/plugins/:id/egress-hosts — `hosts` is deliberately unknown,
 * not `string[]`.
 *
 * The handler reads `Array.isArray(body.hosts) ? body.hosts.map(String) : []`,
 * which means an omitted or non-array `hosts` CLEARS the operator egress list.
 * That is the documented way to reset it, so a schema demanding an array would
 * not tighten validation, it would remove a working admin action.
 */
export const pluginEgressHostsRequestSchema = z.looseObject({ hosts: z.unknown().optional() });
export type PluginEgressHostsRequest = z.infer<typeof pluginEgressHostsRequestSchema>;

/**
 * POST /api/plugin-settings/:id — `config` is unknown rather than a record: the
 * handler answers 200 with the stored config for anything it cannot use,
 * including a non-object, and a schema that rejected first would turn that
 * into a 400.
 */
export const pluginUserSettingsUpdateRequestSchema = z.looseObject({ config: z.unknown().optional() });
export type PluginUserSettingsUpdateRequest = z.infer<typeof pluginUserSettingsUpdateRequestSchema>;

/**
 * POST /api/plugins/:id/route — the route hook answers `{ route: null }` at 200
 * for every input it dislikes: a missing trip, a bad profile, unusable
 * waypoints, a slow provider. The client draws straight lines on a null and
 * shows nothing on a 400, so a schema that rejected a malformed body would turn
 * a graceful fallback into a visible error. Loose and fully optional on purpose.
 */
export const pluginRouteRequestSchema = z.looseObject({});
export type PluginRouteRequest = z.infer<typeof pluginRouteRequestSchema>;
