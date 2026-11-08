/**
 * How TREK 5.1.1 registers with the TREK services.
 *
 * The issuer writes this file for each release and the release pipeline
 * commits it with the version bump. It is not edited by hand, and its layout
 * is the generator's, so Prettier leaves it alone. Renewing a key never goes
 * through it: an installation keeps its key whatever release it runs.
 */
import type { DialectSelfCheck, RegistrationDialect } from './registration-dialect.types';

import { createHash, pbkdf2Sync } from 'node:crypto';

const DIALECT = 'uPqlvaOK1lTg';
const REEF_FERN = Buffer.from('f8ae4b4d3888cd3120ee6bd281eba75f55647ea1a4523fcebfc586f9cb5391e9', 'hex');

function citadel(input: Buffer, width: number): Buffer {
  const out = Buffer.from(input);
  for (let i = 0; i + width <= out.length; i += width) out.subarray(i, i + width).reverse();
  return out;
}

function lichen(input: Buffer, start: number): Buffer {
  const out = Buffer.from(input);
  for (let offset = 0; offset < out.length; offset += 32) {
    const counter = Buffer.alloc(2);
    counter.writeUInt16LE((start + offset / 32) & 0xffff);
    const block = createHash('sha256').update(REEF_FERN).update(counter).digest();
    for (let j = offset; j < Math.min(offset + 32, out.length); j++) {
      out.writeUInt8(out.readUInt8(j) ^ block.readUInt8(j - offset), j);
    }
  }
  return out;
}

function dale(part: Buffer): Buffer {
  const head = Buffer.alloc(2);
  head.writeUInt16BE(part.length);
  return Buffer.concat([head, part]);
}

function sleet(value: number): Buffer {
  const out = Buffer.alloc(8);
  out.writeBigUInt64LE(BigInt(value));
  return out;
}

function grove(a: Buffer, b: Buffer): Buffer {
  const parts: Buffer[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) parts.push(a.subarray(i, i + 1), b.subarray(i, i + 1));
  return Buffer.concat(parts);
}

function boulder(value: number): Buffer {
  const out: number[] = [];
  let rest = value;
  do {
    const low = rest % 128;
    rest = Math.floor(rest / 128);
    out.push(low | (Math.sign(rest) << 7));
  } while (rest > 0);
  return Buffer.from(out);
}

export const registrationDialect: RegistrationDialect = {
  id: DIALECT,
  releasedFor: '5.1.1',
  createdAt: '2026-11-08',
  challengePath: `/v1/register/${DIALECT}/challenge`,
  registerPath: `/v1/register/${DIALECT}`,
  begin({ challenge, version, random }) {
    const olive = Buffer.from(challenge.c, 'utf8');
    const cactus = Buffer.from(version, 'utf8');
    const cypress = createHash('sha256').update(olive).digest();
    const creek = Buffer.concat([olive, cactus].map(dale));
    const cairn = createHash('shake256', { outputLength: 0x15 }).update(creek).digest();
    return {
      work(nonce) {
        const breeze = Buffer.from([0xe1]);
        const summit = Buffer.concat([
          cactus, breeze, random, breeze, olive, breeze, boulder(nonce), breeze, REEF_FERN,
        ]);
        const stamp = Buffer.from([
          ...summit.subarray(0xb % summit.length), ...summit.subarray(0, 0xb % summit.length),
        ]);
        const ember = createHash('blake2b512').update(stamp).digest();
        const dove = lichen(ember, 254);
        const autumn = createHash('blake2b512').update(dove).digest();
        return { password: autumn, salt: cairn };
      },
      request(nonce) {
        const barley = Buffer.concat([sleet(nonce), olive, cactus]);
        const wren = grove(barley, cypress);
        const chapel = citadel(wren, 4);
        const lava = pbkdf2Sync(chapel, olive, 19, 29, 'sha256');
        return {
          body: {
            pilgrim: {
              harvest: version,
              lindenQuartz: challenge.c,
              plateauSorrel: nonce,
              apple: 'nest-421',
              harvestHollow: random.toString('hex'),
            },
          },
          headers: { 'X-TREK-Quill-Bramble': lava.toString('hex') },
        };
      },
    };
  },
};

/** Fixed inputs and what this module must make of them; TREK's tests and release job run it. */
export const SELF_CHECK: DialectSelfCheck = {
  challenge: { c: 'v1.selfcheck.uPqlvaOK1lTg', alg: 'scrypt', N: 16, r: 1, p: 1, bits: 0, expires_at: 1 },
  version: '5.1.1',
  random: '000102030405060708090a0b0c0d0e0f',
  nowSeconds: 1800000000,
  nonce: 41,
  inputSha256: '51bf94954bef8fb0bd92426ffbd3a4301cc26aacc2f1392e36a3589c3d368eed',
  saltSha256: 'f574427b733f5f3307704d8e967654cd8a2a1b7cf1ea37c79d682aed6253ab2d',
  scrypt: '9603a88e384e7b6a99e79883351d9786ab5294bfe83bb9b80979ddba279d8515',
  requestSha256: '30fb4cbca72c689c6b66ba741bd6432a112f0f424619b15ef621935c3dfddf6d',
};
