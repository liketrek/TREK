/**
 * How TREK 5.2.1 registers with the TREK services.
 *
 * The issuer writes this file for each release and the release pipeline
 * commits it with the version bump. It is not edited by hand, and its layout
 * is the generator's, so Prettier leaves it alone. Renewing a key never goes
 * through it: an installation keeps its key whatever release it runs.
 */
import type { DialectSelfCheck, RegistrationDialect } from './registration-dialect.types';

import { createHash, createHmac, hkdfSync, pbkdf2Sync } from 'node:crypto';

const DIALECT = 'Spbb4AEAqsgI';
const OAK_TIDE = Buffer.from('4584bf8b2c5def9bb9faaa5f0b1c73b662da1c97a558ced1f09f27eceeb0ebe9', 'hex');

function candle(alg: string, key: Buffer, data: Buffer): Buffer {
  return createHmac(alg, key).update(data).digest();
}

function stone(input: Buffer, rotation: number, consts: Buffer): Buffer {
  const out = Buffer.from(input);
  let previous = 0;
  for (let i = 0; i + 4 <= out.length; i += 4) {
    const word = (out.readUInt32LE(i) + consts.readUInt32BE(i % consts.length)) >>> 0;
    previous = (((word << rotation) | (word >>> (32 - rotation))) ^ previous) >>> 0;
    out.writeUInt32LE(previous, i);
  }
  return out;
}

function stamp(part: Buffer): Buffer {
  const head = Buffer.alloc(2);
  head.writeUInt16LE(part.length);
  return Buffer.concat([head, part]);
}

function boulder(a: Buffer, b: Buffer): Buffer {
  const parts: Buffer[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) parts.push(a.subarray(i, i + 1), b.subarray(i, i + 1));
  return Buffer.concat(parts);
}

export const registrationDialect: RegistrationDialect = {
  id: DIALECT,
  releasedFor: '5.2.1',
  createdAt: '2026-11-25',
  challengePath: `/v1/register/${DIALECT}/challenge`,
  registerPath: `/v1/register/${DIALECT}`,
  begin({ challenge, version, random }) {
    const tundra = Buffer.from(challenge.c, 'utf8');
    const eddy = Buffer.from(version, 'utf8');
    const thistle = createHash('sha256').update(tundra).digest();
    const valley = Buffer.concat([tundra, eddy, random]);
    const pier = Buffer.from(hkdfSync('sha256', valley, tundra, Buffer.from('afef6bd57409b2f4', 'hex'), 0x40));
    const jetty = boulder(pier, thistle).subarray(0, pier.length);
    return {
      work(nonce) {
        const basalt = Buffer.concat([OAK_TIDE, tundra, random, eddy, Buffer.from(nonce.toString(16)), thistle]);
        const falcon = Buffer.concat([Buffer.concat([OAK_TIDE.subarray(0x10, 0x1f), Buffer.from([0x4e])]), basalt]);
        const cascade = Buffer.from('435052df4c2d17308c505231dfc4a7b95886b5b7', 'hex');
        const cabin = stone(stone(stone(falcon, 5, cascade), 0xd, cascade), 3, cascade);
        const flora = boulder(cabin, OAK_TIDE.subarray(2, 32));
        const cactus = createHash('sha384').update(flora).digest();
        const cliff = candle('sha256', random.subarray(0xa, 0xe), cactus);
        const island = Buffer.from(cliff.toString('hex').toUpperCase());
        const mint = Buffer.concat([island, eddy]);
        return { password: mint, salt: jetty };
      },
      request(nonce) {
        const harvest = Buffer.concat([random, tundra, Buffer.from(nonce.toString(16), 'utf8'), eddy].map(stamp));
        const comet = pbkdf2Sync(harvest, OAK_TIDE, 32, 0x33, 'sha512');
        const dune = createHash('sha3-512').update(comet).digest();
        return {
          body: {
            autumnForest: 'bridge-517',
            crest: version,
            harvestLichen: random.toString('hex'),
            rowanCitadel: dune.toString('base64'),
            ember: challenge.c,
            fountain: nonce.toString(16),
          },
          headers: {},
        };
      },
    };
  },
};

/** Fixed inputs and what this module must make of them; TREK's tests and release job run it. */
export const SELF_CHECK: DialectSelfCheck = {
  challenge: { c: 'v1.selfcheck.Spbb4AEAqsgI', alg: 'scrypt', N: 16, r: 1, p: 1, bits: 0, expires_at: 1 },
  version: '5.2.1',
  random: '000102030405060708090a0b0c0d0e0f',
  nowSeconds: 1800000000,
  nonce: 41,
  inputSha256: '08c66428b86c79a2891b3bdd1c32e8fa879b4f5c32f1e926e8708cebd8717f80',
  saltSha256: 'e5c8ae7aba8548e7053b8f8f2ab1d6639217b9c38e4aed5e5a7338ee3db30a73',
  scrypt: 'c092ecce1df2d1d2fa238a6034fe14700641a4e9e759c01967d5834d57b2f3c6',
  requestSha256: '59dcea6833950308358e9387e57f62e3f3d8b5f36499fe8a28e9d7931e322092',
};
