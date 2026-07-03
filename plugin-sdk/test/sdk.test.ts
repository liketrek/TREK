import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { definePlugin, PLUGIN_API_VERSION, validateManifest, createMockHost } from '../src/index.js';
import { scaffold } from '../src/cli/create.js';
import { validatePluginDir } from '../src/cli/validate.js';

describe('definePlugin + api version', () => {
  it('returns the definition and exposes the api version', () => {
    const def = { onLoad: async () => {} };
    expect(definePlugin(def)).toBe(def);
    expect(PLUGIN_API_VERSION).toBe(1);
  });
});

describe('validateManifest', () => {
  const base = { id: 'flight-tracker', name: 'Flight', version: '1.0.0', type: 'widget', apiVersion: 1 };
  it('accepts a valid manifest', () => {
    expect(validateManifest(base).ok).toBe(true);
  });
  it('collects every problem', () => {
    const r = validateManifest({ id: 'Bad', version: '1.x', type: 'nope', permissions: ['fs:read'] });
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBeGreaterThan(2);
  });
  it('requires egress when http:outbound is declared', () => {
    expect(validateManifest({ ...base, permissions: ['http:outbound'] }).ok).toBe(false);
    expect(validateManifest({ ...base, permissions: ['http:outbound'], egress: ['api.x.com'] }).ok).toBe(true);
  });
  it('rejects native modules and non-objects', () => {
    expect(validateManifest({ ...base, nativeModules: true }).ok).toBe(false);
    expect(validateManifest('nope').ok).toBe(false);
  });
});

describe('createMockHost', () => {
  it('enforces the granted permission set', async () => {
    const { ctx } = createMockHost({ grants: ['db:own'] });
    await expect(ctx.db.migrate('1', 'CREATE TABLE t (x)')).resolves.toEqual({ applied: true });
    await expect(ctx.trips.getById(1, 1)).rejects.toThrow(/PERMISSION_DENIED/);
  });

  it('membership-checks trip reads and records broadcasts', async () => {
    const { ctx, broadcasts } = createMockHost({
      grants: ['db:read:trips', 'ws:broadcast:trip'],
      trips: { 1: { members: [42], data: { id: 1, name: 'Japan' } } },
    });
    await expect(ctx.trips.getById(1, 99)).rejects.toThrow(/RESOURCE_FORBIDDEN/);
    expect(await ctx.trips.getById(1, 42)).toEqual({ id: 1, name: 'Japan' });
    await ctx.ws.broadcastToTrip(1, 'ping', { a: 1 });
    expect(broadcasts).toEqual([{ kind: 'trip', target: 1, event: 'ping', data: { a: 1 } }]);
  });

  it('returns canned db.query results + records logs', async () => {
    const { ctx, logs } = createMockHost({ grants: ['db:own'], queryResults: { 'SELECT 1': [{ n: 1 }] } });
    expect(await ctx.db.query('SELECT 1')).toEqual([{ n: 1 }]);
    ctx.log.info('hi');
    expect(logs).toEqual([{ level: 'info', msg: 'hi' }]);
  });
});

describe('scaffold + validate CLIs', () => {
  let tmp: string;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sdk-')); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('scaffolds a widget plugin that then validates (with README warnings)', () => {
    scaffold('my-widget', 'widget', tmp);
    const dir = path.join(tmp, 'my-widget');
    expect(fs.existsSync(path.join(dir, 'trek-plugin.json'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'server', 'index.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'client', 'index.html'))).toBe(true);

    const r = validatePluginDir(dir);
    expect(r.ok).toBe(true); // manifest + files valid
    expect(r.warnings.some((w) => /placeholder|screenshot/.test(w))).toBe(true); // README is the unfilled template
  });

  it('rejects an invalid plugin name', () => {
    expect(() => scaffold('Bad Name', 'widget', tmp)).toThrow(/invalid plugin id/);
  });

  it('validatePluginDir flags a missing manifest', () => {
    expect(validatePluginDir(tmp).ok).toBe(false);
  });
});

describe('reference plugin (examples/koffi)', () => {
  const dir = path.resolve(import.meta.dirname, '..', 'examples', 'koffi');

  it('passes the same validation authors run', () => {
    const r = validatePluginDir(dir);
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('has a valid, minimal-permission hero-widget manifest', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'trek-plugin.json'), 'utf8')) as {
      capabilities?: { widget?: { slot?: string } };
    };
    const res = validateManifest(manifest);
    expect(res.ok).toBe(true);
    expect(res.manifest?.permissions).toEqual(['db:read:trips']);
    expect(manifest.capabilities?.widget?.slot).toBe('hero');
  });
});
