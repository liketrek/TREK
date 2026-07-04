/**
 * Author signing for plugins (#plugins). Optional trust-on-first-use identity:
 * you sign your plugin.zip with an Ed25519 key, publish the public key once in
 * the registry entry (`authorPublicKey`) and a per-version `signature`, and TREK
 * pins your key on first install — a later unsigned or wrong-key update is then
 * refused.
 *
 * Fully dependency-free: Node's `crypto` does raw Ed25519. The output matches
 * exactly what the server verifies — a bare 64-byte Ed25519 signature over the
 * raw artifact bytes (base64), and a bare 32-byte public key (base64). See the
 * server's install/verify-signature.ts.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

/** Default key location — outside the project so it's never committed by accident. */
export function defaultKeyPath(): string {
  return path.join(os.homedir(), '.trek-plugin', 'signing.key');
}

/** Generate an Ed25519 signing key, write the PRIVATE key (PEM) to keyPath, return its base64 public key. */
export function generateKeypair(keyPath: string): { publicKey: string; keyPath: string } {
  if (fs.existsSync(keyPath)) {
    throw new Error(`a key already exists at ${keyPath} — refusing to overwrite it (delete it yourself if you really mean to)`);
  }
  const { privateKey } = crypto.generateKeyPairSync('ed25519');
  const pem = privateKey.export({ format: 'pem', type: 'pkcs8' }) as string;
  fs.mkdirSync(path.dirname(keyPath), { recursive: true });
  fs.writeFileSync(keyPath, pem, { mode: 0o600 });
  try { fs.chmodSync(keyPath, 0o600); } catch { /* windows: best effort */ }
  return { publicKey: publicKeyBase64(privateKey), keyPath };
}

/** Load an Ed25519 private key from a PEM file. */
export function loadPrivateKey(keyPath: string): crypto.KeyObject {
  if (!fs.existsSync(keyPath)) {
    throw new Error(`no signing key at ${keyPath} — run \`trek-plugin keygen\` first (or pass --key <file>)`);
  }
  const key = crypto.createPrivateKey(fs.readFileSync(keyPath, 'utf8'));
  if (key.asymmetricKeyType !== 'ed25519') throw new Error(`key at ${keyPath} is not an Ed25519 key`);
  return key;
}

/** Base64 of the raw 32-byte Ed25519 public key — the registry entry's `authorPublicKey`. */
export function publicKeyBase64(privateKey: crypto.KeyObject): string {
  const der = crypto.createPublicKey(privateKey).export({ format: 'der', type: 'spki' }) as Buffer;
  // SPKI DER for Ed25519 is a fixed 12-byte prefix + the 32-byte key.
  return der.subarray(der.length - 32).toString('base64');
}

/** Sign the raw artifact bytes; returns base64 of the bare 64-byte Ed25519 signature — a version's `signature`. */
export function signArtifact(bytes: Buffer, privateKey: crypto.KeyObject): string {
  return crypto.sign(null, bytes, privateKey).toString('base64');
}

/** Self-check: verify a signature the way the server does (bare raw Ed25519 over the bytes). */
export function verifyArtifact(bytes: Buffer, signatureB64: string, publicKeyB64: string): boolean {
  try {
    const raw = Buffer.from(publicKeyB64, 'base64');
    if (raw.length !== 32) return false;
    const spki = Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), raw]);
    const key = crypto.createPublicKey({ key: spki, format: 'der', type: 'spki' });
    const sig = Buffer.from(signatureB64, 'base64');
    if (sig.length !== 64) return false;
    return crypto.verify(null, bytes, key, sig);
  } catch {
    return false;
  }
}
