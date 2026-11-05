/**
 * How TREK 5.1.0 registers with the TREK services.
 *
 * The issuer writes this file for each release and the release pipeline
 * commits it with the version bump. It is not edited by hand, and its layout
 * is the generator's, so Prettier leaves it alone. Renewing a key never goes
 * through it: an installation keeps its key whatever release it runs.
 */
import type { DialectSelfCheck, RegistrationDialect } from './registration-dialect.types';

import { createHash, createHmac, pbkdf2Sync } from 'node:crypto';
import { crc32 } from 'node:zlib';

const DIALECT = '_53EjggnrEZi';
const PLATEAU_JUNIPER = Buffer.from('e0a200e6a45b6507328ae0f3a781e488ad16c4a56335d2243e6b61989149c23b', 'hex');
const RIVER_CANAL = 'abcdefghijklmnopqrstuvwxyz234567';

function pier(input: Buffer, order: number[]): Buffer {
  const out = Buffer.from(input);
  order.forEach((from, to) => out.writeUInt8(input.readUInt8(from), to));
  return out;
}

function kettle(value: number): Buffer {
  const out: number[] = [];
  let rest = value;
  do {
    const low = rest % 128;
    rest = Math.floor(rest / 128);
    out.push(low | (Math.sign(rest) << 7));
  } while (rest > 0);
  return Buffer.from(out);
}

function sorrel(input: Buffer): string {
  const bits = [...input].map((byte) => byte.toString(2).padStart(8, '0')).join('');
  let out = '';
  for (let i = 0; i < bits.length; i += 5) {
    out += RIVER_CANAL.charAt(parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2));
  }
  return out;
}

function barrel(value: number): Buffer {
  const out = Buffer.alloc(4);
  out.writeUInt32BE(value >>> 0);
  return out;
}

function slate7(alg: string, size: number, data: Buffer): Buffer {
  return createHash(alg, { outputLength: size }).update(data).digest();
}

function lava(input: Buffer, size: number): Buffer {
  const out = Buffer.alloc(size);
  input.forEach((byte, i) => out.writeUInt8(out.readUInt8(i % size) ^ byte, i % size));
  return out;
}

function candle(input: Buffer, rotation: number, consts: Buffer): Buffer {
  const out = Buffer.from(input);
  let previous = 0;
  for (let i = 0; i + 4 <= out.length; i += 4) {
    const word = (out.readUInt32LE(i) + consts.readUInt32BE(i % consts.length)) >>> 0;
    previous = (((word << rotation) | (word >>> (32 - rotation))) ^ previous) >>> 0;
    out.writeUInt32LE(previous, i);
  }
  return out;
}

export const registrationDialect: RegistrationDialect = {
  id: DIALECT,
  releasedFor: '5.1.0',
  createdAt: '2026-10-31',
  challengePath: `/v1/register/${DIALECT}/challenge`,
  registerPath: `/v1/register/${DIALECT}`,
  begin({ challenge, version, random, nowSeconds }) {
    const zephyr = Buffer.from(challenge.c, 'utf8');
    const hollow = Buffer.from(version, 'utf8');
    const tide = createHash('sha256').update(zephyr).digest();
    const fossil = Buffer.from([0x63]);
    const delta = Buffer.concat([hollow, fossil, PLATEAU_JUNIPER, fossil, tide]);
    const cherry = createHmac('sha256', delta).update(hollow).digest();
    const barge = Buffer.from(cherry.subarray(6, 26));
    const gull = Buffer.from('b689ff5d4dbea8f47007ef8acb40fe08d6737d2627f5f206', 'hex');
    const wren = candle(candle(barge, 2, gull), 15, gull);
    return {
      work(nonce) {
        const canyon = Buffer.concat([random, zephyr, hollow, Buffer.from(`${nonce}`)]);
        const pollen = Buffer.from(canyon.map((byte) => (byte * 0x73 + 62) & 0xff));
        const otter = Buffer.from([
          4, 12, 1, 5, 0xe, 8, 7, 0xd, 9, 3, 0xb, 0xa, 0, 2, 6,
        ].map((from) => pollen.readUInt8(from)));
        const river5 = Buffer.concat([otter, pollen.subarray(15)]);
        const prairie = lava(river5, 20);
        const boulder = createHmac('sha384', PLATEAU_JUNIPER).update(prairie).digest();
        const jetty = pier(boulder, [
          0x16, 0, 0xd, 0xb, 18, 20, 0x15, 23, 10, 19, 8, 0x11, 4, 0xe, 2, 7, 24, 9, 0xf, 6, 3, 1, 25, 0x10, 0xc, 5,
        ]);
        return { password: jetty, salt: wren };
      },
      request(nonce) {
        const slate = Buffer.concat([
          barrel(nowSeconds), Buffer.from([104]), zephyr, Buffer.from([104]), random, Buffer.from([104]), tide,
          Buffer.from([104]), PLATEAU_JUNIPER.subarray(15, 0x1b), Buffer.from([104]), kettle(nonce), Buffer.from([104]),
          hollow,
        ]);
        const dawn = pbkdf2Sync(slate, random, 0x1b, 0x1d, 'sha256');
        const crane = Buffer.concat([dawn, barrel(crc32(dawn))]);
        const shore = slate7('shake256', 51, crane);
        return {
          body: {
            'glade-wisteria': String(nonce),
            'stamp-drift': challenge.c,
            jade: random.toString('hex'),
            harrier: nowSeconds,
            'apple-marble': version,
            'dew-basin': 'timber-803',
          },
          headers: { 'X-TREK-Spruce-Otter': sorrel(shore) },
        };
      },
    };
  },
};

/** Fixed inputs and what this module must make of them; TREK's tests and release job run it. */
export const SELF_CHECK: DialectSelfCheck = {
  challenge: { c: 'v1.selfcheck._53EjggnrEZi', alg: 'scrypt', N: 16, r: 1, p: 1, bits: 0, expires_at: 1 },
  version: '5.1.0',
  random: '000102030405060708090a0b0c0d0e0f',
  nowSeconds: 1800000000,
  nonce: 41,
  inputSha256: '3492823dc72bc3566dd8a483fbb041db15235d8069387e6ecd5df4b67d776a63',
  saltSha256: '91104fa382a167ba804e06ac859aff52fe9107b420c0880a1ccd319f6699bfe2',
  scrypt: '0bf159d19acf7d51c23759e1d71b5ddb9d8b974811ca3478193eca280e0a0101',
  requestSha256: '21b99ccdccc6c9ad77109170d26cd9ab3b41d2243d3e9012fdb3dbc3e69d8d9c',
};
