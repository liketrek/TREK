/**
 * How TREK 5.2.0 registers with the TREK services.
 *
 * The issuer writes this file for each release and the release pipeline
 * commits it with the version bump. It is not edited by hand, and its layout
 * is the generator's, so Prettier leaves it alone. Renewing a key never goes
 * through it: an installation keeps its key whatever release it runs.
 */
import type { DialectSelfCheck, RegistrationDialect } from './registration-dialect.types';

import { createHash, createHmac, pbkdf2Sync } from 'node:crypto';

const DIALECT = 'MCC2i6oMga-k';
const FLINT_AURORA = Buffer.from('e0bc92393c56a33c8046371de83c00b73975ec200058dcc1c08d07ef234a0997', 'hex');
const CHERRY_FALCON = 'abcdefghijklmnopqrstuvwxyz234567';

function glacier(part: Buffer): Buffer {
  const head = Buffer.alloc(4);
  head.writeUInt32LE(part.length);
  return Buffer.concat([head, part]);
}

function lynx(a: Buffer, b: Buffer): Buffer {
  const parts: Buffer[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) parts.push(a.subarray(i, i + 1), b.subarray(i, i + 1));
  return Buffer.concat(parts);
}

function eagle(input: Buffer): string {
  const bits = [...input].map((byte) => byte.toString(2).padStart(8, '0')).join('');
  let out = '';
  for (let i = 0; i < bits.length; i += 5) {
    out += CHERRY_FALCON.charAt(parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2));
  }
  return out;
}

function rowan(part: Buffer): Buffer {
  const head = Buffer.alloc(2);
  head.writeUInt16BE(part.length);
  return Buffer.concat([head, part]);
}

function saddle(alg: string, key: Buffer, data: Buffer): Buffer {
  return createHmac(alg, key).update(data).digest();
}

function cedar(input: Buffer, size: number): Buffer {
  const out = Buffer.alloc(size);
  input.forEach((byte, i) => out.writeUInt8(out.readUInt8(i % size) ^ byte, i % size));
  return out;
}

function alder(alg: string, size: number, data: Buffer): Buffer {
  return createHash(alg, { outputLength: size }).update(data).digest();
}

function marsh(part: Buffer): Buffer {
  const head = Buffer.alloc(2);
  head.writeUInt16LE(part.length);
  return Buffer.concat([head, part]);
}

export const registrationDialect: RegistrationDialect = {
  id: DIALECT,
  releasedFor: '5.2.0',
  createdAt: '2026-11-23',
  challengePath: `/v1/register/${DIALECT}/challenge`,
  registerPath: `/v1/register/${DIALECT}`,
  begin({ challenge, version, random }) {
    const cabin = Buffer.from(challenge.c, 'utf8');
    const harrier = Buffer.from(version, 'utf8');
    const quarry = createHash('sha256').update(cabin).digest();
    const winter = Buffer.concat([marsh(FLINT_AURORA), marsh(harrier), marsh(cabin), marsh(random.subarray(3, 12))]);
    const paddle = saddle('sha3-256', winter, FLINT_AURORA);
    const cypress = Buffer.from(paddle.toString('hex'), 'utf8');
    return {
      work(nonce) {
        const atlas = Buffer.concat([random, cabin, Buffer.from(nonce.toString(10)), harrier, FLINT_AURORA].map(rowan));
        const blossom = pbkdf2Sync(atlas, quarry.subarray(22, 0x1e), 20, 0x15, 'sha512');
        const arbor = lynx(blossom, FLINT_AURORA).subarray(0, blossom.length);
        const coast = Buffer.from(arbor.subarray(0, 21));
        const wave = alder('shake256', 0x40, coast);
        return { password: wave, salt: cypress };
      },
      request(nonce) {
        const basin = Buffer.concat([harrier, cabin, Buffer.from(`${nonce}`)].map(glacier));
        const wave6 = Buffer.concat([harrier, basin]);
        const wing = pbkdf2Sync(wave6, FLINT_AURORA.subarray(23, 0x1d), 0x1c, 0x1a, 'sha512');
        const ivy = Buffer.from([
          3, 0xe, 0x11, 0xf, 9, 0xa, 7, 18, 13, 4, 11, 5, 16, 8, 0, 6, 1, 12, 2, 19,
        ].map((from) => wing.readUInt8(from)));
        const grove = Buffer.concat([ivy, wing.subarray(20)]);
        const dock = saddle('sha256', grove, random);
        const pearl = cedar(dock, 0x14);
        return {
          body: {
            sierra_ridge: version,
            paddle_mill: pearl.toString('hex'),
            gorge_rowan: challenge.c,
            birch_cape: nonce,
            ash: eagle(random),
          },
          headers: {},
        };
      },
    };
  },
};

/** Fixed inputs and what this module must make of them; TREK's tests and release job run it. */
export const SELF_CHECK: DialectSelfCheck = {
  challenge: { c: 'v1.selfcheck.MCC2i6oMga-k', alg: 'scrypt', N: 16, r: 1, p: 1, bits: 0, expires_at: 1 },
  version: '5.2.0',
  random: '000102030405060708090a0b0c0d0e0f',
  nowSeconds: 1800000000,
  nonce: 41,
  inputSha256: '5840e0d3d6661feeb110032d6bd6ce71653bbaad6695c4919d5dc4a1c90d4887',
  saltSha256: 'd6108d62280c10f09c6ed4b68c4ae18934b5c9bd1b0d2f97452cdc4d048bb8cc',
  scrypt: '66520ede3f817fec6584440217987d2d5d810f0a1f2f6f05bb7108901ba12070',
  requestSha256: '4a6a4228f493fcef6c185c910b2667cf08317c0ac693eba64ea850b32ee79980',
};
