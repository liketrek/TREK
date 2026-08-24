/**
 * The hook->permission map is no longer hand-mirrored: gen-plugin-facts.ts generates
 * src/generated/host-facts.ts from the server's protocol/envelope.ts, and that
 * generator's --check mode is a CI gate. What is still hand-vendored here is the
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
import { PLUGIN_SESSION_MAX_KEYS, PLUGIN_SESSION_MAX_KEY_LENGTH, PLUGIN_SESSION_MAX_VALUE_BYTES, EVENT_FAMILIES, EVENT_SNAPSHOT_GRANT, KNOWN_PERMISSIONS } from '../src/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const serverPlugins = path.resolve(here, '../../server/src/nest/plugins');
const envelopeFile = path.join(serverPlugins, 'protocol/envelope.ts');
const serverEgress = path.join(serverPlugins, 'runtime/egress-policy.ts');
const inMonorepo = fs.existsSync(envelopeFile) && fs.existsSync(serverEgress);
const hostFrame = path.resolve(here, '../../client/src/components/Plugins/PluginFrame.tsx');

describe.skipIf(!inMonorepo)('parity with the host', () => {
  it("the generated host facts match the server's envelope.ts", () => {
    // Not a regex scrape any more: server/scripts/gen-plugin-facts.ts imports envelope.ts
    // and writes src/generated/host-facts.ts, and its --check mode is a CI gate. This
    // asserts the checked-in artefact is the one the host would produce, so a standalone
    // publish (which has no server present) still ships the right list.
    //
    // Compared as whole maps, both ways round: asserting the artefact merely CONTAINS
    // each entry passed when the host grew a hook the artefact never learned about,
    // which is the drift that actually ships a wrong permission list.
    const envelope = fs.readFileSync(envelopeFile, 'utf8');
    const block = envelope.match(/HOOK_PERMISSION[^{]*\{([\s\S]*?)\n\}/);
    expect(block, 'HOOK_PERMISSION not found in envelope.ts').toBeTruthy();
    const theirs: Record<string, string> = {};
    for (const m of block![1].matchAll(/^\s*(\w+):\s*'([^']+)'/gm)) theirs[m[1]] = m[2];

    expect(theirs).toEqual({ ...HOOK_PERMISSION });
    expect(Object.keys(HOOK_PERMISSION).length).toBeGreaterThan(0);
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

describe.skipIf(!fs.existsSync(hostFrame))('parity with the host frame', () => {
  it('the session storage contract is one contract in all three copies', () => {
    // Nothing generates these: the limits are written out by hand in the SDK export
    // authors import, in the dev preview's inlined host, and in the real frame, because
    // the SDK ships standalone and cannot import across the package boundary. Bump one
    // and the preview happily stores what production then rejects.
    const frame = fs.readFileSync(hostFrame, 'utf8');
    const devServer = fs.readFileSync(path.resolve(here, '../src/cli/dev.ts'), 'utf8');

    expect(frame).toContain(`const PLUGIN_SESSION_MAX_KEYS = ${PLUGIN_SESSION_MAX_KEYS}`);
    expect(frame).toContain(`const PLUGIN_SESSION_MAX_KEY_LENGTH = ${PLUGIN_SESSION_MAX_KEY_LENGTH}`);
    expect(frame).toContain(`const PLUGIN_SESSION_MAX_VALUE_BYTES = ${PLUGIN_SESSION_MAX_VALUE_BYTES}`);
    expect(devServer).toContain(
      `SESSION_MAX_KEYS=${PLUGIN_SESSION_MAX_KEYS},SESSION_MAX_KEY_LENGTH=${PLUGIN_SESSION_MAX_KEY_LENGTH},SESSION_MAX_VALUE_BYTES=${PLUGIN_SESSION_MAX_VALUE_BYTES}`,
    );

    // Same for the codes a plugin branches on — a rename in one copy is a silent
    // behaviour change for anyone who developed against the other.
    for (const code of ['SESSION_INVALID_KEY', 'SESSION_INVALID_VALUE', 'SESSION_VALUE_TOO_LARGE', 'SESSION_KEY_LIMIT', 'NO_TRIP_CONTEXT', 'SESSION_STORAGE_ERROR']) {
      expect(frame, `${code} missing from the host frame`).toContain(`'${code}'`);
      expect(devServer, `${code} missing from the dev preview`).toContain(`"${code}"`);
    }
  });
});

describe.skipIf(!inMonorepo)('core event catalog', () => {
  it('event snapshot grants are known read permissions on known families', () => {
    expect(EVENT_FAMILIES.length).toBeGreaterThan(0);
    for (const [family, perm] of Object.entries(EVENT_SNAPSHOT_GRANT)) {
      expect(EVENT_FAMILIES).toContain(family);
      expect(KNOWN_PERMISSIONS).toContain(perm);
    }
  });
});
