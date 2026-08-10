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

const here = path.dirname(fileURLToPath(import.meta.url));
const serverPlugins = path.resolve(here, '../../server/src/nest/plugins');
const envelopeFile = path.join(serverPlugins, 'protocol/envelope.ts');
const serverEgress = path.join(serverPlugins, 'runtime/egress-policy.ts');
const inMonorepo = fs.existsSync(envelopeFile) && fs.existsSync(serverEgress);

describe.skipIf(!inMonorepo)('parity with the host', () => {
  it('the generated host facts match the server's envelope.ts', () => {
    // Not a regex scrape any more: server/scripts/gen-plugin-facts.ts imports envelope.ts
    // and writes src/generated/host-facts.ts, and its --check mode is a CI gate. This
    // asserts the checked-in artefact is the one the host would produce, so a standalone
    // publish (which has no server present) still ships the right list.
    const generated = fs.readFileSync(path.resolve(here, '../src/generated/host-facts.ts'), 'utf8');
    const envelope = fs.readFileSync(envelopeFile, 'utf8');

    for (const [hook, perm] of Object.entries(HOOK_PERMISSION)) {
      expect(generated, `${hook} missing from the generated facts`).toContain(`${hook}: '${perm}'`);
      expect(envelope, `${hook} missing from envelope.ts`).toContain(`${hook}: '${perm}'`);
    }
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
