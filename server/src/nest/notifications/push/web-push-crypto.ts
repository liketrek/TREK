import {
  createCipheriv,
  createECDH,
  createPrivateKey,
  ECDH,
  generateKeyPairSync,
  hkdfSync,
  randomBytes,
  type KeyObject,
} from 'node:crypto';
import jwt from 'jsonwebtoken';
import { decodeBase64Url } from '../../../app-config';

/**
 * Web Push message encryption (RFC 8291, `aes128gcm` from RFC 8188) and the
 * VAPID Authorization header (RFC 8292), on node:crypto and the jsonwebtoken
 * the server already signs its sessions with.
 *
 * Pure: no database, no network, no DI. The `web-push` package does the same
 * arithmetic, but it posts through its own https.request and so past the SSRF
 * guard; the request is the part this domain has to own, and what is left of
 * the package is this file.
 */

/** Record size announced in the header. One record carries the whole message. */
export const PUSH_RECORD_SIZE = 4096;

const P256_POINT_BYTES = 65;
const AUTH_SECRET_BYTES = 16;
const SALT_BYTES = 16;
const GCM_TAG_BYTES = 16;
/** salt (16) + rs (4) + idlen (1) + keyid (the 65-byte sender key). */
const HEADER_BYTES = SALT_BYTES + 4 + 1 + P256_POINT_BYTES;

const KEY_INFO_PREFIX = Buffer.from('WebPush: info\0', 'latin1');
const CEK_INFO = Buffer.from('Content-Encoding: aes128gcm\0', 'latin1');
const NONCE_INFO = Buffer.from('Content-Encoding: nonce\0', 'latin1');
/** Padding delimiter of the last (here: only) record, RFC 8188 section 2. */
const LAST_RECORD_DELIMITER = Buffer.from([0x02]);

/** Largest plaintext that still fits one record next to its delimiter and tag. */
export const MAX_PUSH_PLAINTEXT_BYTES = PUSH_RECORD_SIZE - HEADER_BYTES - 1 - GCM_TAG_BYTES;

/**
 * How long a VAPID token is good for. RFC 8292 allows up to 24 hours and Apple
 * refuses anything longer, so this stays well inside it.
 */
export const VAPID_TOKEN_TTL_SECONDS = 12 * 60 * 60;

/** A VAPID key pair in the form browsers and the Web Push tools use: base64url, raw. */
export interface VapidKeyPair {
  /** Uncompressed P-256 point, 65 bytes. What the browser subscribes with. */
  publicKey: string;
  /** The 32-byte private scalar. */
  privateKey: string;
}

/** The two secrets a browser hands over with its subscription. */
export interface PushEncryptionKeys {
  /** The browser's P-256 public key, uncompressed. */
  p256dh: Buffer;
  /** The 16-byte authentication secret. */
  auth: Buffer;
}

/**
 * Fixed inputs for the RFC 8291 test vector. Leave both unset for real
 * messages: every message needs a fresh salt and a fresh sender key, or the
 * same key and nonce would encrypt two plaintexts.
 */
export interface PushEncryptionOptions {
  salt?: Buffer;
  senderPrivateKey?: Buffer;
}

function hkdf(ikm: Buffer, salt: Buffer, info: Buffer, length: number): Buffer {
  return Buffer.from(hkdfSync('sha256', ikm, salt, info, length));
}

/** True for a point that is actually on P-256, not just 65 bytes that start with 0x04. */
export function isP256Point(bytes: Buffer): boolean {
  if (bytes.length !== P256_POINT_BYTES || bytes[0] !== 0x04) return false;
  try {
    ECDH.convertKey(bytes, 'prime256v1');
    return true;
  } catch {
    return false;
  }
}

/** A fresh P-256 pair. Exported as JWK so both halves come out at full length. */
export function generateVapidKeyPair(): VapidKeyPair {
  const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const { x, y, d } = privateKey.export({ format: 'jwk' });
  if (!x || !y || !d) throw new Error('P-256 key export did not produce x, y and d');
  return {
    publicKey: Buffer.concat([Buffer.from([0x04]), Buffer.from(x, 'base64url'), Buffer.from(y, 'base64url')]).toString(
      'base64url',
    ),
    privateKey: d,
  };
}

/** The public key a private scalar belongs to, or null when the scalar is not a usable P-256 key. */
export function derivePublicKey(privateKey: string): Buffer | null {
  const scalar = decodeBase64Url(privateKey);
  if (scalar?.length !== 32) return null;
  try {
    const ecdh = createECDH('prime256v1');
    ecdh.setPrivateKey(scalar);
    return ecdh.getPublicKey();
  } catch {
    return null;
  }
}

