/**
 * RFC 8291 message encryption and RFC 8292 VAPID headers (WPCRYPTO-*).
 *
 * The encryption is pinned twice: byte for byte against the worked example in
 * RFC 8291 Appendix A, and by a decrypt written here from the receiving side,
 * the way a browser unwraps the message, for fresh keys and salts.
 */
import { describe, it, expect } from 'vitest';
import { createDecipheriv, createECDH, createPublicKey, hkdfSync, type ECDH } from 'node:crypto';
import jwt from 'jsonwebtoken';
import {
  MAX_PUSH_PLAINTEXT_BYTES,
  PUSH_RECORD_SIZE,
  VAPID_TOKEN_TTL_SECONDS,
  createVapidSigner,
  derivePublicKey,
  encryptPushMessage,
  generateVapidKeyPair,
  isP256Point,
  isVapidKeyPair,
} from '../../../../src/nest/notifications/push/web-push-crypto';

const b64 = (value: string) => Buffer.from(value, 'base64url');

// RFC 8291 Appendix A.
const RFC = {
  plaintext: b64('V2hlbiBJIGdyb3cgdXAsIEkgd2FudCB0byBiZSBhIHdhdGVybWVsb24'),
  asPublic: 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',
  asPrivate: b64('yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw'),
  uaPublic: b64('BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4'),
  uaPrivate: b64('q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94'),
  salt: b64('DGv6ra1nlYgDCS1FRnbzlw'),
  auth: b64('BTBZMqHH6r4Tts7J_aSIgg'),
  // Section 5, the message body as sent (the three lines of the RFC joined).
  body:
    'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27ml' +
    'mlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPT' +
    'pK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN',
};

/** The receiving side of RFC 8291, independent of the module under test. */
function decrypt(body: Buffer, ua: ECDH, auth: Buffer): { plaintext: Buffer; rs: number; keyId: Buffer } {
  const salt = body.subarray(0, 16);
  const rs = body.readUInt32BE(16);
  const idlen = body[20];
  const keyId = body.subarray(21, 21 + idlen);
  const record = body.subarray(21 + idlen);
  const secret = ua.computeSecret(keyId);
  const keyInfo = Buffer.concat([Buffer.from('WebPush: info\0'), ua.getPublicKey(), keyId]);
  const ikm = Buffer.from(hkdfSync('sha256', secret, auth, keyInfo, 32));
  const cek = Buffer.from(hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16));
  const nonce = Buffer.from(hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12));
  const decipher = createDecipheriv('aes-128-gcm', cek, nonce);
  decipher.setAuthTag(record.subarray(record.length - 16));
  const padded = Buffer.concat([decipher.update(record.subarray(0, record.length - 16)), decipher.final()]);
  let end = padded.length - 1;
  while (end >= 0 && padded[end] === 0) end--;
  expect(padded[end]).toBe(0x02); // the last-record delimiter
  return { plaintext: padded.subarray(0, end), rs, keyId };
}

function browser() {
  const ua = createECDH('prime256v1');
  ua.generateKeys();
  const auth = Buffer.from('0123456789abcdef');
  return { ua, keys: { p256dh: ua.getPublicKey(), auth } };
}

describe('encryptPushMessage', () => {
  it('WPCRYPTO-001: reproduces the RFC 8291 Appendix A message byte for byte', () => {
    const body = encryptPushMessage(
      RFC.plaintext,
      { p256dh: RFC.uaPublic, auth: RFC.auth },
      { salt: RFC.salt, senderPrivateKey: RFC.asPrivate },
    );
    expect(body.toString('base64url')).toBe(RFC.body);
  });

  it('WPCRYPTO-002: the RFC message decrypts with the user agent key, which checks the reference decrypt too', () => {
    const ua = createECDH('prime256v1');
    ua.setPrivateKey(RFC.uaPrivate);
    const { plaintext, rs, keyId } = decrypt(b64(RFC.body), ua, RFC.auth);
    expect(plaintext.toString('utf8')).toBe('When I grow up, I want to be a watermelon');
    expect(rs).toBe(4096);
    expect(keyId.toString('base64url')).toBe(RFC.asPublic);
  });

  it('WPCRYPTO-003: a real message round-trips, with a fresh salt and sender key every time', () => {
    const { ua, keys } = browser();
    const message = Buffer.from(JSON.stringify({ title: 'Trip reminder: Kyōto', body: 'Tomorrow 🚄' }));
    const first = encryptPushMessage(message, keys);
    const second = encryptPushMessage(message, keys);
    expect(decrypt(first, ua, keys.auth).plaintext.equals(message)).toBe(true);
    expect(decrypt(second, ua, keys.auth).plaintext.equals(message)).toBe(true);
    expect(first.subarray(0, 16).equals(second.subarray(0, 16))).toBe(false);
    expect(first.subarray(21, 86).equals(second.subarray(21, 86))).toBe(false);
  });

  it('WPCRYPTO-004: the largest allowed plaintext still fits one 4096-byte record', () => {
    const { ua, keys } = browser();
    const message = Buffer.alloc(MAX_PUSH_PLAINTEXT_BYTES, 'a');
    const body = encryptPushMessage(message, keys);
    expect(body.length).toBe(PUSH_RECORD_SIZE);
    expect(decrypt(body, ua, keys.auth).plaintext.length).toBe(MAX_PUSH_PLAINTEXT_BYTES);
    expect(() => encryptPushMessage(Buffer.alloc(MAX_PUSH_PLAINTEXT_BYTES + 1), keys)).toThrow(
      /does not fit one record/,
    );
  });

  it('WPCRYPTO-005: refuses keys it cannot encrypt for', () => {
    const { keys } = browser();
    const offCurve = Buffer.from(keys.p256dh);
    offCurve[64] ^= 0x01;
    expect(() => encryptPushMessage(Buffer.from('x'), { ...keys, p256dh: offCurve })).toThrow(/p256dh/);
    expect(() => encryptPushMessage(Buffer.from('x'), { ...keys, auth: Buffer.alloc(8) })).toThrow(/auth secret/);
    expect(() => encryptPushMessage(Buffer.from('x'), keys, { salt: Buffer.alloc(4) })).toThrow(/salt/);
  });
});

