/**
 * The SDK hand-mirrors two things the server owns: the hook→permission map, and the
 * pure egress-policy helpers. trek-plugin-sdk ships standalone and cannot import across
 * the package boundary, so the copies are real copies — and a silent drift here is the
 * worst possible bug in this module: `dev` would confidently green-light a plugin that
 * the host then refuses (or refuse one the host would allow).
 *
 * These tests read the server's source directly. They only run inside the TREK monorepo;
 * in a published/standalone checkout the server isn't there and they skip.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOOK_PERMISSION } from '../src/permissions.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const serverPlugins = path.resolve(here, '../../server/src/nest/plugins');
const supervisor = path.join(serverPlugins, 'supervisor/plugin-supervisor.ts');
const serverEgress = path.join(serverPlugins, 'runtime/egress-policy.ts');
const inMonorepo = fs.existsSync(supervisor) && fs.existsSync(serverEgress);

describe.skipIf(!inMonorepo)('parity with the host', () => {
  it('HOOK_PERMISSION matches the supervisor\'s map exactly', () => {
    const src = fs.readFileSync(supervisor, 'utf8');
    const block = src.match(/const HOOK_PERMISSION[^{]*\{([\s\S]*?)\n\};/);
    expect(block, 'could not find HOOK_PERMISSION in plugin-supervisor.ts').toBeTruthy();

    const host: Record<string, string> = {};
    for (const [, key, perm] of block![1].matchAll(/^\s*(\w+):\s*'([^']+)'/gm)) host[key] = perm;

    // Both directions: a hook the host gates that we don't know about means dev fires it
    // when TREK never would; one we gate that the host doesn't means dev refuses for nothing.
    expect(Object.keys(host).length).toBeGreaterThan(0);
    expect(HOOK_PERMISSION).toEqual(host);
  });

  it('the vendored egress-policy helpers are byte-identical to the server\'s', () => {
    const ours = fs.readFileSync(path.resolve(here, '../src/egress-policy.ts'), 'utf8');
    const theirs = fs.readFileSync(serverEgress, 'utf8');

    // Compare the pure helpers only — our file additionally carries installEgressGuard
    // (the server's lives in plugin-host-entry.ts, where it is coupled to the child).
    const fns = ['isBlockedIp', 'expandV6', 'makeHostAllow', 'dgramSendTarget', 'dgramConnectTarget', 'unwrapConnectArgs', 'classifyConnect'];
    const body = (src: string, name: string): string => {
      const start = src.indexOf(`function ${name}(`);
      expect(start, `${name} not found`).toBeGreaterThan(-1);
      // From the signature to the closing brace at column 0 — these are all top-level fns.
      const end = src.indexOf('\n}', start);
      return src.slice(start, end).replace(/\s+/g, ' ').trim();
    };
    for (const fn of fns) expect(body(ours, fn), `${fn} has drifted from the server`).toBe(body(theirs, fn));
  });
});
