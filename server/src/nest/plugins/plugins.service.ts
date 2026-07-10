import { Injectable } from '@nestjs/common';
import { db } from '../../db/database';
import { pluginsEnabled } from './kill-switch';
import { devLinkEnabled } from './dev-link';
import { maybe_encrypt_api_key, decrypt_api_key } from '../../services/apiKeyCrypto';
import { readAudit } from './host/plugin-audit';
import { pluginBudgetUsage } from './host/create-rpc-host';
import { isAddonEnabled } from '../../services/adminService';
import { parseDependencies, disabledRequiredAddons, resolveDependencyState, type PluginDepRow, type PluginDependencies, type VersionMismatch } from './dependencies';
import type { PluginDependency } from './install/manifest';

const SECRET_MASK = '••••••••';

export type PluginDependencyStatus = 'ok' | 'addonDisabled' | 'missingPlugin';

/**
 * Read side of the plugin system (#plugins), M0 scaffold. Lists installed
 * plugins from the `plugins` registry table and reports whether the runtime is
 * enabled (TREK_PLUGINS_ENABLED). No execution here — the isolated runtime,
 * install pipeline and registry fetch land in later milestones.
 */

interface PluginRawRow {
  id: string;
  name: string;
  description: string | null;
  type: string;
  icon: string | null;
  version: string | null;
  status: string;
  enabled: number;
  last_error: string | null;
  reviewed_at: string | null;
  source_repo: string | null;
  permissions: string;
  capabilities: string;
  dependencies: string | null;
}

export interface PluginListItem {
  id: string;
  name: string;
  description: string | null;
  type: string;
  icon: string | null;
  version: string | null;
  status: string;
  enabled: number;
  last_error: string | null;
  reviewed_at: string | null;
  source_repo: string | null;
  /** Declared permissions (JSON string) — drives the "what this can access" chips. */
  permissions: string;
  /** Declared capabilities (JSON string) — e.g. widget slot. */
  capabilities: string;
  /** Declared dependencies (parsed) — required addons + plugin deps. */
  dependencies: PluginDependencies;
  /** Whether this plugin can currently activate, and why not if it can't. */
  dependencyStatus: PluginDependencyStatus;
  /** The concrete blockers, so the UI can render chips + the resolve dialog. */
  dependencyIssues: { disabledAddons: string[]; missing: PluginDependency[]; versionMismatch: VersionMismatch[] };
}

@Injectable()
export class PluginsService {
  list(): { enabled: boolean; devLink: boolean; plugins: PluginListItem[] } {
    const rows = db
      .prepare(
        `SELECT id, name, description, type, icon, version, status, enabled, last_error, reviewed_at, source_repo,
                permissions, capabilities, dependencies
         FROM plugins
         ORDER BY sort_order, name`,
      )
      .all() as PluginRawRow[];
    const installed = new Map<string, PluginDepRow>(
      rows.map((r) => [r.id, { id: r.id, version: r.version, enabled: r.enabled, dependencies: r.dependencies }]),
    );
    const plugins: PluginListItem[] = rows.map((r) => {
      const deps = parseDependencies(r.dependencies);
      const disabledAddons = disabledRequiredAddons(deps, isAddonEnabled);
      const state = resolveDependencyState(deps, installed);
      const dependencyStatus: PluginDependencyStatus = disabledAddons.length
        ? 'addonDisabled'
        : state.missing.length || state.versionMismatch.length
          ? 'missingPlugin'
          : 'ok';
      const { dependencies: _raw, ...rest } = r;
      return {
        ...rest,
        dependencies: deps,
        dependencyStatus,
        dependencyIssues: { disabledAddons, missing: state.missing, versionMismatch: state.versionMismatch },
      };
    });
    return { enabled: pluginsEnabled(), devLink: devLinkEnabled(), plugins };
  }

