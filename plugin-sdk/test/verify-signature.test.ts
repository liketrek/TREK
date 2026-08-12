/**
 * The SDK's author-signature verifier.
 *
 * It exists so `preflight` can answer the question the REGISTRY's CI will ask, before the
 * author opens the PR. That makes agreement with the other two implementations the entire
 * point: TREK's host verifier (server/src/nest/plugins/install/verify-signature.ts) and the
 * registry's port of it (TREK-Plugins scripts/lib/verify-signature.mjs). A gate that is
 * merely *similar* is worse than none — a green preflight is trusted, and an entry the
 * registry rejects is one nobody can install.
 */
import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { verifyAuthorSignature, checkSignatureShape, SignatureError } from '../src/cli/verify-signature.js';
import { generateKeypair, signArtifact, publicKeyBase64, loadPrivateKey } from '../src/cli/sign.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** A throwaway Ed25519 keypair, via the SDK's own keygen (not a hand-rolled one). */
function keypair(): { key: crypto.KeyObject; pub: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-sig-'));
  const keyPath = path.join(dir, 'signing.key');
  generateKeypair(keyPath);
  const key = loadPrivateKey(keyPath);
  return { key, pub: publicKeyBase64(key) };
}

const BYTES = Buffer.from('a plugin artifact, pretend this is a zip');

describe('verifyAuthorSignature', () => {
  // The round-trip that actually ships: `sign` emits a bare 64-byte signature over the raw
  // bytes and `keygen` a bare 32-byte key, and all three verifiers must accept that pair.
  it('accepts what the SDK itself signs', () => {
    const { key, pub } = keypair();
    expect(verifyAuthorSignature(BYTES, signArtifact(BYTES, key), pub)).toBe(true);
  });

  it('rejects a signature over DIFFERENT bytes (a re-pack after signing)', () => {
    const { key, pub } = keypair();
    const sig = signArtifact(BYTES, key);
    expect(verifyAuthorSignature(Buffer.concat([BYTES, Buffer.from('!')]), sig, pub)).toBe(false);
  });

  it('rejects a signature made with a DIFFERENT key', () => {
    const a = keypair();
    const b = keypair();
    expect(verifyAuthorSignature(BYTES, signArtifact(BYTES, a.key), b.pub)).toBe(false);
  });

  // A well-formed-but-wrong signature returns false; a MALFORMED one throws. The host draws
  // exactly this line (SignatureError vs a false return), and the registry mirrors it — both
  // end up refusing the install, but only the throw carries a "your key is garbage" message.
  it('throws SignatureError on a malformed key or signature, rather than returning false', () => {
    const { key, pub } = keypair();
    const sig = signArtifact(BYTES, key);
    expect(() => verifyAuthorSignature(BYTES, sig, 'not-base64-at-all!!')).toThrow(SignatureError);
    expect(() => verifyAuthorSignature(BYTES, 'AAAA', pub)).toThrow(SignatureError);
    expect(() => verifyAuthorSignature(BYTES, sig, '')).toThrow(SignatureError);
  });

  // The two-line minisign form, which an author may paste in from a `minisign` keypair. The
  // comment line must be skipped rather than parsed as the payload.
  it('accepts a minisign-style key with an "untrusted comment" line', () => {
    const { key, pub } = keypair();
    const sig = signArtifact(BYTES, key);
    const twoLine = `untrusted comment: minisign public key ABC\n${pub}\n`;
    expect(verifyAuthorSignature(BYTES, sig, twoLine)).toBe(true);
  });
});

describe('checkSignatureShape', () => {
  it('passes an entry that is unsigned throughout, and one that is fully signed', () => {
    const { key, pub } = keypair();
    const sig = signArtifact(BYTES, key);
    expect(checkSignatureShape({ versions: [{ version: '1.0.0' }] })).toEqual([]);
    expect(checkSignatureShape({ authorPublicKey: pub, versions: [{ version: '1.0.0', signature: sig }] })).toEqual([]);
  });

  // Both halves of a half-signed entry. TREK refuses to install either ("incomplete
  // signature: an author key and a version signature must both be present"), so merging one
  // ships an entry nobody can use — the point is to catch it before the PR, not at review.
  it('refuses a signature with no key', () => {
    const { key } = keypair();
    const problems = checkSignatureShape({ versions: [{ version: '1.0.0', signature: signArtifact(BYTES, key) }] });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/no authorPublicKey/);
  });

  it('refuses a key with no signed version', () => {
    const { pub } = keypair();
    const problems = checkSignatureShape({ authorPublicKey: pub, versions: [{ version: '1.0.0' }] });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/no version carries a signature/);
  });

  it('reports a malformed key and a malformed signature by name', () => {
    const { key, pub } = keypair();
    expect(checkSignatureShape({ authorPublicKey: 'nonsense', versions: [{ version: '1.0.0', signature: signArtifact(BYTES, key) }] })[0])
      .toMatch(/authorPublicKey is not a valid/);
    expect(checkSignatureShape({ authorPublicKey: pub, versions: [{ version: '2.1.0', signature: 'AAAA' }] })[0])
      .toMatch(/2\.1\.0: signature is malformed/);
  });
});
