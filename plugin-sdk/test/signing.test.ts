/**
 * Signing: the guard, and what it refuses to let you do.
 *
 * The PROMPT is interactive and not worth mocking a TTY for. The guard is the part that matters,
 * because of what it prevents: a plugin that shipped signed and then publishes unsigned is refused
 * by TREK on every instance that already has it (registry.service.ts, SIGNATURE_MISSING) — and
 * before this, `preflight` caught that at step 4, AFTER the immutable GitHub release was cut. The
 * author's tag was burned for a problem that was knowable before a single byte was packed.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertSigningAllowed, type SigningState } from '../src/cli/signing.js';
import { generateKeypair } from '../src/cli/sign.js';

const state = (over: Partial<SigningState> = {}): SigningState => ({
  hasKey: false,
  keyPath: '/home/someone/.trek-plugin/signing.key',
  publishedSigned: false,
  ...over,
});

describe('assertSigningAllowed', () => {
  it('allows an unsigned publish of a plugin that was never published signed', () => {
    expect(() => assertSigningAllowed(state(), undefined)).not.toThrow();
  });

  it('allows an unsigned publish even when a key happens to exist — signing stays a choice', () => {
    // Having a key on the machine is not consent to sign. An author may keep one for another plugin.
    expect(() => assertSigningAllowed(state({ hasKey: true }), undefined)).not.toThrow();
  });

  it('allows a signed publish of a plugin that was published signed', () => {
    const s = state({ hasKey: true, publishedSigned: true, publishedKey: 'abc' });
    expect(() => assertSigningAllowed(s, s.keyPath)).not.toThrow();
  });

  it('REFUSES an unsigned publish of a plugin that was published signed', () => {
    const s = state({ hasKey: true, publishedSigned: true, publishedKey: 'abc' });
    expect(() => assertSigningAllowed(s, undefined)).toThrow(/published SIGNED/i);
    // The fix has to be actionable, and it has to name the key it found.
    expect(() => assertSigningAllowed(s, undefined)).toThrow(/--sign/);
    expect(() => assertSigningAllowed(s, undefined)).toThrow(new RegExp(s.keyPath));
  });

  it('explains the lost-key case rather than telling you to pass a flag you cannot honour', () => {
    // Telling an author with no key to "re-run with --sign" is advice they cannot take. The key is
    // gone; the only route left is a registry maintainer override, and saying so is the whole value.
    const s = state({ hasKey: false, publishedSigned: true, publishedKey: 'abc' });
    const run = () => assertSigningAllowed(s, undefined);
    expect(run).toThrow(/LOST it/i);
    expect(run).toThrow(/allow-key-change/);
    expect(run).not.toThrow(/Re-run with --sign/);
  });
});

describe('assertSigningAllowed — key identity (catch a rotation BEFORE the release is cut)', () => {
  let tmp: string;
  let publishedKeyPath: string;
  let publishedKey: string;
  let otherKeyPath: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'signing-identity-'));
    publishedKeyPath = path.join(tmp, 'published.key');
    publishedKey = generateKeypair(publishedKeyPath).publicKey;
    otherKeyPath = path.join(tmp, 'other.key');
    generateKeypair(otherKeyPath);
  });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  const signedState = (): SigningState => ({
    hasKey: true, keyPath: publishedKeyPath, publishedSigned: true, publishedKey,
  });

  it('allows signing with the exact key the plugin was published under', () => {
    expect(() => assertSigningAllowed(signedState(), publishedKeyPath)).not.toThrow();
  });

  it('REFUSES a DIFFERENT key than the published one — and names the rotation path', () => {
    // Without this, the mismatch surfaces at preflight/submit, AFTER the immutable release is
    // cut. Same trap as the unsigned-update case; same fix: fail at step 1.
    const run = () => assertSigningAllowed(signedState(), otherKeyPath);
    expect(run).toThrow(/different key|differs/i);
    expect(run).toThrow(/--allow-key-change/);
    expect(run).toThrow(/rotate-key/);
  });

  it('lets a deliberate rotation through with allowKeyChange', () => {
    expect(() => assertSigningAllowed(signedState(), otherKeyPath, { allowKeyChange: true })).not.toThrow();
  });

  it('an unreadable key file is not an identity mismatch — downstream has the better error', () => {
    // The guard must never invent a "wrong key" refusal out of a missing file: `entry`/`sign`
    // report a missing key with the keygen hint, which is the actionable message.
    expect(() => assertSigningAllowed(signedState(), path.join(tmp, 'nope.key'))).not.toThrow();
  });
});
