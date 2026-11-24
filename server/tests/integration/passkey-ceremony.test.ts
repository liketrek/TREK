/**
 * Passkey ceremonies through the REAL @simplewebauthn/server, with no mock.
 *
 * Every other passkey suite mocks the library, so a release that changes what
 * it accepts (a stricter origin check, a new default) would pass them all and
 * still refuse every passkey in production. Here a software authenticator built
 * on node:crypto answers TREK's own options over HTTP: registration with
 * attestation format 'none', then a signed login, plus credentials stored the
 * way earlier releases stored them.
 */
import { buildApp } from '../../src/bootstrap';
import { WebauthnCredentials } from '../../src/db/entities/WebauthnCredentials.entity';
import { authCookie } from '../helpers/auth';
import { countRows, findRow, insertRow } from '../helpers/factories/rows';
import { setAppSetting } from '../helpers/factories/settings';
import { makeUser } from '../helpers/factories/users';
import { resetDatabase } from '../helpers/reset-database';
import { resetRateLimits } from '../helpers/test-db';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';
import { isoBase64URL, isoCBOR, isoUint8Array } from '@simplewebauthn/server/helpers';

import type { Application } from 'express';
import { createHash, generateKeyPairSync, randomBytes, sign, type KeyObject } from 'node:crypto';
import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest';

type CborValue = Parameters<typeof isoCBOR.encode>[0];
// The byte array type the library helpers take and return.
type Bytes = ReturnType<typeof isoUint8Array.concat>;

const RP_ID = 'trek.example.com';
const ORIGIN = 'https://trek.example.com';

let nestApp: INestApplication;
let app: Application;
let orm: MikroORM;

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  orm = nestApp.get(MikroORM);
});

beforeEach(async () => {
  await resetDatabase(orm);
  await resetRateLimits(nestApp);
  await setAppSetting(orm, 'passkey_login', 'true');
  await setAppSetting(orm, 'webauthn_rp_id', RP_ID);
  await setAppSetting(orm, 'webauthn_origins', ORIGIN);
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await nestApp.close();
});

// ---------------------------------------------------------------------------
// A software authenticator
// ---------------------------------------------------------------------------

type Alg = -7 | -8 | -257;

interface Authenticator {
  alg: Alg;
  privateKey: KeyObject;
  publicKey: KeyObject;
  credentialId: Bytes;
  cosePublicKey: Bytes;
}

function sha256(data: Bytes): Bytes {
  return new Uint8Array(createHash('sha256').update(data).digest());
}

function jwkBytes(value: string | undefined): Bytes {
  if (!value) throw new Error('JWK member missing');
  return isoBase64URL.toBuffer(value);
}

/** The credential public key in COSE form (RFC 9053), as an authenticator reports it. */
function coseKey(alg: Alg, publicKey: KeyObject): Bytes {
  const jwk = publicKey.export({ format: 'jwk' });
  const entries: Array<[number, CborValue]> =
    alg === -7
      ? [
          [1, 2],
          [3, -7],
          [-1, 1],
          [-2, jwkBytes(jwk.x)],
          [-3, jwkBytes(jwk.y)],
        ]
      : alg === -8
        ? [
            [1, 1],
            [3, -8],
            [-1, 6],
            [-2, jwkBytes(jwk.x)],
          ]
        : [
            [1, 3],
            [3, -257],
            [-1, jwkBytes(jwk.n)],
            [-2, jwkBytes(jwk.e)],
          ];
  return isoCBOR.encode(new Map<string | number, CborValue>(entries));
}

function makeAuthenticator(alg: Alg = -7): Authenticator {
  const { privateKey, publicKey } =
    alg === -7
      ? generateKeyPairSync('ec', { namedCurve: 'P-256' })
      : alg === -8
        ? generateKeyPairSync('ed25519')
        : generateKeyPairSync('rsa', { modulusLength: 2048 });
  return {
    alg,
    privateKey,
    publicKey,
    credentialId: new Uint8Array(randomBytes(32)),
    cosePublicKey: coseKey(alg, publicKey),
  };
}

function signWith(auth: Authenticator, data: Bytes): Bytes {
  // EdDSA signs the message itself; ES256 (DER encoded) and RS256 hash with SHA-256.
  return new Uint8Array(sign(auth.alg === -8 ? null : 'sha256', data, auth.privateKey));
}

function uint32(n: number): Bytes {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, n);
  return out;
}

