/**
 * Backup/restore of the plugin trees (#plugins). Proves the two-step, restart-safe
 * flow: restore STAGES the extracted trees beside the live ones, and a later boot SWAPS
 * them in (so we never overwrite a plugin DB the runtime holds open). Covers the no-op
 * paths (older archive with no plugin trees) and that the pre-restore tree is replaced.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { stageExtractedPluginTrees, applyStagedPluginTrees, setStagedRestoreApplier, applyStagedRestoreNow } from '../../../src/nest/plugins/plugin-backup';

let root: string;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-pbackup-'));
  process.env.TREK_PLUGINS_DIR = path.join(root, 'plugins');
  process.env.TREK_PLUGINS_DATA_DIR = path.join(root, 'plugins-data');
});
afterEach(() => {
  delete process.env.TREK_PLUGINS_DIR;
  delete process.env.TREK_PLUGINS_DATA_DIR;
  fs.rmSync(root, { recursive: true, force: true });
});

const read = (p: string) => fs.readFileSync(p, 'utf8');
const write = (p: string, s: string) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };

describe('plugin backup staging + boot reconcile', () => {
  it('stages the extracted trees beside the live ones, then a boot swaps them in', () => {
    // A live install with old plugin data + code.
    write(path.join(root, 'plugins-data', 'notes', 'plugin.db'), 'OLD-DATA');
    write(path.join(root, 'plugins', 'notes', 'server', 'index.js'), 'OLD-CODE');

    // A restore extracted a newer backup into an extract dir.
    const extract = path.join(root, 'restore-123');
    write(path.join(extract, 'plugins-data', 'notes', 'plugin.db'), 'NEW-DATA');
    write(path.join(extract, 'plugins-code', 'notes', 'server', 'index.js'), 'NEW-CODE');

    // stage: copies next to the live trees, does not touch the live trees yet
    expect(stageExtractedPluginTrees(extract)).toBe(true);
    expect(fs.existsSync(path.join(root, 'plugins-data.restore', 'notes', 'plugin.db'))).toBe(true);
    expect(read(path.join(root, 'plugins-data', 'notes', 'plugin.db'))).toBe('OLD-DATA'); // live untouched

    // boot reconcile: swaps staged -> live, drops staging + the old tree
    expect(applyStagedPluginTrees().sort()).toEqual(['plugins-code', 'plugins-data']);
    expect(read(path.join(root, 'plugins-data', 'notes', 'plugin.db'))).toBe('NEW-DATA');
    expect(read(path.join(root, 'plugins', 'notes', 'server', 'index.js'))).toBe('NEW-CODE');
    expect(fs.existsSync(path.join(root, 'plugins-data.restore'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'plugins-data.pre-restore'))).toBe(false);
  });

  it('stage is a no-op for an archive that carries no plugin trees (older backup)', () => {
    const extract = path.join(root, 'restore-empty');
    write(path.join(extract, 'travel.db'), 'db'); // only core data, no plugin trees
    expect(stageExtractedPluginTrees(extract)).toBe(false);
    expect(fs.existsSync(path.join(root, 'plugins-data.restore'))).toBe(false);
  });

  it('boot reconcile is a no-op when nothing was staged', () => {
    write(path.join(root, 'plugins-data', 'notes', 'plugin.db'), 'LIVE');
    expect(applyStagedPluginTrees()).toEqual([]);
    expect(read(path.join(root, 'plugins-data', 'notes', 'plugin.db'))).toBe('LIVE'); // untouched
  });

  it('reconcile creates the live tree even when there was none before (fresh restore)', () => {
    // no live plugins-data at all; only a staged one
    write(path.join(root, 'plugins-data.restore', 'newplug', 'plugin.db'), 'DATA');
    expect(applyStagedPluginTrees()).toEqual(['plugins-data']);
    expect(read(path.join(root, 'plugins-data', 'newplug', 'plugin.db'))).toBe('DATA');
    expect(fs.existsSync(path.join(root, 'plugins-data.restore'))).toBe(false);
  });

  it('the swap replaces real entries but PRESERVES a dev-linked plugin the backup excluded', () => {
    // a real plugin + a dev-linked plugin (junction to an author source outside the root)
    const authorSrc = path.join(root, 'author-src');
    write(path.join(authorSrc, 'server', 'index.js'), 'DEV');
    write(path.join(root, 'plugins', 'real', 'server', 'index.js'), 'OLD-REAL');
    fs.mkdirSync(path.join(root, 'plugins'), { recursive: true });
    try { fs.symlinkSync(authorSrc, path.join(root, 'plugins', 'linked'), 'junction'); }
    catch { return; } // symlink/junction not permitted in this env → skip
    // a restore staged only the real plugin (dev-links are never in a backup)
    const extract = path.join(root, 'restore-dl');
    write(path.join(extract, 'plugins-code', 'real', 'server', 'index.js'), 'NEW-REAL');
    stageExtractedPluginTrees(extract);
    expect(applyStagedPluginTrees()).toContain('plugins-code');
    expect(read(path.join(root, 'plugins', 'real', 'server', 'index.js'))).toBe('NEW-REAL'); // real replaced
    expect(fs.existsSync(path.join(root, 'plugins', 'linked'))).toBe(true);                    // dev-link kept
    expect(read(path.join(root, 'plugins', 'linked', 'server', 'index.js'))).toBe('DEV');      // still resolves
  });

  it('the swap removes a live plugin absent from the backup, and re-running is idempotent (crash-safe)', () => {
    // live has an up-to-date plugin + a plugin uninstalled since the backup was taken
    write(path.join(root, 'plugins-data', 'keep', 'plugin.db'), 'OLD')
    write(path.join(root, 'plugins-data', 'removed-since', 'plugin.db'), 'GONE')
    // staged (from the backup) only has 'keep'
    write(path.join(root, 'plugins-data.restore', 'keep', 'plugin.db'), 'NEW')
    applyStagedPluginTrees()
    expect(read(path.join(root, 'plugins-data', 'keep', 'plugin.db'))).toBe('NEW')     // overwritten
    expect(fs.existsSync(path.join(root, 'plugins-data', 'removed-since'))).toBe(false) // not in backup → removed
    expect(fs.existsSync(path.join(root, 'plugins-data.restore'))).toBe(false)          // staging consumed last

    // Simulate a crash BEFORE staging was deleted: the staging dir still exists, live is
    // already (partly) applied. Copy-not-move means re-running restores correctly, never
    // deleting an already-restored entry it can't recreate.
    write(path.join(root, 'plugins-data.restore', 'keep', 'plugin.db'), 'NEW')
    write(path.join(root, 'plugins-data', 'keep', 'plugin.db'), 'NEW') // already applied
    applyStagedPluginTrees()
    expect(read(path.join(root, 'plugins-data', 'keep', 'plugin.db'))).toBe('NEW')      // intact, not lost
    expect(fs.existsSync(path.join(root, 'plugins-data.restore'))).toBe(false)
  })

  it('applyStagedRestoreNow runs the registered applier (runtime quiesce), or reports false when none', async () => {
    expect(await applyStagedRestoreNow()).toBe(false); // no applier registered
    let ran = false;
    setStagedRestoreApplier(async () => { ran = true; });
    expect(await applyStagedRestoreNow()).toBe(true);
    expect(ran).toBe(true);
    // an applier that throws is caught and reported as not-applied (falls back to boot reconcile)
    setStagedRestoreApplier(() => { throw new Error('quiesce failed'); });
    expect(await applyStagedRestoreNow()).toBe(false);
    setStagedRestoreApplier(null);
  });

  it('a stale staging from an aborted prior restore is overwritten, not merged', () => {
    write(path.join(root, 'plugins-data.restore', 'ghost', 'plugin.db'), 'STALE');
    const extract = path.join(root, 'restore-x');
    write(path.join(extract, 'plugins-data', 'real', 'plugin.db'), 'FRESH');
    stageExtractedPluginTrees(extract);
    // the stale 'ghost' entry is gone; only the fresh staging remains
    expect(fs.existsSync(path.join(root, 'plugins-data.restore', 'ghost'))).toBe(false);
    expect(read(path.join(root, 'plugins-data.restore', 'real', 'plugin.db'))).toBe('FRESH');
  });
});
