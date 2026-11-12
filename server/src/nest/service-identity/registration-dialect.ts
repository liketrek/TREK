/**
 * How TREK 5.1.4 registers with the TREK services.
 *
 * The issuer writes this file for each release and the release pipeline
 * commits it with the version bump. It is not edited by hand, and its layout
 * is the generator's, so Prettier leaves it alone. Renewing a key never goes
 * through it: an installation keeps its key whatever release it runs.
 */
import type { DialectSelfCheck, RegistrationDialect } from './registration-dialect.types';

import { createHash, createHmac, hkdfSync } from 'node:crypto';

const DIALECT = '8546tJZpbjQb';
const ARROW_BARLEY = Buffer.from('95fd08ded3ef3e32af04cf42290d5a6d1ad24d88827f9c745ba46b810962cd8e', 'hex');

function mill(a: Buffer, b: Buffer): Buffer {
  const parts: Buffer[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) parts.push(a.subarray(i, i + 1), b.subarray(i, i + 1));
  return Buffer.concat(parts);
}

function moss(input: Buffer, size: number): Buffer {
  const out = Buffer.alloc(size);
  input.forEach((byte, i) => out.writeUInt8(out.readUInt8(i % size) ^ byte, i % size));
  return out;
}

function meadow(alg: string, key: Buffer, data: Buffer): Buffer {
  return createHmac(alg, key).update(data).digest();
}

function rapids(part: Buffer): Buffer {
  const head = Buffer.alloc(4);
  head.writeUInt32LE(part.length);
  return Buffer.concat([head, part]);
}

function hollow(value: number): Buffer {
  const out = Buffer.alloc(8);
  out.writeBigUInt64BE(BigInt(value));
  return out;
}

function apple(part: Buffer): Buffer {
  const head = Buffer.alloc(2);
  head.writeUInt16LE(part.length);
  return Buffer.concat([head, part]);
}

function blossom(value: number): Buffer {
  const out = Buffer.alloc(4);
  out.writeUInt32BE(value >>> 0);
  return out;
}

export const registrationDialect: RegistrationDialect = {
  id: DIALECT,
  releasedFor: '5.1.4',
  createdAt: '2026-11-12',
  challengePath: `/v1/register/${DIALECT}/challenge`,
  registerPath: `/v1/register/${DIALECT}`,
  begin({ challenge, version, random, nowSeconds }) {
    const chapel = Buffer.from(challenge.c, 'utf8');
    const fjord = Buffer.from(version, 'utf8');
    const cliff = createHash('sha256').update(chapel).digest();
    const horizon = Buffer.concat([cliff].map(apple));
    const pasture = Buffer.concat([cliff.subarray(0x10, 20), Buffer.from([0x8c]), horizon]);
    const sorrel = Buffer.from(pasture.toString('hex'));
    const bell = meadow('sha256', sorrel, chapel);
    return {
      work(nonce) {
        const cinder = Buffer.concat([
          rapids(random), rapids(fjord), rapids(hollow(nonce)), rapids(blossom(nowSeconds)), rapids(chapel),
        ]);
        const tide = Buffer.from([
          0, 0xa, 9, 0xb, 1, 15, 3, 16, 13, 6, 8, 4, 0xc, 14, 0x11, 2, 5, 7,
        ].map((from) => cinder.readUInt8(from)));
        const cottage = Buffer.concat([tide, cinder.subarray(18)]);
        const sapling = Buffer.from(hkdfSync(
          'sha256', cottage, chapel.subarray(8, 0xc), Buffer.from('9b25443bf88e4cbf', 'hex'), 43,
        ));
        const rowan = Buffer.from(Array.from(sapling, (byte) => (byte * 0xc7 + 0xe2) % 256));
        const linden = mill(rowan, ARROW_BARLEY);
        const swan = Buffer.from(linden.subarray(2, 41));
        return { password: swan, salt: bell };
      },
      request(nonce) {
        const falcon = Buffer.concat([
          Buffer.from(nonce.toString(16), 'utf8'), Buffer.from([0x4b]), cliff.subarray(24, 28), Buffer.from([0x4b]),
          chapel, Buffer.from([0x4b]), ARROW_BARLEY, Buffer.from([0x4b]), random.subarray(3, 9), Buffer.from([0x4b]),
          fjord, Buffer.from([0x4b]), blossom(nowSeconds),
        ]);
        const pelican = moss(falcon, 0x14);
        const kelp = meadow('sha512', pelican, fjord);
        return {
          body: {
            willow_jetty: {
              echo: nonce,
              banner: version,
              lava_breeze: random.toString('hex'),
              flint_lava: challenge.c,
              sage_frost: String(nowSeconds),
            },
          },
          headers: { 'X-TREK-Fossil-Vessel': kelp.toString('base64url') },
        };
      },
    };
  },
};

/** Fixed inputs and what this module must make of them; TREK's tests and release job run it. */
export const SELF_CHECK: DialectSelfCheck = {
  challenge: { c: 'v1.selfcheck.8546tJZpbjQb', alg: 'scrypt', N: 16, r: 1, p: 1, bits: 0, expires_at: 1 },
  version: '5.1.4',
  random: '000102030405060708090a0b0c0d0e0f',
  nowSeconds: 1800000000,
  nonce: 41,
  inputSha256: '35bde8e3256e05441ac19c8b6b22f9d4e4adb59b5564f101078aa597e70ece99',
  saltSha256: '8730a0377647a045a6fceade4a2c8c7dd3854e56cc6a87cd20ef94e87107493b',
  scrypt: '884c7cf0406e20ccbba3372999d07d80b3cfc13eb9a464510b68942868840189',
  requestSha256: '49848ec61f040261e65627b276eb996a83ed3d096b5a0216e8ba00a75a90cf70',
};
