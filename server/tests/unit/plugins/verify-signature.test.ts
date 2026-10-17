/**
 * Author-signature verification (#plugins, #4). Ed25519 via node:crypto, in the
 * minisign shapes TREK accepts: bare raw key+sig, minisign legacy ('Ed', signs
 * the file), and minisign prehashed ('ED', signs BLAKE2b-512 of the file).
 */
import { verifyAuthorSignature, SignatureError } from '../../../src/nest/plugins/install/verify-signature';

import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';

// A raw Ed25519 keypair, exported as the 32-byte raw public key + a signer.
function makeKeypair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const rawPub = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32); // last 32 bytes = the key
  return {
    rawPub,
    sign: (msg: Buffer) => crypto.sign(null, msg, privateKey),
  };
}

const KEY_ID = Buffer.from('0011223344556677', 'hex');
const b64 = (b: Buffer) => b.toString('base64');

describe('verifyAuthorSignature', () => {
  const bytes = Buffer.from('the exact plugin.zip bytes');

  it('accepts a bare raw Ed25519 key + 64-byte signature over the file', () => {
    const { rawPub, sign } = makeKeypair();
    expect(verifyAuthorSignature(bytes, b64(sign(bytes)), b64(rawPub))).toBe(true);
  });

  it('rejects a valid signature from a different key', () => {
    const a = makeKeypair();
    const b = makeKeypair();
    expect(verifyAuthorSignature(bytes, b64(a.sign(bytes)), b64(b.rawPub))).toBe(false);
  });

  it('rejects a signature over tampered bytes', () => {
    const { rawPub, sign } = makeKeypair();
    const sig = b64(sign(bytes));
    expect(verifyAuthorSignature(Buffer.from('tampered'), sig, b64(rawPub))).toBe(false);
  });

  it('verifies the minisign legacy format (Ed — signs the raw file)', () => {
    const { rawPub, sign } = makeKeypair();
    const pub = b64(Buffer.concat([Buffer.from('Ed'), KEY_ID, rawPub]));
    const sig = b64(Buffer.concat([Buffer.from('Ed'), KEY_ID, sign(bytes)]));
    expect(verifyAuthorSignature(bytes, sig, pub)).toBe(true);
  });

  it('verifies the minisign prehashed format (ED — signs BLAKE2b-512 of the file)', () => {
    const { rawPub, sign } = makeKeypair();
    const hash = crypto.createHash('blake2b512').update(bytes).digest();
    const pub = b64(Buffer.concat([Buffer.from('Ed'), KEY_ID, rawPub]));
    const sig = b64(Buffer.concat([Buffer.from('ED'), KEY_ID, sign(hash)]));
    expect(verifyAuthorSignature(bytes, sig, pub)).toBe(true);
  });

  it('rejects when the key ids in key and signature disagree', () => {
    const { rawPub, sign } = makeKeypair();
    const pub = b64(Buffer.concat([Buffer.from('Ed'), KEY_ID, rawPub]));
    const otherId = Buffer.from('8899aabbccddeeff', 'hex');
    const sig = b64(Buffer.concat([Buffer.from('Ed'), otherId, sign(bytes)]));
    expect(verifyAuthorSignature(bytes, sig, pub)).toBe(false);
  });

  it('parses a two-line minisign key (comment + base64)', () => {
    const { rawPub, sign } = makeKeypair();
    const pub = `untrusted comment: minisign public key ABC\n${b64(Buffer.concat([Buffer.from('Ed'), KEY_ID, rawPub]))}`;
    const sig = `untrusted comment: signature\n${b64(Buffer.concat([Buffer.from('Ed'), KEY_ID, sign(bytes)]))}`;
    expect(verifyAuthorSignature(bytes, sig, pub)).toBe(true);
  });

  it('throws SignatureError on a malformed key', () => {
    expect(() => verifyAuthorSignature(bytes, b64(Buffer.alloc(64)), b64(Buffer.alloc(7)))).toThrow(SignatureError);
  });

  it('throws SignatureError on a malformed signature', () => {
    const { rawPub } = makeKeypair();
    expect(() => verifyAuthorSignature(bytes, b64(Buffer.alloc(10)), b64(rawPub))).toThrow(SignatureError);
  });
});