  /**
   * Merge instance-scope settings into the plugin's config, encrypting fields
   * declared secret (unless the value is the unchanged mask sentinel). Returns
   * the config with secrets masked for the client.
   */
  updateInstanceConfig(id: string, patch: Record<string, unknown>): Record<string, unknown> {
    const row = db.prepare('SELECT config FROM plugins WHERE id = ?').get(id) as { config: string } | undefined;
    if (!row) throw new Error(`plugin ${id} not found`);

    const secretKeys = new Set(
      (
        db
          .prepare("SELECT field_key FROM plugin_settings_fields WHERE plugin_id = ? AND scope = 'instance' AND secret = 1")
          .all(id) as Array<{ field_key: string }>
      ).map((r) => r.field_key),
    );

    const config = safeParse(row.config);
    for (const [k, v] of Object.entries(patch)) {
      if (secretKeys.has(k)) {
        if (v === SECRET_MASK) continue; // unchanged secret — keep stored ciphertext
        config[k] = maybe_encrypt_api_key(v);
      } else {
        config[k] = v;
      }
    }
    db.prepare('UPDATE plugins SET config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(JSON.stringify(config), id);
    return maskSecrets(config, secretKeys);
  }

  /** The plugin's `scope:'user'` settings fields, in declared order (for the user form). */
  userSettingsFields(id: string): Array<Record<string, unknown>> {
    return db
      .prepare(
        `SELECT field_key AS key, label, input_type, placeholder, hint, required, secret, options
         FROM plugin_settings_fields WHERE plugin_id = ? AND scope = 'user' ORDER BY sort_order, id`,
      )
      .all(id)
      .map((r) => {
        const row = r as Record<string, unknown>;
        return {
          key: row.key,
          label: row.label ?? null,
          input_type: row.input_type ?? 'text',
          placeholder: row.placeholder ?? null,
          hint: row.hint ?? null,
          required: row.required === 1,
          secret: row.secret === 1,
          options: typeof row.options === 'string' && row.options ? safeArray(row.options as string) : undefined,
        };
      });
  }

  private userSecretKeys(id: string): Set<string> {
    return new Set(
      (
        db
          .prepare("SELECT field_key FROM plugin_settings_fields WHERE plugin_id = ? AND scope = 'user' AND secret = 1")
          .all(id) as Array<{ field_key: string }>
      ).map((r) => r.field_key),
    );
  }

  /** A user's own config for a plugin, secrets masked (safe to send to the client). */
  getUserConfig(id: string, userId: number): Record<string, unknown> {
    const row = db.prepare('SELECT config FROM plugin_user_config WHERE plugin_id = ? AND user_id = ?').get(id, userId) as
      | { config: string }
      | undefined;
    return maskSecrets(safeParse(row?.config ?? '{}'), this.userSecretKeys(id));
  }

  /** Merge a user's own settings, encrypting secret fields (SECRET_MASK = keep stored
   * ciphertext). Only keys declared as `scope:'user'` fields are accepted. Returns masked. */
  updateUserConfig(id: string, userId: number, patch: Record<string, unknown>): Record<string, unknown> {
    const allowed = new Set(
      (db.prepare("SELECT field_key FROM plugin_settings_fields WHERE plugin_id = ? AND scope = 'user'").all(id) as Array<{ field_key: string }>).map(
        (r) => r.field_key,
      ),
    );
    const secretKeys = this.userSecretKeys(id);
    const existing = db.prepare('SELECT config FROM plugin_user_config WHERE plugin_id = ? AND user_id = ?').get(id, userId) as
      | { config: string }
      | undefined;
    const config = safeParse(existing?.config ?? '{}');
    for (const [k, v] of Object.entries(patch)) {
      if (!allowed.has(k)) continue; // never store an undeclared key
      if (secretKeys.has(k)) {
        if (v === SECRET_MASK) continue; // unchanged secret — keep stored ciphertext
        config[k] = maybe_encrypt_api_key(v);
      } else {
        config[k] = v;
      }
    }
    db.prepare(
      `INSERT INTO plugin_user_config (plugin_id, user_id, config, updated_at) VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(plugin_id, user_id) DO UPDATE SET config = excluded.config, updated_at = excluded.updated_at`,
    ).run(id, userId, JSON.stringify(config));
    return maskSecrets(config, secretKeys);
  }

  /** A user's own config with secrets DECRYPTED — host-only, for runtime `ctx.settings`.
   * Never sent to a client; the acting user is resolved host-side. */
  getUserConfigDecrypted(id: string, userId: number): Record<string, unknown> {
    const row = db.prepare('SELECT config FROM plugin_user_config WHERE plugin_id = ? AND user_id = ?').get(id, userId) as
      | { config: string }
      | undefined;
    const config = safeParse(row?.config ?? '{}');
    const secretKeys = this.userSecretKeys(id);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(config)) out[k] = secretKeys.has(k) && v ? decrypt_api_key(v) : v;
    return out;
  }

  /** A plugin's error log, newest first. */
  errors(id: string): Array<{ ts: string; level: string; message: string }> {
    return db
      .prepare('SELECT ts, level, message FROM plugin_error_log WHERE plugin_id = ? ORDER BY ts DESC, id DESC LIMIT 200')
      .all(id) as Array<{ ts: string; level: string; message: string }>;
  }

  clearErrors(id: string): void {
    db.prepare('DELETE FROM plugin_error_log WHERE plugin_id = ?').run(id);
  }

  /** A plugin's hash-chained capability audit log, newest first. */
  auditLog(id: string): unknown[] {
    return readAudit(db, id);
  }

  /** A plugin's broker budget usage for today (AI + notification counts vs caps). */
  budget(id: string): ReturnType<typeof pluginBudgetUsage> {
    return pluginBudgetUsage(id);
  }

  /** Read the instance config with secret fields masked. */
  getInstanceConfig(id: string): Record<string, unknown> {
    const row = db.prepare('SELECT config FROM plugins WHERE id = ?').get(id) as { config: string } | undefined;
    if (!row) throw new Error(`plugin ${id} not found`);
    const secretKeys = new Set(
      (
        db
          .prepare("SELECT field_key FROM plugin_settings_fields WHERE plugin_id = ? AND scope = 'instance' AND secret = 1")
          .all(id) as Array<{ field_key: string }>
      ).map((r) => r.field_key),
    );
    return maskSecrets(safeParse(row.config), secretKeys);
  }
}

function safeParse(json: string): Record<string, unknown> {
  try {
    const v = JSON.parse(json || '{}');
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
function safeArray(json: string): unknown[] | undefined {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

/** Host-only: one decrypted per-user setting for a plugin (for runtime `ctx.settings`).
 * Standalone (no Nest DI) so the RPC host wiring can call it directly. */
export function readUserSettingDecrypted(pluginId: string, userId: number, key: string): unknown {
  const isSecret =
    (db.prepare("SELECT secret FROM plugin_settings_fields WHERE plugin_id = ? AND field_key = ? AND scope = 'user'").get(pluginId, key) as
      | { secret: number }
      | undefined)?.secret === 1;
  const row = db.prepare('SELECT config FROM plugin_user_config WHERE plugin_id = ? AND user_id = ?').get(pluginId, userId) as
    | { config: string }
    | undefined;
  const v = safeParse(row?.config ?? '{}')[key];
  if (v == null) return undefined;
  return isSecret ? decrypt_api_key(v) : v;
}
function maskSecrets(config: Record<string, unknown>, secretKeys: Set<string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) {
    out[k] = secretKeys.has(k) && v ? SECRET_MASK : v;
  }
  return out;
}
