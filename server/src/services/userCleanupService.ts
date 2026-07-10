import fs from 'node:fs';
import { db } from '../db/database';
import { pluginsDataRoot } from '../nest/plugins/paths';

/**
 * Erase a user's PLUGIN-held data on account deletion. Two parts:
 *  1. Host-side per-user plugin tables (encrypted config values, OAuth access/refresh
 *     tokens, in-flight OAuth state) — deleted directly; these live in trek.db, not in
 *     a plugin's own db, so nothing else ever removes them.
 *  2. A durable erasure row per plugin that holds `hook:user-data`, so its OWN db is
 *     purged of the user (drained to the plugin when it is next active).
 *
 * Runs in the core deletion path (NOT via the plugin runtime), so it works even when
 * TREK_PLUGINS_ENABLED=false or before the runtime has booted — otherwise a deletion in
 * those windows would leave the user's plugin data behind forever. Best-effort per table
 * so a slimmed-down schema (some tests) can't fail the user deletion itself.
 */
export function erasePluginUserData(userId: number): void {
  for (const table of ['plugin_user_config', 'plugin_oauth_tokens', 'plugin_oauth_state']) {
    try { db.prepare(`DELETE FROM ${table} WHERE user_id = ?`).run(userId); } catch { /* table absent (slim schema) */ }
  }
  try {
    const rows = db.prepare('SELECT id, permissions FROM plugins').all() as Array<{ id: string; permissions: string | null }>;
    const installed = new Set(rows.map((r) => r.id));
    const insert = db.prepare('INSERT OR IGNORE INTO plugin_user_erasure_queue (plugin_id, user_id) VALUES (?, ?)');
    for (const r of rows) {
      let perms: unknown;
      try { perms = JSON.parse(r.permissions ?? '[]'); } catch { perms = []; }
      if (Array.isArray(perms) && perms.includes('hook:user-data')) insert.run(r.id, userId);
    }
    // Also enqueue for plugins UNINSTALLED with their data retained (deleteData=false):
    // their data dir still holds the user's rows and a same-id reinstall would re-adopt
    // them. No permissions record survives uninstall, so we can't check hook:user-data —
    // enqueue for every orphan data dir; the row sits inert (no FK) and drains only if
    // that id is reinstalled + active (erasure delivery is a duty, not grant-gated).
    try {
      for (const entry of fs.readdirSync(pluginsDataRoot(), { withFileTypes: true })) {
        if (entry.isDirectory() && !installed.has(entry.name)) insert.run(entry.name, userId);
      }
    } catch { /* no plugin data root yet */ }
  } catch { /* plugins / queue table absent (slim schema) */ }
}

function cleanupUserReferences(userId: number): void {
  db.prepare('UPDATE trip_members SET invited_by = NULL WHERE invited_by = ?').run(userId);
  db.prepare('UPDATE budget_items SET paid_by_user_id = NULL WHERE paid_by_user_id = ?').run(userId);
  db.prepare('DELETE FROM share_tokens WHERE created_by = ?').run(userId);
  db.prepare('DELETE FROM journey_share_tokens WHERE created_by = ?').run(userId);
  // Owned journeys cascade-delete their entries/contributors/share_tokens/photos via journey_id FKs
  db.prepare('DELETE FROM journeys WHERE user_id = ?').run(userId);
  // Entries authored on other users' journeys (not covered by the cascade above)
  db.prepare('DELETE FROM journey_entries WHERE author_id = ?').run(userId);
  db.prepare('DELETE FROM journey_contributors WHERE user_id = ?').run(userId);
}

export function deleteUserCompletely(userId: number): void {
  const tx = db.transaction((id: number) => {
    cleanupUserReferences(id);
    erasePluginUserData(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  });
  tx(userId);
}
