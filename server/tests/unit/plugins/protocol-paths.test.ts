/**
 * Small pure helpers of the plugin module (#plugins): permission recognition and
 * the code/data path resolution (both the env-override and default branches).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { isKnownPermission, METHOD_PERMISSION, KNOWN_METHODS } from '../../../src/nest/plugins/protocol/envelope';
import path from 'node:path';
import { pluginsCodeRoot, pluginsDataRoot, pluginCodeDir, pluginDbFile, resolveChildEntry, serverCodeRoot, pluginPermissionArgs, pluginRealCodeDir, ensurePluginModuleType } from '../../../src/nest/plugins/paths';

afterEach(() => {
  delete process.env.TREK_PLUGINS_DIR;
  delete process.env.TREK_PLUGINS_DATA_DIR;
});

describe('envelope helpers', () => {
  it('recognises known permissions, http:outbound:<host>, and rejects unknown', () => {
    expect(isKnownPermission('db:own')).toBe(true);
    expect(isKnownPermission('http:outbound')).toBe(true);
    expect(isKnownPermission('http:outbound:api.example.com')).toBe(true);
    expect(isKnownPermission('fs:read')).toBe(false);
    expect(isKnownPermission('')).toBe(false);
  });

  it('every known method maps to a permission', () => {
    for (const m of KNOWN_METHODS) {
      expect(METHOD_PERMISSION[m]).toBeTruthy();
    }
  });
});

describe('paths', () => {
  it('uses the env override when set', () => {
    process.env.TREK_PLUGINS_DIR = '/custom/code';
    process.env.TREK_PLUGINS_DATA_DIR = '/custom/data';
    expect(pluginsCodeRoot()).toBe('/custom/code');
    expect(pluginsDataRoot()).toBe('/custom/data');
    expect(pluginCodeDir('x')).toBe(path.join('/custom/code', 'x'));
    expect(path.basename(pluginDbFile('x'))).toBe('plugin.db');
  });

  it('falls back to the data-dir default when unset', () => {
    expect(pluginsCodeRoot()).toContain('plugins');
    expect(pluginsDataRoot()).toContain('plugins-data');
  });

  it('resolves a child entry with fork args', () => {
    const r = resolveChildEntry();
    expect(r.entry).toMatch(/plugin-host-entry\.(js|ts)$/);
    expect(Array.isArray(r.execArgv)).toBe(true);
    expect(typeof r.jsMode).toBe('boolean');
  });

  it('builds scoped OS-permission flags for a plugin child (default on)', () => {
    delete process.env.TREK_PLUGIN_PERMISSIONS;
    const args = pluginPermissionArgs('flight-tracker');
    expect(args).toContain('--permission');
    // read is scoped to the compiled server dir + this plugin's own code dir…
    expect(args.some((a) => a === `--allow-fs-read=${serverCodeRoot()}`)).toBe(true);
    expect(args.some((a) => a === `--allow-fs-read=${pluginCodeDir('flight-tracker')}`)).toBe(true);
    // …and never grants fs-write / child_process / the data root.
    expect(args.some((a) => a.startsWith('--allow-fs-write'))).toBe(false);
    expect(args.some((a) => a.startsWith('--allow-child-process'))).toBe(false);
    expect(serverCodeRoot()).not.toContain(`${require('node:path').sep}data`);
  });

  it('lets an operator opt out of the permission model', () => {
    process.env.TREK_PLUGIN_PERMISSIONS = 'off';
    expect(pluginPermissionArgs('flight-tracker')).toEqual([]);
    delete process.env.TREK_PLUGIN_PERMISSIONS;
  });

  it('pluginRealCodeDir falls back to the lexical path when the dir is absent', () => {
    // no such plugin installed -> realpathSync throws -> lexical path returned
    expect(pluginRealCodeDir('does-not-exist')).toBe(pluginCodeDir('does-not-exist'));
  });

  it('ensurePluginModuleType writes a commonjs package.json only when absent', () => {
    const fs = require('node:fs');
    const os = require('node:os');
    const path = require('node:path');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plug-mod-'));
    try {
      ensurePluginModuleType(dir);
      expect(JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))).toEqual({ type: 'commonjs' });
      // an author-provided package.json is left untouched
      fs.writeFileSync(path.join(dir, 'package.json'), '{"type":"module"}');
      ensurePluginModuleType(dir);
      expect(JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))).toEqual({ type: 'module' });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
