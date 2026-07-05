import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateManifest } from '../src/index.js';
import { scaffold } from '../src/cli/create.js';
import { PERMISSION_CATALOG, KNOWN_PERMISSIONS, isInteractive, missingArgs } from '../src/cli/ui.js';
import { resolveMenuChoice, PRIMARY_MENU, ADVANCED_MENU } from '../src/cli/menu.js';

describe('scaffold egress (http:outbound)', () => {
  let tmp: string;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'egress-')); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('writes egress so an http:outbound plugin validates', () => {
    scaffold('net-plug', 'integration', tmp, { permissions: ['http:outbound'], egress: ['api.example.com'] });
    const m = JSON.parse(fs.readFileSync(path.join(tmp, 'net-plug', 'trek-plugin.json'), 'utf8'));
    expect(m.egress).toEqual(['api.example.com']);
    expect(validateManifest(m).ok).toBe(true);
  });

  it('without egress the same manifest is invalid — which the wizard now prevents', () => {
    scaffold('net-plug', 'integration', tmp, { permissions: ['http:outbound'] });
    const m = JSON.parse(fs.readFileSync(path.join(tmp, 'net-plug', 'trek-plugin.json'), 'utf8'));
    expect(m.egress).toBeUndefined();
    expect(validateManifest(m).ok).toBe(false); // http:outbound requires an egress allow-list
  });

  it('omits egress entirely when none is given (no empty array noise)', () => {
    scaffold('plain-plug', 'integration', tmp, { permissions: ['db:own'] });
    const m = JSON.parse(fs.readFileSync(path.join(tmp, 'plain-plug', 'trek-plugin.json'), 'utf8'));
    expect('egress' in m).toBe(false);
  });
});

describe('permission catalog', () => {
  it('covers exactly the known permission ids (none lost in the move to ui.ts)', () => {
    expect(KNOWN_PERMISSIONS).toEqual([
      'db:own', 'db:read:trips', 'db:read:users', 'db:read:costs', 'db:write:costs',
      'ws:broadcast:trip', 'ws:broadcast:user',
      'hook:photo-provider', 'hook:calendar-source', 'http:outbound',
    ]);
    for (const p of PERMISSION_CATALOG) expect(p.hint.length).toBeGreaterThan(0); // every option is described
  });
});

describe('resolveMenuChoice', () => {
  it('maps every menu value (commands + control entries) to itself', () => {
    for (const item of [...PRIMARY_MENU, ...ADVANCED_MENU]) {
      expect(resolveMenuChoice(item.value)).toBe(item.value);
    }
  });
  it('returns undefined for anything not in the menu', () => {
    expect(resolveMenuChoice('nope')).toBeUndefined();
    expect(resolveMenuChoice('')).toBeUndefined();
  });
});

describe('missingArgs', () => {
  it('reports the absent required flags, in order', () => {
    expect(missingArgs({}, ['repo', 'tag'])).toEqual(['repo', 'tag']);
    expect(missingArgs({ repo: 'a/b' }, ['repo', 'tag'])).toEqual(['tag']);
    expect(missingArgs({ repo: 'a/b', tag: 'v1.0.0' }, ['repo', 'tag'])).toEqual([]);
  });
});

describe('isInteractive', () => {
  it('is false when stdin/stdout are not TTYs (CI / pipes — the parity path)', () => {
    const inTTY = process.stdin.isTTY;
    const outTTY = process.stdout.isTTY;
    try {
      (process.stdin as { isTTY?: boolean }).isTTY = undefined;
      (process.stdout as { isTTY?: boolean }).isTTY = undefined;
      expect(isInteractive()).toBe(false);
      (process.stdin as { isTTY?: boolean }).isTTY = true;
      (process.stdout as { isTTY?: boolean }).isTTY = true;
      expect(isInteractive()).toBe(true);
    } finally {
      (process.stdin as { isTTY?: boolean }).isTTY = inTTY;
      (process.stdout as { isTTY?: boolean }).isTTY = outTTY;
    }
  });
});
