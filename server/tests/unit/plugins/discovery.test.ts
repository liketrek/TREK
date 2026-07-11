/**
 * Plugin discovery (#plugins, M4, install-from-disk): scans the volume, upserts
 * rows as inactive, refreshes settings fields, keeps an existing plugin's status,
 * and skips invalid or native-carrying plugins (logging the reason).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { discoverPlugins } from '../../../src/nest/plugins/install/discovery';

let db: Database.Database;
let codeRoot: string;

function writePlugin(id: string, manifest: Record<string, unknown>, extra?: () => void) {
  const dir = path.join(codeRoot, id, 'server');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(codeRoot, id, 'trek-plugin.json'), JSON.stringify({ id, name: id, version: '1.0.0', type: 'integration', ...manifest }));
  fs.writeFileSync(path.join(dir, 'index.js'), 'module.exports={}');
  extra?.()
}

beforeEach(() => {
  codeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'disc-'));
  process.env.TREK_PLUGINS_DIR = codeRoot;
  db = new Database(':memory:');
  db.exec(`
    CREATE TABLE plugins (id TEXT PRIMARY KEY, name TEXT, description TEXT, type TEXT, icon TEXT, version TEXT,
      api_version INTEGER, min_trek_version TEXT, permissions TEXT, capabilities TEXT DEFAULT '{}', dependencies TEXT DEFAULT '{}', operator_egress INTEGER DEFAULT 0, granted_permissions TEXT, status TEXT, config TEXT, updated_at TEXT);
    CREATE TABLE plugin_settings_fields (plugin_id TEXT, field_key TEXT, label TEXT, input_type TEXT, placeholder TEXT, hint TEXT,
      required INTEGER, secret INTEGER, scope TEXT, options TEXT, oauth_config TEXT, sort_order INTEGER);
    CREATE TABLE plugin_actions (plugin_id TEXT, action_key TEXT, label TEXT, hint TEXT, danger INTEGER, sort_order INTEGER,
      PRIMARY KEY (plugin_id, action_key));
    CREATE TABLE plugin_error_log (id INTEGER PRIMARY KEY AUTOINCREMENT, plugin_id TEXT, level TEXT, message TEXT, ts TEXT);`);
});
afterEach(() => {
  delete process.env.TREK_PLUGINS_DIR;
  db.close();
  fs.rmSync(codeRoot, { recursive: true, force: true });
});

describe('discoverPlugins', () => {
  it('registers a new plugin inactive with its settings fields', () => {
    writePlugin('flight-tracker', {
      name: 'Flight',
      type: 'widget',
      permissions: ['db:own'],
      settings: [
        { key: 'api_key', input_type: 'password', scope: 'instance', secret: true },
        { key: 'units', input_type: 'select', scope: 'user', options: [{ value: 'm', label: 'Metric' }] },
        { key: 'oauth', input_type: 'oauth', scope: 'user', oauth: { initPath: '/o/start', callbackPath: '/o/cb' } },
      ],
    });
    const res = discoverPlugins(db);
    expect(res.discovered).toEqual(['flight-tracker']);

    const row = db.prepare("SELECT status, type, permissions FROM plugins WHERE id='flight-tracker'").get() as { status: string; type: string; permissions: string };
    expect(row.status).toBe('inactive');
    expect(row.type).toBe('widget');
    expect(JSON.parse(row.permissions)).toEqual(['db:own']);

    const field = db.prepare("SELECT field_key, secret FROM plugin_settings_fields WHERE plugin_id='flight-tracker'").get() as { field_key: string; secret: number };
    expect(field).toMatchObject({ field_key: 'api_key', secret: 1 });
  });

  it('keeps an existing plugin status + granted permissions on re-discovery', () => {
    db.prepare("INSERT INTO plugins (id, name, type, status, granted_permissions) VALUES ('keep','Keep','page','active','[\"db:own\"]')").run();
    writePlugin('keep', { name: 'Keep v2', type: 'page', version: '2.0.0' });
    discoverPlugins(db);
    const row = db.prepare("SELECT status, version, granted_permissions FROM plugins WHERE id='keep'").get() as { status: string; version: string; granted_permissions: string };
    expect(row.status).toBe('active'); // not downgraded
    expect(row.version).toBe('2.0.0'); // metadata refreshed
    expect(JSON.parse(row.granted_permissions)).toEqual(['db:own']); // grants preserved
  });

  it('tolerates a UTF-8 BOM in trek-plugin.json (Windows-authored plugins)', () => {
    writePlugin('bom-plug', { type: 'integration' });
    const mp = path.join(codeRoot, 'bom-plug', 'trek-plugin.json');
    fs.writeFileSync(mp, '\uFEFF' + fs.readFileSync(mp, 'utf8'));
    expect(discoverPlugins(db).discovered).toEqual(['bom-plug']);
  });

  it('skips an invalid manifest and logs the reason', () => {
    writePlugin('bad', { type: 'not-a-type' });
    const res = discoverPlugins(db);
    expect(res.skipped).toEqual(['bad']);
    expect(db.prepare("SELECT COUNT(*) c FROM plugins WHERE id='bad'").get()).toMatchObject({ c: 0 });
    expect((db.prepare("SELECT message FROM plugin_error_log WHERE plugin_id='bad'").get() as { message: string }).message).toContain('discovery');
  });

  it('skips a plugin that ships native binaries', () => {
    writePlugin('native', { type: 'integration' }, () => {
      fs.writeFileSync(path.join(codeRoot, 'native', 'server', 'addon.node'), '\0');
    });
    expect(discoverPlugins(db).skipped).toEqual(['native']);
  });

  it('follows a symlinked dev-link plugin only when dev-link mode is on', () => {
    const srcRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'disc-src-'));
    const prev = process.env.TREK_PLUGINS_DEV_LINK;
    try {
      const src = path.join(srcRoot, 'linked');
      fs.mkdirSync(path.join(src, 'server'), { recursive: true });
      fs.writeFileSync(path.join(src, 'trek-plugin.json'), JSON.stringify({ id: 'linked', name: 'Linked', version: '1.0.0', type: 'integration', permissions: ['db:own'] }));
      fs.writeFileSync(path.join(src, 'server', 'index.js'), 'module.exports={}');
      fs.symlinkSync(src, path.join(codeRoot, 'linked'), 'junction'); // junction on Windows, symlink on POSIX

      // Off (default): a stale dev-link symlink is not discovered or registered.
      delete process.env.TREK_PLUGINS_DEV_LINK;
      expect(discoverPlugins(db).discovered).toEqual([]);
      expect(db.prepare("SELECT status FROM plugins WHERE id='linked'").get()).toBeUndefined();

      // On: the dev-link is followed and registered inactive.
      process.env.TREK_PLUGINS_DEV_LINK = '1';
      expect(discoverPlugins(db).discovered).toEqual(['linked']);
      expect(db.prepare("SELECT status FROM plugins WHERE id='linked'").get()).toMatchObject({ status: 'inactive' });
    } finally {
      if (prev === undefined) delete process.env.TREK_PLUGINS_DEV_LINK; else process.env.TREK_PLUGINS_DEV_LINK = prev;
      fs.rmSync(srcRoot, { recursive: true, force: true });
    }
  });

  it('is a no-op when the plugins dir is absent', () => {
    process.env.TREK_PLUGINS_DIR = path.join(codeRoot, 'does-not-exist');
    expect(discoverPlugins(db)).toEqual({ discovered: [], skipped: [] });
  });
});
