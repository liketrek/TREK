import type { PluginDataStore } from '../../../db/engine/plugin-data';
import { openSqlitePluginDataStores, type SqlitePluginDataStore } from '../../../db/engine/sqlite/plugin-data-store';
import { pluginDataDir, pluginsDataRoot } from '../paths';

import fs from 'node:fs';
import path from 'node:path';

// The port, re-exported for the RPC kit, which may import from this file only (eslint.config.mjs).
export type { PluginDataStore };

/*
 * The plugin data directories on disk: erasing one, and copying them all for
 * a backup. On SQLite each holds the plugin's database file, which the
 * SQLite store opens (`db/engine/sqlite/plugin-data-store.ts`); on Postgres
 * it holds only the files a plugin keeps beside its schema.
 */

/**
 * Folds the WAL back into each open plugin database so a file copy made next
 * is a complete, consistent snapshot, as the core backup's checkpoint does for
 * TREK's own file. Best effort per handle; never throws.
 */
export function checkpointAllPluginDataDbs(): void {
  for (const store of openSqlitePluginDataStores()) {
    try {
      store.checkpoint();
    } catch {
      /* a busy or closed handle is skipped, not fatal */
    }
  }
}

/** Delete a plugin's data directory (uninstall "delete data"). */
export function removePluginData(pluginId: string): void {
  fs.rmSync(pluginDataDir(pluginId), { recursive: true, force: true });
}

/**
 * Copy every plugin's data dir into `destRoot` as a CONSISTENT snapshot, for a backup to
 * archive instead of the live tree. An open plugin.db is captured with VACUUM INTO (safe
 * under concurrent writes); a plugin with no live handle is copied as-is (no writer). The
 * -wal/-shm sidecars are never copied: the snapshot folds them in, and copying them out
 * of step with the .db is exactly what produced torn/corrupt restores when the archiver
 * read the live files lazily while a plugin kept writing. Blobs and any other files a
 * plugin wrote to its dir are copied verbatim. Best-effort per file; never throws.
 */
export function snapshotAllPluginDataDbs(destRoot: string): void {
  const root = pluginsDataRoot();
  if (!fs.existsSync(root)) return;
  const openById = new Map<string, SqlitePluginDataStore>();
  for (const store of openSqlitePluginDataStores()) if (store.isOpen()) openById.set(store.pluginId, store);
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const srcDir = path.join(root, entry.name);
    const destDir = path.join(destRoot, entry.name);
    fs.mkdirSync(destDir, { recursive: true });
    const open = openById.get(entry.name);
    // Handle the live db up front so we know whether its WAL got folded in. If both
    // the VACUUM INTO snapshot and the checkpoint fail, the -wal/-shm are NOT folded,
    // so they must be copied alongside the .db: a .db stripped of an un-checkpointed
    // WAL loses committed transactions, whereas the .db + its WAL is a recoverable set.
    let foldedIn = false;
    if (open) {
      try {
        open.snapshotInto(path.join(destDir, 'plugin.db'));
        foldedIn = true;
      } catch {
        try {
          open.checkpoint();
          foldedIn = true;
        } catch {
          /* WAL not folded: keep the sidecars */
        }
        try {
          fs.copyFileSync(path.join(srcDir, 'plugin.db'), path.join(destDir, 'plugin.db'));
        } catch {
          /* unreadable live db: best effort */
        }
      }
    }
    for (const f of fs.readdirSync(srcDir, { withFileTypes: true })) {
      if (f.name === 'plugin.db' && open) continue; // already snapshotted above
      // Skip the .db sidecars only when the live handle's WAL was folded in: VACUUM
      // INTO / checkpoint absorbs them, and copying them out of step with a live writer
      // is what produced torn restores. For a plugin with NO open handle there is no
      // writer, so the -wal/-shm are a consistent set with the .db; copy them too, or an
      // unclean shutdown's committed-but-uncheckpointed transactions (still sitting in
      // the WAL) would be lost from the backup.
      if ((f.name.endsWith('-wal') || f.name.endsWith('-shm')) && foldedIn) continue;
      const src = path.join(srcDir, f.name);
      const dest = path.join(destDir, f.name);
      try {
        if (f.isDirectory()) fs.cpSync(src, dest, { recursive: true });
        else fs.copyFileSync(src, dest);
      } catch {
        /* skip an unreadable entry rather than fail the whole backup */
      }
    }
  }
}
