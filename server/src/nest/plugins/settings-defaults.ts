import type { PluginSettingsFieldsRepository } from '../../db/repositories/PluginSettingsFields.repository';

/** What a settings-field `default` may be — the JSON scalars the manifest accepts. */
export type SettingDefault = string | number | boolean;

/**
 * Manifest settings-field defaults (#plugins).
 *
 * A field's `default` is stored JSON-encoded in `plugin_settings_fields.default_value`
 * (so string/number/boolean round-trip) and is meant to be the field's EFFECTIVE value
 * wherever nothing was stored: the settings form pre-fills it, and — the part that makes
 * it more than a form hint — the runtime resolves it too, so a plugin that ships a
 * sensible default works before anyone opens the form. Every read that hands config to a
 * plugin (the child's init envelope, `ctx.settings.get()`, the channel dispatch's readAll,
 * the OAuth broker's provider config) folds these in through here, and the `required`
 * check counts them as filled for the same reason: refusing a save the runtime would have
 * accepted is a contradiction.
 *
 * Secrets never carry a default (the manifest is public; parse drops it), so a secret is
 * never resolved from here even if a row somehow had one.
 */
export function parseDefaultValue(raw: unknown): SettingDefault | undefined {
  if (typeof raw !== 'string' || raw === '') return undefined;
  try {
    const v = JSON.parse(raw) as unknown;
    return typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? v : undefined;
  } catch {
    return undefined;
  }
}

/** The declared defaults for one plugin and scope, keyed by field. Null-prototype so a
 *  field key can never resolve off Object.prototype (see plugin-config-parse.ts). */
export async function settingDefaults(
  settingsFields: PluginSettingsFieldsRepository,
  pluginId: string,
  scope: 'instance' | 'user',
): Promise<Record<string, SettingDefault>> {
  const rows = await settingsFields.listDefaults(pluginId, scope);
  const out: Record<string, SettingDefault> = Object.create(null);
  for (const r of rows) {
    const v = parseDefaultValue(r.default_value);
    if (v !== undefined) out[r.field_key] = v;
  }
  return out;
}

/** `stored ?? default` per field, on a copy: a stored value (even `''`/`false`) always wins,
 *  only an ABSENT one (undefined/null) falls back. Same rule the settings form applies. */
export function applySettingDefaults(
  config: Record<string, unknown>,
  defaults: Record<string, SettingDefault>,
): Record<string, unknown> {
  const out: Record<string, unknown> = Object.create(null);
  for (const [k, v] of Object.entries(config)) out[k] = v;
  for (const [k, v] of Object.entries(defaults)) if (out[k] == null) out[k] = v;
  return out;
}

/**
 * The one definition of "a required setting is filled": present and not blank. Shared by
 * the save gate (PluginsService.assertRequiredFilled) and the dispatch check
 * (PluginUserSettingsService.hasRequired) so a save the form accepted can never leave a
 * user "not configured", or the reverse.
 */
export function isFilled(value: unknown): boolean {
  return value != null && String(value).trim() !== '';
}
