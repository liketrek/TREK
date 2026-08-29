// Injected since BudgetModule dropped its AuthModule import (BudgetMcp's demo
// guard reads RuntimeEnvService + the users table now), which un-closed the
// AuthModule -> BudgetModule cycle that used to force budget.bridge here.
import { BudgetService } from '../budget/budget.service';
import { DatabaseService } from '../database/database.service';
import { pluginsDataRoot } from '../plugins/paths';
import { Injectable } from '@nestjs/common';

import fs from 'node:fs';

/**
 * Account erasure — everything that has to happen around `DELETE FROM users`
 * and is not covered by a foreign key.
 *
 * Lives in the auth domain because it owns the `users` table; both deletion
 * paths (a user deleting their own account, an admin deleting someone else's)
 * go through here, and `TripsService.deleteGuest` reuses the plugin half for a
 * guest id. The plugin erasure runs in the CORE deletion path, not via the
 * plugin runtime, so it works even when TREK_PLUGINS_ENABLED=false or before
 * the runtime has booted — otherwise a deletion in those windows would leave
 * the user's plugin data behind forever.
 */
@Injectable()
export class UserCleanupService {
  constructor(
    private readonly db: DatabaseService,
    private readonly budget: BudgetService,
  ) {}

  /**
   * Erase a user's PLUGIN-held data on account deletion. Two parts:
   *  1. Host-side per-user plugin tables (encrypted config values, OAuth access/refresh
   *     tokens, in-flight OAuth state) — deleted directly; these live in trek.db, not in
   *     a plugin's own db, so nothing else ever removes them.
   *  2. A durable erasure row per plugin that holds `hook:user-data`, so its OWN db is
   *     purged of the user (drained to the plugin when it is next active).
   *
   * Best-effort per table so a slimmed-down schema (some tests) can't fail the user
   * deletion itself.
   */
  erasePluginUserData(userId: number): void {
    for (const table of ['plugin_user_config', 'plugin_oauth_tokens', 'plugin_oauth_state']) {
      try {
        this.db.run(`DELETE FROM ${table} WHERE user_id = ?`, userId);
      } catch {
        /* table absent (slim schema) */
      }
    }
    try {
      const rows = this.db.all<{ id: string; permissions: string | null }>('SELECT id, permissions FROM plugins');
      const installed = new Set(rows.map((r) => r.id));
      const insert = this.db.prepare(
        'INSERT OR IGNORE INTO plugin_user_erasure_queue (plugin_id, user_id) VALUES (?, ?)',
      );
      for (const r of rows) {
        let perms: unknown;
        try {
          perms = JSON.parse(r.permissions ?? '[]');
        } catch {
          perms = [];
        }
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
      } catch {
        /* no plugin data root yet */
      }
    } catch {
      /* plugins / queue table absent (slim schema) */
    }
  }

  private cleanupUserReferences(userId: number): void {
    this.db.run('UPDATE trip_members SET invited_by = NULL WHERE invited_by = ?', userId);
    this.db.run('UPDATE budget_items SET paid_by_user_id = NULL WHERE paid_by_user_id = ?', userId);
    this.budget.removeUserFromBudgetItems(userId);
    this.db.run('DELETE FROM share_tokens WHERE created_by = ?', userId);
    this.db.run('DELETE FROM journey_share_tokens WHERE created_by = ?', userId);
    // Owned journeys cascade-delete their entries/contributors/share_tokens/photos via journey_id FKs
    this.db.run('DELETE FROM journeys WHERE user_id = ?', userId);
    // Entries authored on other users' journeys (not covered by the cascade above)
    this.db.run('DELETE FROM journey_entries WHERE author_id = ?', userId);
    this.db.run('DELETE FROM journey_contributors WHERE user_id = ?', userId);
  }

  deleteUserCompletely(userId: number): void {
    this.db.transaction(() => {
      this.cleanupUserReferences(userId);
      this.erasePluginUserData(userId);
      this.db.run('DELETE FROM users WHERE id = ?', userId);
    });
  }
}
