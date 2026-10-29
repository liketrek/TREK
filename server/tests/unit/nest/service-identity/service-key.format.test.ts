/**
 * The tk1 key format, checked against the vectors the issuer is tested with
 * too (tests/fixtures/service-identity/tk1-vectors.json), so TREK and the gate
 * read the same bytes the same way.
 */
import { parseServiceKey } from '../../../../src/nest/service-identity/service-key.format';

import { createPublicKey, verify } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

interface Vector {
  name: string;
  token: string;
  valid: boolean;
  payload?: { i: string; iat: number; exp: number; q: string };
  payload_json?: string;
}

const fixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', '..', 'fixtures', 'service-identity', 'tk1-vectors.json'), 'utf8'),
) as { kid: string; public_key_b64url: string; vectors: Vector[] };

const issuerKey = createPublicKey({
  key: { kty: 'OKP', crv: 'Ed25519', x: fixture.public_key_b64url },
  format: 'jwk',
});

/** What the gate checks: the issuer's signature over `tk1.<kid>.<payload>`, for a kid it knows. */
function gateAccepts(token: string): boolean {
  const [version, kid, payload, signature] = token.split('.');
  if (version !== 'tk1' || kid !== fixture.kid) return false;
  return verify(null, Buffer.from(`tk1.${kid}.${payload}`), issuerKey, Buffer.from(signature, 'base64url'));
}

const valid = fixture.vectors.filter((v) => v.valid);
const invalid = fixture.vectors.filter((v) => !v.valid);

describe('parseServiceKey against the shared vectors', () => {
  it.each(valid.map((v) => [v.name, v] as const))(
    'SIKEY-001: reads the %s vector as the issuer wrote it',
    (_, vector) => {
      const key = parseServiceKey(vector.token);
      expect(key).not.toBeNull();
      expect(key?.kid).toBe(fixture.kid);
      expect(key?.payload).toEqual(vector.payload);
      const body = vector.token.split('.')[2];
      expect(Buffer.from(body, 'base64url').toString('utf8')).toBe(vector.payload_json);
    },
  );

  it.each(valid.map((v) => [v.name, v.token] as const))(
    'SIKEY-002: the %s vector is signed as the format says',
    (_, token) => {
      expect(gateAccepts(token)).toBe(true);
    },
  );

  it.each(invalid.map((v) => [v.name, v.token] as const))(
    'SIKEY-003: the %s vector fails the signature check',
    (_, token) => {
      expect(gateAccepts(token)).toBe(false);
    },
  );

  it('SIKEY-004: leaves the signature to the gate, so a tampered key still reads', () => {
    const tampered = invalid.find((v) => v.name === 'tampered_payload')?.token ?? '';
    expect(parseServiceKey(tampered)?.payload.q).toBe('own');
  });
});

describe('parseServiceKey on anything else', () => {
  const body = Buffer.from(JSON.stringify({ i: 'AAECAwQFBgcICQoLDA0ODw', iat: 1, exp: 2, q: 'std' })).toString(
    'base64url',
  );

  it.each([
    ['another version', `tk2.kid.${body}.sig`],
    ['three parts', `tk1.kid.${body}`],
    ['five parts', `tk1.kid.${body}.sig.extra`],
    ['a part outside base64url', `tk1.k+d.${body}.sig`],
    ['a payload that is no JSON', 'tk1.kid.bm90LWpzb24.sig'],
    ['a payload without an expiry', `tk1.kid.${Buffer.from('{"i":"a","iat":1,"q":"std"}').toString('base64url')}.sig`],
    ['nothing', ''],
  ])('SIKEY-010: refuses %s', (_, token) => {
    expect(parseServiceKey(token)).toBeNull();
  });

  it('SIKEY-011: tolerates the whitespace an environment file leaves around it', () => {
    expect(parseServiceKey(`  tk1.kid.${body}.sig\n`)?.token).toBe(`tk1.kid.${body}.sig`);
  });
});
