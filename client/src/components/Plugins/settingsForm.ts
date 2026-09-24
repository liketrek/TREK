/**
 * Shared rules for the plugin-settings forms — the admin instance form
 * (useInstanceSettings), the desktop user tab (PluginSettingsTab) and the mobile user
 * screen (MSettingsPlugins) all render the same `fields` + `config` contract and used to
 * each hand-copy these loops, which is how the mobile screen missed `default` and the
 * required check.
 */
import type { PluginUserSettingField } from '../../api/client';

/** What the server echoes in place of a stored secret; sending it back means "unchanged". */
export const SECRET_MASK = '••••••••';

export type SettingsValues = Record<string, string | boolean>;

/**
 * Form draft from the stored config, falling back to each field's manifest `default`
 * when nothing is stored (the same `stored ?? default` rule the runtime applies, so the
 * form shows the value the plugin actually gets). Checkboxes become booleans, everything
 * else a string.
 */
export function seedSettingsValues(fields: PluginUserSettingField[], config: Record<string, unknown>): SettingsValues {
  const values: SettingsValues = {};
  for (const f of fields) {
    const stored = config[f.key];
    const seeded = stored === undefined || stored === null ? f.default : stored;
    values[f.key] = f.input_type === 'checkbox' ? seeded === true : seeded == null ? '' : String(seeded);
  }
  return values;
}

/**
 * The first `required` field the draft leaves blank, or undefined when Save may proceed.
 * Mirrors the server gate: a checkbox is exempt (required would mean "must be true", a
 * consent flow, not a setting), whitespace is blank, an untouched secret (still the mask)
 * is filled.
 */
export function findMissingRequired(
  fields: PluginUserSettingField[],
  values: SettingsValues
): PluginUserSettingField | undefined {
  return fields.find((f) => {
    if (!f.required || f.input_type === 'checkbox') return false;
    const v = values[f.key];
    if (f.secret && v === SECRET_MASK) return false;
    return String(v ?? '').trim() === '';
  });
}

/** The save body: every field's draft value, minus an untouched secret so the mask never overwrites the stored ciphertext. */
export function settingsPatch(fields: PluginUserSettingField[], values: SettingsValues): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values[f.key];
    if (f.secret && v === SECRET_MASK) continue;
    patch[f.key] = v;
  }
  return patch;
}
