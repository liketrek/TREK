import fs from 'node:fs';
import path from 'node:path';
import type BetterSqlite3 from 'better-sqlite3';
import { pluginsCodeRoot, pluginCodeDir } from '../paths';
import { parseJsonText, parseManifest, type PluginManifest } from './manifest';
import { scanForNativeBinaries } from './native-scan';
import { devLinkEnabled } from '../dev-link';

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
    if (entry.name.startsWith('.')) continue;
    // A dev-linked plugin is `<root>/<id>` as a symlink (POSIX) / junction (Windows)
    // pointing at the author's build dir — follow it so it discovers like a real dir.
    // stat() resolves the link; a dangling/broken link throws and is skipped.
    let isDir = entry.isDirectory();
    const full = path.join(root, entry.name);
    if (!isDir && entry.isSymbolicLink()) {
      // A dev-link symlink only loads in dev-link mode; a stale link left on the
      // volume must not be discovered/registered on a normal (non-dev) boot.
      if (!devLinkEnabled()) continue;
      try { isDir = fs.statSync(full).isDirectory(); } catch { isDir = false; }
    } else if (isDir && !devLinkEnabled()) {
      // On Windows a dev-link is a junction, which Dirent reports as a plain
      // directory (isSymbolicLink() is false). Detect it the same way: if the
      // entry resolves outside the plugins volume it is a link, so skip it
      // unless dev-link mode is on. A normal dir realpaths back to itself.
      try {
        if (fs.realpathSync(full) !== path.join(fs.realpathSync(root), entry.name)) continue;
      } catch { /* unreadable target — leave as a normal dir and let discovery fail loudly */ }
    }
    if (!isDir) continue;
    const dir = pluginCodeDir(entry.name);
    const manifestPath = path.join(dir, 'trek-plugin.json');
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const manifest = parseManifest(parseJsonText(fs.readFileSync(manifestPath, 'utf8')));
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
  const dependencies = JSON.stringify({ requiredAddons: m.requiredAddons, pluginDependencies: m.pluginDependencies });
  const existing = db.prepare('SELECT id FROM plugins WHERE id = ?').get(m.id) as { id: string } | undefined;
  if (existing) {
    db.prepare(
      `UPDATE plugins SET name = ?, description = ?, type = ?, icon = ?, version = ?, api_version = ?,
         min_trek_version = ?, permissions = ?, capabilities = ?, dependencies = ?, operator_egress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    ).run(m.name, m.description ?? null, m.type, m.icon ?? 'Blocks', m.version, m.apiVersion, m.minTrekVersion ?? null, JSON.stringify(m.permissions), JSON.stringify(m.capabilities), dependencies, m.operatorEgress ? 1 : 0, m.id);
  } else {
    db.prepare(
      // granted_permissions '' (empty, not '[]') marks "never consented" so the
      // first activation is distinguishable from a plugin consented to zero perms.
      `INSERT INTO plugins (id, name, description, type, icon, version, api_version, min_trek_version, permissions, capabilities, dependencies, operator_egress, granted_permissions, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', 'inactive')`,
    ).run(m.id, m.name, m.description ?? null, m.type, m.icon ?? 'Blocks', m.version, m.apiVersion, m.minTrekVersion ?? null, JSON.stringify(m.permissions), JSON.stringify(m.capabilities), dependencies, m.operatorEgress ? 1 : 0);
  }

  // Refresh the settings-page action descriptors from the manifest.
  db.prepare('DELETE FROM plugin_actions WHERE plugin_id = ?').run(m.id);
  const insertAction = db.prepare(
    'INSERT INTO plugin_actions (plugin_id, action_key, label, hint, danger, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
  );
  m.actions.forEach((a, i) => insertAction.run(m.id, a.key, a.label, a.hint ?? null, a.danger ? 1 : 0, i));

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