function clientData(type: 'webauthn.create' | 'webauthn.get', challenge: string, origin: string): Bytes {
  return isoUint8Array.fromUTF8String(JSON.stringify({ type, challenge, origin, crossOrigin: false }));
}

// Flags: UP (0x01) and UV (0x04), plus AT (0x40) when credential data follows.
const FLAGS_UP_UV = 0x05;
const FLAGS_UP_UV_AT = 0x45;

/** authData with attested credential data: rpIdHash, flags, counter, AAGUID, credential id, COSE key. */
function registrationAuthData(auth: Authenticator, rpId: string): Bytes {
  const idLength = new Uint8Array([auth.credentialId.length >> 8, auth.credentialId.length & 0xff]);
  return isoUint8Array.concat([
    sha256(isoUint8Array.fromASCIIString(rpId)),
    new Uint8Array([FLAGS_UP_UV_AT]),
    uint32(0),
    new Uint8Array(16),
    idLength,
    auth.credentialId,
    auth.cosePublicKey,
  ]);
}

function registrationResponse(
  auth: Authenticator,
  challenge: string,
  opts: { origin?: string; rpId?: string; fmt?: string; attStmt?: Map<string | number, CborValue> } = {},
) {
  const authData = registrationAuthData(auth, opts.rpId ?? RP_ID);
  const clientDataJSON = clientData('webauthn.create', challenge, opts.origin ?? ORIGIN);
  const attestationObject = isoCBOR.encode(
    new Map<string | number, CborValue>([
      ['fmt', opts.fmt ?? 'none'],
      ['attStmt', opts.attStmt ?? new Map<string | number, CborValue>()],
      ['authData', authData],
    ]),
  );
  const id = isoBase64URL.fromBuffer(auth.credentialId);
  return {
    id,
    rawId: id,
    type: 'public-key',
    response: {
      clientDataJSON: isoBase64URL.fromBuffer(clientDataJSON),
      attestationObject: isoBase64URL.fromBuffer(attestationObject),
      transports: ['internal', 'hybrid'],
    },
    clientExtensionResults: {},
    authenticatorAttachment: 'platform',
  };
}

function authenticationResponse(
  auth: Authenticator,
  challenge: string,
  counter: number,
  opts: { origin?: string; rpId?: string } = {},
) {
  const authData = isoUint8Array.concat([
    sha256(isoUint8Array.fromASCIIString(opts.rpId ?? RP_ID)),
    new Uint8Array([FLAGS_UP_UV]),
    uint32(counter),
  ]);
  const clientDataJSON = clientData('webauthn.get', challenge, opts.origin ?? ORIGIN);
  const signature = signWith(auth, isoUint8Array.concat([authData, sha256(clientDataJSON)]));
  const id = isoBase64URL.fromBuffer(auth.credentialId);
  return {
    id,
    rawId: id,
    type: 'public-key',
    response: {
      clientDataJSON: isoBase64URL.fromBuffer(clientDataJSON),
      authenticatorData: isoBase64URL.fromBuffer(authData),
      signature: isoBase64URL.fromBuffer(signature),
    },
    clientExtensionResults: {},
  };
}

// ---------------------------------------------------------------------------
// HTTP steps
// ---------------------------------------------------------------------------

async function registerOptions(userId: number, password: string) {
  const res = await request(app)
    .post('/api/auth/passkey/register/options')
    .set('Cookie', authCookie(userId))
    .send({ password });
  expect(res.status).toBe(200);
  return res.body as { challenge: string; rp: { id: string }; pubKeyCredParams: Array<{ alg: number }> };
}

async function registerVerify(userId: number, attestationResponse: unknown) {
  return request(app)
    .post('/api/auth/passkey/register/verify')
    .set('Cookie', authCookie(userId))
    .send({ attestationResponse, name: 'Test key' });
}

async function loginOptions() {
  const res = await request(app).post('/api/auth/passkey/login/options').send({});
  expect(res.status).toBe(200);
  return res.body as { challenge: string; rpId: string };
}

async function storedCredential(credentialId: string) {
  const row = await findRow(orm, WebauthnCredentials, { credential_id: credentialId });
  if (!row) throw new Error(`no stored credential ${credentialId}`);
  return row;
}

async function loginVerify(assertionResponse: unknown) {
  return request(app).post('/api/auth/passkey/login/verify').send({ assertionResponse });
}

// ---------------------------------------------------------------------------
// Ceremonies
// ---------------------------------------------------------------------------

