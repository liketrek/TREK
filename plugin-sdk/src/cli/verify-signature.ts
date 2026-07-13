/**
 * Author-signature verification for `trek-plugin preflight`.
 *
 * This is a port of TREK's installer-side verifier (server/src/nest/plugins/install/
 * verify-signature.ts), and of the registry's port of it (TREK-Plugins'
 * scripts/lib/verify-signature.mjs). All three MUST accept exactly the same inputs.
 *
 * The point of preflight is to tell an author what the registry's CI would say before
 * they open the PR. `sign.ts`'s verifyArtifact only understands the bare key/signature
 * pair the SDK itself emits, so it cannot answer that question for a minisign key — and
 * a preflight that says "green" on a signature the registry would reject is worse than
 * no preflight at all, because the author trusts it.
 *
 * node:crypto only, like the rest of the SDK.
 */
import crypto from 'node:crypto';

// SPKI DER prefix for a raw 32-byte Ed25519 public key (RFC 8410).
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

export class SignatureError extends Error {}

/** Wrap a raw 32-byte Ed25519 public key as a node KeyObject. */
function ed25519KeyFromRaw(raw: Buffer): crypto.KeyObject {
  if (raw.length !== 32) throw new SignatureError('public key is not a 32-byte Ed25519 key');
  return crypto.createPublicKey({ key: Buffer.concat([ED25519_SPKI_PREFIX, raw]), format: 'der', type: 'spki' });
}

/**
 * Parse a minisign public key: either the two-line minisign format (comment + base64
 * payload) or a bare base64 payload. The 10-byte payload header is `Ed` + an 8-byte key
 * id; the trailing 32 bytes are the key. A bare 32-byte base64 key (what `keygen` emits)
 * is also accepted.
 */
function parseMinisignPubKey(pub: string): { key: crypto.KeyObject; keyId: Buffer | null } {
  const line = pub.trim().split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('untrusted comment')).pop();
  if (!line) throw new SignatureError('empty public key');
  const buf = Buffer.from(line, 'base64');
  if (buf.length === 32) return { key: ed25519KeyFromRaw(buf), keyId: null };
  if (buf.length === 42 && buf.subarray(0, 2).toString('latin1') === 'Ed') {
    return { key: ed25519KeyFromRaw(buf.subarray(10)), keyId: buf.subarray(2, 10) };
  }
  throw new SignatureError('unrecognized public key format');
}

/**
 * Parse a minisign signature: 2-byte algorithm (`Ed` legacy | `ED` prehashed) + 8-byte
 * key id + 64-byte signature. A bare 64-byte base64 signature (what `sign` emits, over
 * the raw artifact bytes) is also accepted.
 */
function parseMinisignSignature(sig: string): { algo: 'Ed' | 'ED' | 'raw'; keyId: Buffer | null; signature: Buffer } {
  const line = sig.trim().split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('untrusted comment')).shift();
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
 * Verify that `bytes` were signed by the holder of `publicKeyB64`'s private key. Returns
 * true on a valid signature, false on a well-formed but non-matching one, and throws
 * SignatureError on malformed input.
 */
export function verifyAuthorSignature(bytes: Buffer, signatureB64: string, publicKeyB64: string): boolean {
  const { key, keyId } = parseMinisignPubKey(publicKeyB64);
  const { algo, keyId: sigKeyId, signature } = parseMinisignSignature(signatureB64);

  // If both carry a key id, they must name the same key (catches a wrong-key mixup).
  if (keyId && sigKeyId && !keyId.equals(sigKeyId)) return false;

  const message = algo === 'ED' ? crypto.createHash('blake2b512').update(bytes).digest() : bytes;
  try {
    return crypto.verify(null, message, key, signature);
  } catch {
    return false;
  }
}

/**
 * Structural check that needs no artifact (and so no network): a key and a signature must
 * be both-present or both-absent, and each must parse.
 *
 * TREK refuses to install a half-signed entry ("incomplete signature: an author key and a
 * version signature must both be present"), so such an entry is dead on arrival. Mirrors
 * the registry's checkSignatureShape. Returns a list of problems (empty === fine).
 */
export function checkSignatureShape(entry: { authorPublicKey?: string; versions?: Array<{ version: string; signature?: string }> }): string[] {
  const problems: string[] = [];
  const key = entry.authorPublicKey;
  const versions = Array.isArray(entry.versions) ? entry.versions : [];

  if (key) {
    try {
      parseMinisignPubKey(key);
    } catch (e) {
      problems.push(`authorPublicKey is not a valid Ed25519/minisign public key: ${(e as Error).message}`);
    }
  }

  for (const v of versions) {
    if (v.signature && !key) {
      problems.push(`${v.version}: has a signature but the entry has no authorPublicKey — TREK refuses to install a half-signed entry`);
    }
    if (v.signature) {
      try {
        parseMinisignSignature(v.signature);
      } catch (e) {
        problems.push(`${v.version}: signature is malformed: ${(e as Error).message}`);
      }
    }
  }

  // A key with no signed version at all is a publishing mistake: TREK pins the key on
  // first install and then requires every later version to be signed by it.
  if (key && versions.length && !versions.some((v) => v.signature)) {
    problems.push('authorPublicKey is set but no version carries a signature — either sign the release or drop the key');
  }

  return problems;
}
