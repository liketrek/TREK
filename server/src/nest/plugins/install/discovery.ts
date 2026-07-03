import fs from 'node:fs';
import path from 'node:path';
import type BetterSqlite3 from 'better-sqlite3';
import { pluginsCodeRoot, pluginCodeDir } from '../paths';
import { parseManifest, type PluginManifest } from './manifest';
import { scanForNativeBinaries } from './native-scan';

/**
 * Discover plugins placed on the /plugins volume (#plugins, M4, "install from
 * disk"). Reads each subdir's trek-plugin.json and upserts a registry row as
 * INACTIVE — an existing plugin keeps its status / granted permissions / config,
 * so re-discovery never silently re-activates or wipes settings. A plugin whose
 * manifest is invalid or that ships native binaries is skipped (recorded to its
 * error log if it already existed).
 */
export function discoverPlugins(db: BetterSqlite3.Database): { discovered: string[]; skipped: string[] } {
  const root = pluginsCodeRoot();
  const discovered: string[] = [];
  const skipped: string[] = [];
  if (!fs.existsSync(root)) return { discovered, skipped };

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const dir = pluginCodeDir(entry.name);
    const manifestPath = path.join(dir, 'trek-plugin.json');
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const manifest = parseManifest(JSON.parse(fs.readFileSync(manifestPath, 'utf8')));
      if (manifest.id !== entry.name) throw new Error(`manifest id "${manifest.id}" != directory "${entry.name}"`);
      if (scanForNativeBinaries(dir).length) throw new Error('directory contains native binaries');
      upsert(db, manifest);
      discovered.push(manifest.id);
    } catch (e) {
      skipped.push(entry.name);
      const msg = e instanceof Error ? e.message : 'invalid plugin';
      db.prepare('INSERT INTO plugin_error_log (plugin_id, level, message) VALUES (?, ?, ?)').run(entry.name, 'error', `discovery: ${msg}`);
    }
  }
  return { discovered, skipped };
}

function upsert(db: BetterSqlite3.Database, m: PluginManifest): void {
  const existing = db.prepare('SELECT id FROM plugins WHERE id = ?').get(m.id) as { id: string } | undefined;
  if (existing) {
    db.prepare(
      `UPDATE plugins SET name = ?, description = ?, type = ?, icon = ?, version = ?, api_version = ?,
         min_trek_version = ?, permissions = ?, capabilities = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    ).run(m.name, m.description ?? null, m.type, m.icon ?? 'Blocks', m.version, m.apiVersion, m.minTrekVersion ?? null, JSON.stringify(m.permissions), JSON.stringify(m.capabilities), m.id);
  } else {
    db.prepare(
      `INSERT INTO plugins (id, name, description, type, icon, version, api_version, min_trek_version, permissions, capabilities, granted_permissions, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', 'inactive')`,
    ).run(m.id, m.name, m.description ?? null, m.type, m.icon ?? 'Blocks', m.version, m.apiVersion, m.minTrekVersion ?? null, JSON.stringify(m.permissions), JSON.stringify(m.capabilities));
  }

  // Refresh the settings-field descriptors from the manifest.
  db.prepare('DELETE FROM plugin_settings_fields WHERE plugin_id = ?').run(m.id);
  const insert = db.prepare(
    `INSERT INTO plugin_settings_fields (plugin_id, field_key, label, input_type, placeholder, hint, required, secret, scope, options, oauth_config, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  m.settings.forEach((f, i) => {
    insert.run(
      m.id,
      f.key,
      f.label ?? f.key,
      f.input_type ?? 'text',
      f.placeholder ?? null,
      f.hint ?? null,
      f.required ? 1 : 0,
      f.secret ? 1 : 0,
      f.scope ?? 'instance',
      f.options ? JSON.stringify(f.options) : null,
      f.oauth ? JSON.stringify(f.oauth) : null,
      i,
    );
  });
}