describe('passkey ceremonies against the real @simplewebauthn/server', () => {
  it('PASSKEY-REAL-001: registers a credential and logs in with it, bumping the counter', async () => {
    const { user, password } = await makeUser(orm);
    const auth = makeAuthenticator();

    const options = await registerOptions(user.id, password);
    expect(options.rp.id).toBe(RP_ID);
    expect(options.pubKeyCredParams.map((p) => p.alg)).toEqual([-8, -7, -257]);

    const reg = await registerVerify(user.id, registrationResponse(auth, options.challenge));
    expect(reg.status).toBe(200);
    expect(reg.body.success).toBe(true);

    const credentialId = isoBase64URL.fromBuffer(auth.credentialId);
    const stored = await storedCredential(credentialId);
    expect(stored.user_id).toBe(user.id);
    expect(Buffer.from(stored.public_key).equals(Buffer.from(auth.cosePublicKey))).toBe(true);
    expect(stored.counter).toBe(0);
    expect(stored.transports).toBe(JSON.stringify(['internal', 'hybrid']));
    expect(stored.name).toBe('Test key');

    const login = await loginOptions();
    expect(login.rpId).toBe(RP_ID);
    const res = await loginVerify(authenticationResponse(auth, login.challenge, 1));
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect(res.headers['set-cookie']?.[0]).toMatch(/^trek_session=/);

    const after = await storedCredential(credentialId);
    expect(after.counter).toBe(1);
    expect(after.last_used_at).toBeTruthy();
  });

  it.each([
    ['ES256', -7],
    ['EdDSA', -8],
    ['RS256', -257],
  ] as const)('PASSKEY-REAL-002: a %s credential stored by an earlier release still logs in', async (_name, alg) => {
    const { user } = await makeUser(orm);
    const auth = makeAuthenticator(alg);
    const credentialId = isoBase64URL.fromBuffer(auth.credentialId);
    // The row exactly as 13.x wrote it: base64url id, COSE key bytes, counter, JSON transports.
    await insertRow(orm, WebauthnCredentials, {
      user: user.id,
      credential_id: credentialId,
      public_key: Buffer.from(auth.cosePublicKey),
      counter: 5,
      transports: JSON.stringify(['usb', 'nfc']),
      device_type: 'singleDevice',
      backed_up: 0,
      name: 'Old key',
    });

    const login = await loginOptions();
    const res = await loginVerify(authenticationResponse(auth, login.challenge, 6));
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect((await storedCredential(credentialId)).counter).toBe(6);
  });

  it.each([
    ['an uppercase RP ID and an origin with a path', 'Trek.Example.com', 'https://Trek.Example.com/trek/'],
    ['an origin with an uppercase host and a trailing slash', RP_ID, 'https://TREK.example.com/'],
  ])('PASSKEY-REAL-003: %s still verify', async (_case, rpId, origins) => {
    await setAppSetting(orm, 'webauthn_rp_id', rpId);
    await setAppSetting(orm, 'webauthn_origins', origins);
    const { user, password } = await makeUser(orm);
    const auth = makeAuthenticator();

    // What a browser reports: the serialized, lower-case origin and the hash of the RP ID it was given.
    const options = await registerOptions(user.id, password);
    const reg = await registerVerify(user.id, registrationResponse(auth, options.challenge, { rpId: options.rp.id }));
    expect(reg.status).toBe(200);

    const login = await loginOptions();
    const res = await loginVerify(authenticationResponse(auth, login.challenge, 1, { rpId: login.rpId }));
    expect(res.status).toBe(200);
    expect(options.rp.id).toBe(RP_ID);
    expect(login.rpId).toBe(RP_ID);
  });

  it('PASSKEY-REAL-004: a ceremony from a foreign origin is refused with the usual 400 and 401', async () => {
    const { user, password } = await makeUser(orm);
    const auth = makeAuthenticator();

    const options = await registerOptions(user.id, password);
    const reg = await registerVerify(
      user.id,
      registrationResponse(auth, options.challenge, { origin: 'https://evil.example.net' }),
    );
    expect(reg.status).toBe(400);
    expect(reg.body).toEqual({ error: 'Could not register this passkey.' });
    expect(await countRows(orm, WebauthnCredentials, { user: user.id })).toBe(0);

    // A stored credential signing for the wrong origin is refused like any other failed login.
    await insertRow(orm, WebauthnCredentials, {
      user: user.id,
      credential_id: isoBase64URL.fromBuffer(auth.credentialId),
      public_key: Buffer.from(auth.cosePublicKey),
      counter: 0,
      name: 'Key',
    });
    const login = await loginOptions();
    const res = await loginVerify(
      authenticationResponse(auth, login.challenge, 1, { origin: 'https://evil.example.net' }),
    );
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication failed' });
  });
});

