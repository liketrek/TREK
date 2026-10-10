import type { PluginSettingsFields } from '../entities/PluginSettingsFields.entity';
import { TrekRepository } from './_shared/trek-repository';

/** PR#499 — `notificationChannels`' secret-user-field scan, across ALL plugins. */
export interface PluginSecretFieldRow {
  plugin_id: string;
  field_key: string;
}

/** `plugins.service.ts#settingsFields`'s own full projection (mapped to `PluginSettingsField` in the service, which also resolves `default`/`options`). */
export interface PluginSettingsFieldRow {
  field_key: string;
  label: string | null;
  input_type: string;
  placeholder: string | null;
  hint: string | null;
  required: number;
  secret: number;
  options: string | null;
  default_value: string | null;
}

export class PluginSettingsFieldsRepository extends TrekRepository<PluginSettingsFields> {
  /** `notificationChannels`'s GDPR-export fold — `SELECT plugin_id, field_key FROM plugin_settings_fields WHERE scope = 'user' AND secret = 1`, across every plugin (no `plugin_id` filter — the caller groups by `plugin_id` itself). */
  async listSecretUserFields(): Promise<PluginSecretFieldRow[]> {
    return await this.find({ scope: 'user', secret: 1 }, { fields: ['plugin_id', 'field_key'] });
  }

  /** PS2 (`plugins.service.ts#instanceSettingsCount`) — `SELECT COUNT(*) AS n FROM plugin_settings_fields WHERE plugin_id = ? AND scope = 'instance'`. Caller wraps this in its own try/catch → 0. */
  async countForPluginScope(pluginId: string, scope: 'instance' | 'user'): Promise<number> {
    return await this.count({ plugin_id: pluginId, scope });
  }

  /**
   * `updateInstanceConfig`'s secret-key set / `getInstanceConfig`'s secret-key set /
   * `updateUserConfig`/`getUserConfig`'s `userSecretKeys` — `SELECT field_key FROM
   * plugin_settings_fields WHERE plugin_id = ? AND scope = ? AND secret = 1` (identical
   * text shape across both scopes; ONE method for all four call sites).
   */
  async listSecretFieldKeys(pluginId: string, scope: 'instance' | 'user'): Promise<string[]> {
    const rows = await this.find({ plugin_id: pluginId, scope, secret: 1 }, { fields: ['field_key'] });
    return rows.map((r) => r.field_key);
  }

  /**
   * `updateInstanceConfig`'s allowed-key set / `updateUserConfig`'s allowed-key set —
   * `SELECT field_key FROM plugin_settings_fields WHERE plugin_id = ? AND scope = ?`
   * (identical text shape across both scopes; ONE method for both call sites).
   */
  async listFieldKeys(pluginId: string, scope: 'instance' | 'user'): Promise<string[]> {
    const rows = await this.find({ plugin_id: pluginId, scope }, { fields: ['field_key'] });
    return rows.map((r) => r.field_key);
  }

  /**
   * `plugins.service.ts#settingsFields` (backs `userSettingsFields`/`instanceSettingsFields`) —
   * `SELECT field_key AS key, label, input_type, placeholder, hint, required, secret,
   * options, default_value FROM plugin_settings_fields WHERE plugin_id = ? AND scope = ?
   * ORDER BY sort_order, id`.
   */
  async listFields(pluginId: string, scope: 'instance' | 'user'): Promise<PluginSettingsFieldRow[]> {
    const rows = await this.find(
      { plugin_id: pluginId, scope },
      {
        fields: [
          'field_key',
          'label',
          'input_type',
          'placeholder',
          'hint',
          'required',
          'secret',
          'options',
          'default_value',
        ],
        orderBy: [{ sort_order: 'asc' }, { id: 'asc' }],
      },
    );
    return rows.map((r) => ({
      field_key: r.field_key,
      label: r.label ?? null,
      input_type: r.input_type,
      placeholder: r.placeholder ?? null,
      hint: r.hint ?? null,
      required: r.required,
      secret: r.secret,
      options: r.options ?? null,
      default_value: r.default_value ?? null,
    }));
  }

  /** `assertRequiredFilled` — `SELECT field_key FROM plugin_settings_fields WHERE plugin_id = ? AND scope = ? AND required = 1 AND input_type != 'checkbox'`. */
  async listRequiredFieldKeys(pluginId: string, scope: 'instance' | 'user'): Promise<string[]> {
    const rows = await this.find(
      { plugin_id: pluginId, scope, required: 1, input_type: { $ne: 'checkbox' } },
      { fields: ['field_key'] },
    );
    return rows.map((r) => r.field_key);
  }

