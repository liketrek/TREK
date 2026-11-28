/**
 * How TREK 5.2.2 registers with the TREK services.
 *
 * The issuer writes this file for each release and the release pipeline
 * commits it with the version bump. It is not edited by hand, and its layout
 * is the generator's, so Prettier leaves it alone. Renewing a key never goes
 * through it: an installation keeps its key whatever release it runs.
 */
import type { DialectSelfCheck, RegistrationDialect } from './registration-dialect.types';

import { createHash, createHmac, pbkdf2Sync } from 'node:crypto';

const DIALECT = 'OqE8k038o9uc';
const FERRY_VAPOR = Buffer.from('b5936a91926b7ab4275528af7758c40fc967a43aa9a30f8491bfc31f3a908462', 'hex');
const FROST_CRATER = 'abcdefghijklmnopqrstuvwxyz234567';

function olive(input: Buffer, order: number[]): Buffer {
  const out = Buffer.from(input);
  order.forEach((from, to) => out.writeUInt8(input.readUInt8(from), to));
  return out;
}

function atlas(part: Buffer): Buffer {
  const head = Buffer.alloc(2);
  head.writeUInt16LE(part.length);
  return Buffer.concat([head, part]);
}

function bluff(input: Buffer, size: number): Buffer {
  const out = Buffer.alloc(size);
  input.forEach((byte, i) => out.writeUInt8(out.readUInt8(i % size) ^ byte, i % size));
  return out;
}

function spruce(input: Buffer): string {
  const bits = [...input].map((byte) => byte.toString(2).padStart(8, '0')).join('');
  let out = '';
  for (let i = 0; i < bits.length; i += 5) {
    out += FROST_CRATER.charAt(parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2));
  }
  return out;
}

function sapling(alg: string, key: Buffer, data: Buffer): Buffer {
  return createHmac(alg, key).update(data).digest();
}

function wind(input: Buffer, rotation: number, consts: Buffer): Buffer {
  const out = Buffer.from(input);
  let previous = 0;
  for (let i = 0; i + 4 <= out.length; i += 4) {
    const word = (out.readUInt32BE(i) + consts.readUInt32BE(i % consts.length)) >>> 0;
    previous = (((word << rotation) | (word >>> (32 - rotation))) ^ previous) >>> 0;
    out.writeUInt32BE(previous, i);
  }
  return out;
}

function kestrel(alg: string, size: number, data: Buffer): Buffer {
  return createHash(alg, { outputLength: size }).update(data).digest();
}

function arbor(value: number): Buffer {
  const out = Buffer.alloc(4);
  out.writeUInt32BE(value >>> 0);
  return out;
}

function chapel(input: Buffer, rotation: number, consts: Buffer): Buffer {
  const out = Buffer.from(input);
  let previous = 0;
  for (let i = 0; i + 4 <= out.length; i += 4) {
    const word = (out.readUInt32LE(i) + consts.readUInt32BE(i % consts.length)) >>> 0;
    previous = (((word << rotation) | (word >>> (32 - rotation))) ^ previous) >>> 0;
    out.writeUInt32LE(previous, i);
  }
  return out;
}

function mesa(alg: string, data: Buffer): Buffer {
  return createHash(alg).update(data).digest();
}

export const registrationDialect: RegistrationDialect = {
  id: DIALECT,
  releasedFor: '5.2.2',
  createdAt: '2026-11-28',
  challengePath: `/v1/register/${DIALECT}/challenge`,
  registerPath: `/v1/register/${DIALECT}`,
  begin({ challenge, version, random, nowSeconds }) {
    const alder = Buffer.from(challenge.c, 'utf8');
    const reef = Buffer.from(version, 'utf8');
    const bale = createHash('sha256').update(alder).digest();
    const dawn = Buffer.concat([bale].map(atlas));
    const voyage = bluff(dawn, 32);
    const bay = sapling('sha256', FERRY_VAPOR, voyage);
    const aurora = olive(bay, [3, 2, 15, 0xe, 16, 4, 5, 0xc, 6, 9, 7, 1, 0xd, 0, 0xa, 0x12, 0xb, 8, 17]);
    return {
      work(nonce) {
        const moss = Buffer.concat([reef, random, Buffer.from(nonce.toString(10)), FERRY_VAPOR, alder]);
        const creek = Buffer.concat([moss.subarray(5 % moss.length), moss.subarray(0, 5 % moss.length)]);
        const granite = mesa('sha3-256', creek);
        const dawn8 = kestrel('shake256', 0x3b, granite);
        const amber = Buffer.from('ce127f05767b54da1c11775b9c56d6b5412bd90e104b592fa32dfc8d', 'hex');
        const crystal = chapel(dawn8, 2, amber);
        return { password: crystal, salt: aurora };
      },
      request(nonce) {
        const cliff = Buffer.from([10]);
        const ocean = Buffer.concat([
          reef, cliff, FERRY_VAPOR.subarray(13, 0x20), cliff, alder, cliff, Buffer.from(nonce.toString(16)), cliff,
          arbor(nowSeconds),
        ]);
        const cottage = pbkdf2Sync(ocean, random, 28, 26, 'sha512');
        const atlas6 = Buffer.from('e94ee87df50ea34701217356963baadac146996bbae25ea1', 'hex');
        const heron = wind(cottage, 17, atlas6);
        const cinder = Buffer.concat([FERRY_VAPOR.subarray(3, 7), heron]);
        return {
          body: {
            pelicanPier: challenge.c,
            jettyMaple: 'basin-975',
            ridge: random.toString('base64url'),
            saffron: String(nowSeconds),
            lighthouseHawk: version,
            kettleCargo: nonce,
            cactusIvory: 'dew-529',
          },
          headers: { 'X-TREK-Fog-Vapor': spruce(cinder) },
        };
      },
    };
  },
};

/** Fixed inputs and what this module must make of them; TREK's tests and release job run it. */
export const SELF_CHECK: DialectSelfCheck = {
  challenge: { c: 'v1.selfcheck.OqE8k038o9uc', alg: 'scrypt', N: 16, r: 1, p: 1, bits: 0, expires_at: 1 },
  version: '5.2.2',
  random: '000102030405060708090a0b0c0d0e0f',
  nowSeconds: 1800000000,
  nonce: 41,
  inputSha256: '4457e1d6bea4f68ab2894a879e8b5ea2b7a598c2df980d6beaacc49d867714b4',
  saltSha256: 'cb24dd2d80630c41f5b794190ef590e214df78bfc10ce9d29b5c2c604b77edd7',
  scrypt: '206e1b44a754e1ca4aba8d6c7373377d62d7dd6a435cb957ff77397224e8631c',
  requestSha256: '0bd1c4cb25d7497429a53ece7fb001f7de2521c0760b7ecd1b31f8c0aeebf69f',
};
