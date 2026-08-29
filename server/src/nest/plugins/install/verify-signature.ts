import crypto from 'node:crypto';

/**
 * Author-signature verification for the plugin installer (#plugins, #4).
 *
 * sha256 pinning proves the bytes match what the REGISTRY vouches for; a whoever
 * controls the registry repo controls that. A minisign (Ed25519) author
 * signature proves the bytes were signed by the holder of the plugin AUTHOR's
 * private key — so a compromised registry cannot ship attacker code under an
 * author's name without also stealing that key. TREK verifies offline with
 * node:crypto (no Fulcio/Rekor phone-home), consistent with the "no telemetry
 * beyond the update check" stance.
 *
 * Signing is OPT-IN: an entry without an author key + signature installs exactly
 * as before (sha256 only). When both are present, verification is mandatory and
 * a mismatch aborts the install.
 */

// SPKI DER prefix for a raw 32-byte Ed25519 public key (RFC 8410).
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

export class SignatureError extends Error {}

/** Wrap a raw 32-byte Ed25519 public key as a node KeyObject. */
function ed25519KeyFromRaw(raw: Buffer): crypto.KeyObject {
  if (raw.length !== 32) throw new SignatureError('public key is not a 32-byte Ed25519 key');
  return crypto.createPublicKey({ key: Buffer.concat([ED25519_SPKI_PREFIX, raw]), format: 'der', type: 'spki' });
}

/**
 * Parse a minisign public key. Accepts either the two-line minisign format
 * (comment line + base64 payload) or a bare base64 payload. The 10-byte payload
 * header is `Ed` + an 8-byte key id; the trailing 32 bytes are the Ed25519 key.
 * A bare 32-byte base64 key (44 chars) is also accepted for simple deployments.
 */
function parseMinisignPubKey(pub: string): { key: crypto.KeyObject; keyId: Buffer | null } {
  const line = pub
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('untrusted comment'))
    .pop();
  if (!line) throw new SignatureError('empty public key');
  const buf = Buffer.from(line, 'base64');
  if (buf.length === 32) return { key: ed25519KeyFromRaw(buf), keyId: null };
  if (buf.length === 42 && buf.subarray(0, 2).toString('latin1') === 'Ed') {
    return { key: ed25519KeyFromRaw(buf.subarray(10)), keyId: buf.subarray(2, 10) };
  }
  throw new SignatureError('unrecognized public key format');
}

/**
 * Parse a minisign signature (.minisig). The relevant line is the first base64
 * payload: 2-byte algorithm (`Ed` legacy | `ED` prehashed) + 8-byte key id +
 * 64-byte Ed25519 signature. A bare 64-byte base64 signature (legacy over the
 * raw bytes) is also accepted.
 */
function parseMinisignSignature(sig: string): { algo: 'Ed' | 'ED' | 'raw'; keyId: Buffer | null; signature: Buffer } {
  const line = sig
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('untrusted comment'))
    .shift();
  if (!line) throw new SignatureError('empty signature');
  const buf = Buffer.from(line, 'base64');
  if (buf.length === 64) return { algo: 'raw', keyId: null, signature: buf };
  if (buf.length === 74) {
    const algo = buf.subarray(0, 2).toString('latin1');
    if (algo !== 'Ed' && algo !== 'ED') throw new SignatureError(`unsupported signature algorithm ${algo}`);
    return { algo, keyId: buf.subarray(2, 10), signature: buf.subarray(10) };
  }
  throw new SignatureError('unrecognized signature format');
}

/**
 * Verify that `bytes` were signed by the holder of `publicKeyB64`'s private key.
 * Supports minisign legacy (`Ed`, signs the raw file) and prehashed (`ED`, signs
 * BLAKE2b-512 of the file), plus bare raw Ed25519 over the file bytes. Returns
 * true on a valid signature, throws SignatureError on a malformed input, and
 * returns false on a well-formed but non-matching signature.
 */
export function verifyAuthorSignature(bytes: Buffer, signatureB64: string, publicKeyB64: string): boolean {
  const { key, keyId } = parseMinisignPubKey(publicKeyB64);
  const { algo, keyId: sigKeyId, signature } = parseMinisignSignature(signatureB64);

  // If both carry a key id, they must match the same key (catches a wrong-key mixup).
  if (keyId && sigKeyId && !keyId.equals(sigKeyId)) return false;

  const message = algo === 'ED' ? crypto.createHash('blake2b512').update(bytes).digest() : bytes;
  try {
    return crypto.verify(null, message, key, signature);
  } catch {
    return false;
  }
}
