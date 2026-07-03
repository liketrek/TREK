import { Injectable } from '@nestjs/common';
import { db } from '../../db/database';
import { pluginsEnabled } from './kill-switch';
import { maybe_encrypt_api_key } from '../../services/apiKeyCrypto';

const SECRET_MASK = '••••••••';

/**
 * Read side of the plugin system (#plugins), M0 scaffold. Lists installed
 * plugins from the `plugins` registry table and reports whether the runtime is
 * enabled (TREK_PLUGINS_ENABLED). No execution here — the isolated runtime,
 * install pipeline and registry fetch land in later milestones.
 */

export interface PluginListItem {
  id: string;
  name: string;
  description: string | null;
  type: string;
  icon: string | null;
  version: string | null;
  status: string;
  reviewed_at: string | null;
  source_repo: string | null;
}

@Injectable()
export class PluginsService {
  list(): { enabled: boolean; plugins: PluginListItem[] } {
    const plugins = db
      .prepare(
        `SELECT id, name, description, type, icon, version, status, reviewed_at, source_repo
         FROM plugins
         ORDER BY sort_order, name`,
      )
      .all() as PluginListItem[];
    return { enabled: pluginsEnabled(), plugins };
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
function maskSecrets(config: Record<string, unknown>, secretKeys: Set<string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) {
    out[k] = secretKeys.has(k) && v ? SECRET_MASK : v;
  }
  return out;
}