// ---------------------------------------------------------------------------
// A certificate carrying a CRL URL (DER written by hand: the library exports
// CBOR and base64url helpers, nothing for ASN.1)
// ---------------------------------------------------------------------------

function der(tag: number, ...parts: Bytes[]): Bytes {
  const body = isoUint8Array.concat(parts);
  const n = body.length;
  const length = n < 0x80 ? [n] : n < 0x100 ? [0x81, n] : [0x82, n >> 8, n & 0xff];
  return isoUint8Array.concat([new Uint8Array([tag, ...length]), body]);
}

const seq = (...parts: Bytes[]) => der(0x30, ...parts);
const smallInt = (n: number) => der(0x02, new Uint8Array([n]));
const octets = (bytes: Bytes) => der(0x04, bytes);
const ascii = (s: string) => isoUint8Array.fromASCIIString(s);

function oid(dotted: string): Bytes {
  const [a, b, ...rest] = dotted.split('.').map(Number);
  const bytes = [40 * a + b];
  for (const arc of rest) {
    const groups = [arc & 0x7f];
    for (let v = arc >> 7; v > 0; v >>= 7) groups.unshift((v & 0x7f) | 0x80);
    bytes.push(...groups);
  }
  return der(0x06, new Uint8Array(bytes));
}

const ECDSA_WITH_SHA256 = seq(oid('1.2.840.10045.4.3.2'));

/**
 * A self-signed certificate for the credential key, shaped like an Android key
 * attestation leaf (key description extension with the client data hash as its
 * challenge) and naming a CRL distribution point.
 */
function androidKeyCertificate(auth: Authenticator, clientDataHash: Bytes, crlUrl: string): Bytes {
  const name = seq(der(0x31, seq(oid('2.5.4.3'), der(0x0c, ascii('Passkey test')))));
  const validity = seq(der(0x17, ascii('250101000000Z')), der(0x17, ascii('491231235959Z')));
  const spki = new Uint8Array(auth.publicKey.export({ type: 'spki', format: 'der' }));
  // distributionPoint [0] { fullName [0] { uniformResourceIdentifier [6] } }
  const crlDistributionPoints = seq(seq(der(0xa0, der(0xa0, der(0x86, ascii(crlUrl))))));
  const keyDescription = seq(
    smallInt(3),
    der(0x0a, new Uint8Array([1])),
    smallInt(4),
    der(0x0a, new Uint8Array([1])),
    octets(clientDataHash),
    octets(new Uint8Array()),
    seq(),
    seq(),
  );
  const extensions = der(
    0xa3,
    seq(
      seq(oid('2.5.29.31'), octets(crlDistributionPoints)),
      seq(oid('1.3.6.1.4.1.11129.2.1.17'), octets(keyDescription)),
    ),
  );
  const tbs = seq(der(0xa0, smallInt(2)), smallInt(1), ECDSA_WITH_SHA256, name, validity, name, spki, extensions);
  const signature = signWith(auth, tbs);
  return seq(tbs, ECDSA_WITH_SHA256, der(0x03, new Uint8Array([0]), signature));
}

describe('attestation certificates', () => {
  it('PASSKEY-REAL-005: an android-key attestation naming a CRL URL is refused without any outbound fetch', async () => {
    const { user, password } = await makeUser(orm);
    const auth = makeAuthenticator();
    const crlUrl = 'http://crl.attacker.invalid/revoked.crl';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('outbound fetch blocked in test'));

    const options = await registerOptions(user.id, password);
    const clientDataHash = sha256(clientData('webauthn.create', options.challenge, ORIGIN));
    const authData = registrationAuthData(auth, RP_ID);
    const attStmt = new Map<string | number, CborValue>([
      ['alg', -7],
      ['sig', signWith(auth, isoUint8Array.concat([authData, clientDataHash]))],
      ['x5c', [androidKeyCertificate(auth, clientDataHash, crlUrl)]],
    ]);

    const res = await registerVerify(
      user.id,
      registrationResponse(auth, options.challenge, { fmt: 'android-key', attStmt }),
    );

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Could not register this passkey.' });
    expect(await countRows(orm, WebauthnCredentials, { user: user.id })).toBe(0);
  });
});