/** Whether the two halves belong together. Compared as bytes, so padding and the like do not matter. */
export function isVapidKeyPair(publicKey: string, privateKey: string): boolean {
  const expected = derivePublicKey(privateKey);
  const given = decodeBase64Url(publicKey);
  return !!expected && !!given && given.equals(expected);
}

/**
 * Encrypt one push message for one browser (RFC 8291 section 3.4): ECDH with
 * the browser key, HKDF over the shared secret and the auth secret, then a
 * single AES-128-GCM record behind the aes128gcm header, whose key id is the
 * sender's public key.
 */
export function encryptPushMessage(
  plaintext: Buffer,
  keys: PushEncryptionKeys,
  options: PushEncryptionOptions = {},
): Buffer {
  if (!isP256Point(keys.p256dh)) throw new Error('p256dh is not an uncompressed P-256 public key');
  if (keys.auth.length !== AUTH_SECRET_BYTES) throw new Error('auth secret must be 16 bytes');
  if (plaintext.length > MAX_PUSH_PLAINTEXT_BYTES) {
    throw new Error(`push payload of ${plaintext.length} bytes does not fit one record`);
  }

  const salt = options.salt ?? randomBytes(SALT_BYTES);
  if (salt.length !== SALT_BYTES) throw new Error('salt must be 16 bytes');
  const sender = createECDH('prime256v1');
  if (options.senderPrivateKey) sender.setPrivateKey(options.senderPrivateKey);
  else sender.generateKeys();
  const senderPublicKey = sender.getPublicKey();

  const ecdhSecret = sender.computeSecret(keys.p256dh);
  const keyInfo = Buffer.concat([KEY_INFO_PREFIX, keys.p256dh, senderPublicKey]);
  const ikm = hkdf(ecdhSecret, keys.auth, keyInfo, 32);
  const contentKey = hkdf(ikm, salt, CEK_INFO, 16);
  const nonce = hkdf(ikm, salt, NONCE_INFO, 12);

  const cipher = createCipheriv('aes-128-gcm', contentKey, nonce);
  const record = Buffer.concat([
    cipher.update(plaintext),
    cipher.update(LAST_RECORD_DELIMITER),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  const header = Buffer.alloc(SALT_BYTES + 4 + 1);
  salt.copy(header, 0);
  header.writeUInt32BE(PUSH_RECORD_SIZE, SALT_BYTES);
  header.writeUInt8(senderPublicKey.length, SALT_BYTES + 4);
  return Buffer.concat([header, senderPublicKey, record]);
}

/** The signing key, and the public key re-encoded the way the `k=` parameter wants it (no padding). */
function vapidSigningKey(keys: VapidKeyPair): { signingKey: KeyObject; publicKey: string } {
  const point = decodeBase64Url(keys.publicKey);
  const scalar = decodeBase64Url(keys.privateKey);
  if (point?.length !== P256_POINT_BYTES || scalar?.length !== 32) throw new Error('VAPID key pair is malformed');
  const signingKey = createPrivateKey({
    key: {
      kty: 'EC',
      crv: 'P-256',
      x: point.subarray(1, 33).toString('base64url'),
      y: point.subarray(33).toString('base64url'),
      d: scalar.toString('base64url'),
    },
    format: 'jwk',
  });
  return { signingKey, publicKey: point.toString('base64url') };
}

/**
 * Returns a function that builds the Authorization header for an endpoint
 * (RFC 8292): `vapid t=<ES256 JWT>, k=<public key>`, the token's audience being
 * the endpoint's origin. Tokens are reused per origin for the life of the
 * signer, which is one delivery, so a user with three Chrome devices signs once.
 */
export function createVapidSigner(keys: VapidKeyPair, subject: string, now: () => number = Date.now) {
  const { signingKey, publicKey } = vapidSigningKey(keys);
  const byOrigin = new Map<string, string>();
  return (endpoint: string): string => {
    const audience = new URL(endpoint).origin;
    let header = byOrigin.get(audience);
    if (!header) {
      const token = jwt.sign(
        { aud: audience, exp: Math.floor(now() / 1000) + VAPID_TOKEN_TTL_SECONDS, sub: subject },
        signingKey,
        // The three claims RFC 8292 names and nothing else: an extra iat buys
        // nothing and is one more thing a strict push service could object to.
        { algorithm: 'ES256', noTimestamp: true },
      );
      header = `vapid t=${token}, k=${publicKey}`;
      byOrigin.set(audience, header);
    }
    return header;
  };
}

export type VapidSigner = ReturnType<typeof createVapidSigner>;