describe('key helpers', () => {
  it('WPCRYPTO-006: generates a full-length pair whose halves belong together', () => {
    for (let i = 0; i < 20; i++) {
      const pair = generateVapidKeyPair();
      const pub = b64(pair.publicKey);
      expect(pub.length).toBe(65);
      expect(pub[0]).toBe(0x04);
      expect(b64(pair.privateKey).length).toBe(32);
      expect(isVapidKeyPair(pair.publicKey, pair.privateKey)).toBe(true);
    }
  });

  it('WPCRYPTO-007: tells a pair from two unrelated halves, and rejects what is not a key', () => {
    const a = generateVapidKeyPair();
    const b = generateVapidKeyPair();
    expect(isVapidKeyPair(a.publicKey, b.privateKey)).toBe(false);
    expect(isVapidKeyPair('not base64url!', a.privateKey)).toBe(false);
    expect(derivePublicKey('short')).toBeNull();
    expect(derivePublicKey(Buffer.alloc(32).toString('base64url'))).toBeNull(); // zero is no scalar
    expect(derivePublicKey(a.privateKey)?.toString('base64url')).toBe(a.publicKey);
  });

  it('WPCRYPTO-008: isP256Point wants an uncompressed point that is on the curve', () => {
    const { keys } = browser();
    expect(isP256Point(keys.p256dh)).toBe(true);
    const offCurve = Buffer.from(keys.p256dh);
    offCurve[40] ^= 0xff;
    expect(isP256Point(offCurve)).toBe(false);
    expect(isP256Point(Buffer.concat([Buffer.from([0x03]), keys.p256dh.subarray(1)]))).toBe(false);
    expect(isP256Point(keys.p256dh.subarray(0, 33))).toBe(false);
  });
});

describe('createVapidSigner', () => {
  const pair = generateVapidKeyPair();
  const pub = b64(pair.publicKey);
  const verifyKey = createPublicKey({
    key: {
      kty: 'EC',
      crv: 'P-256',
      x: pub.subarray(1, 33).toString('base64url'),
      y: pub.subarray(33).toString('base64url'),
    },
    format: 'jwk',
  });

  function parse(header: string) {
    const m = /^vapid t=([^,]+), k=(.+)$/.exec(header);
    expect(m).not.toBeNull();
    return { token: m![1], k: m![2] };
  }

  it('WPCRYPTO-009: builds `vapid t=<ES256 JWT>, k=<public key>` for the endpoint origin', () => {
    const now = Date.UTC(2026, 8, 24, 12, 0, 0);
    const sign = createVapidSigner(pair, 'mailto:ops@example.test', () => now);
    const { token, k } = parse(sign('https://fcm.googleapis.com/fcm/send/abc:def'));
    expect(k).toBe(pair.publicKey);

    const claims = jwt.verify(token, verifyKey, {
      algorithms: ['ES256'],
      clockTimestamp: now / 1000,
    }) as jwt.JwtPayload;
    expect(claims).toEqual({
      aud: 'https://fcm.googleapis.com',
      exp: now / 1000 + VAPID_TOKEN_TTL_SECONDS,
      sub: 'mailto:ops@example.test',
    });
    expect(VAPID_TOKEN_TTL_SECONDS).toBeLessThanOrEqual(24 * 60 * 60);

    const [header, , signature] = token.split('.');
    expect(JSON.parse(b64(header).toString('utf8'))).toEqual({ alg: 'ES256', typ: 'JWT' });
    // JOSE r||s, not DER: the form push services verify.
    expect(b64(signature).length).toBe(64);
  });

  it('WPCRYPTO-010: signs once per origin and separately for another push service', () => {
    const sign = createVapidSigner(pair, 'https://trek.example.test');
    const a = sign('https://updates.push.services.mozilla.com/wpush/v2/one');
    const b = sign('https://updates.push.services.mozilla.com/wpush/v2/two');
    const c = sign('https://web.push.apple.com/QGx');
    expect(a).toBe(b);
    expect(c).not.toBe(a);
    const claims = jwt.decode(parse(c).token) as jwt.JwtPayload;
    expect(claims.aud).toBe('https://web.push.apple.com');
  });

  it('WPCRYPTO-011: refuses a malformed key pair up front', () => {
    expect(() => createVapidSigner({ publicKey: 'abc', privateKey: pair.privateKey }, 'mailto:a@b.test')).toThrow(
      /malformed/,
    );
  });
});