  /** PR34 (uninstall cascade) — `DELETE FROM plugin_settings_fields WHERE plugin_id = ?`. Unlike several of its cascade siblings, this one is NOT wrapped in try/catch by the caller — a slimmed test schema is expected to have this table. */
  async deleteAllForPlugin(pluginId: string): Promise<void> {
    await this.nativeDelete({ plugin_id: pluginId });
  }

  /**
   * PU1 (Plan 3j Task 4, `plugin-user-settings.service.ts#readOne`) — `SELECT
   * secret FROM plugin_settings_fields WHERE plugin_id = ? AND field_key = ? AND
   * scope = 'user'`, as a boolean secret flag deciding whether `readOne` decrypts
   * the stored value.
   */
  async isUserFieldSecret(pluginId: string, fieldKey: string): Promise<boolean> {
    const row = await this.findOne({ plugin_id: pluginId, field_key: fieldKey, scope: 'user' }, { fields: ['secret'] });
    return row?.secret === 1;
  }

  /**
   * `plugin-user-settings.service.ts#readAll` (Plan 3j Task 4) — `SELECT
   * field_key, secret FROM plugin_settings_fields WHERE plugin_id = ? AND scope =
   * ?` (`scope` is always `'user'` at this call site; kept as a parameter to match
   * this repository's own established convention on every other `scope`-taking
   * method here).
   */
  async listFieldKeysWithSecretFlag(
    pluginId: string,
    scope: 'instance' | 'user',
  ): Promise<Array<{ field_key: string; secret: number }>> {
    const rows = await this.find({ plugin_id: pluginId, scope }, { fields: ['field_key', 'secret'] });
    return rows.map((r) => ({ field_key: r.field_key, secret: r.secret }));
  }

  /**
   * DI8 (Plan 3j Task 3, `install/discovery.ts#upsert`) — `` INSERT INTO
   * plugin_settings_fields (plugin_id, field_key, label, input_type, placeholder, hint,
   * required, secret, scope, options, oauth_config, default_value, sort_order) VALUES
   * (?,?,?,?,?,?,?,?,?,?,?,?,?) ``, looped once per manifest settings field, paired with
   * DI7's `deleteAllForPlugin` above (the same delete-then-reinsert re-declare sequence).
   * `insertMany`, one batched native insert — same rows the legacy per-row `.run()` loop
   * produced. A no-op on an empty manifest `settings[]`.
   */
  async insertFields(pluginId: string, fields: NewPluginSettingsFieldRow[]): Promise<void> {
    if (!fields.length) return;
    await this.insertMany(
      fields.map((f) => ({
        plugin_id: pluginId,
        field_key: f.field_key,
        label: f.label,
        input_type: f.input_type,
        placeholder: f.placeholder,
        hint: f.hint,
        required: f.required,
        secret: f.secret,
        scope: f.scope,
        options: f.options,
        oauth_config: f.oauth_config,
        default_value: f.default_value,
        sort_order: f.sort_order,
      })),
    );
  }

  /**
   * SD1 (Plan 3j Task 3, `settings-defaults.ts#settingDefaults`) — `SELECT field_key,
   * default_value FROM plugin_settings_fields WHERE plugin_id = ? AND scope = ? AND
   * secret = 0 AND default_value IS NOT NULL`. Secrets never carry a default (the
   * manifest parse drops it before it ever reaches a row) — the `secret = 0` filter is
   * belt-and-braces, kept exactly as the legacy statement had it.
   */
  async listDefaults(
    pluginId: string,
    scope: 'instance' | 'user',
  ): Promise<Array<{ field_key: string; default_value: string }>> {
    const rows = await this.find(
      { plugin_id: pluginId, scope, secret: 0, default_value: { $ne: null } },
      { fields: ['field_key', 'default_value'] },
    );
    return rows.map((r) => ({ field_key: r.field_key, default_value: r.default_value ?? '' }));
  }
}

/** DI8's own row shape — `discoverPlugins#upsert`'s per-manifest-settings-field insert. */
export interface NewPluginSettingsFieldRow {
  field_key: string;
  label: string | null;
  input_type: string;
  placeholder: string | null;
  hint: string | null;
  required: number;
  secret: number;
  scope: string;
  options: string | null;
  oauth_config: string | null;
  default_value: string | null;
  sort_order: number;
}
