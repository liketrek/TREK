/**
 * How TREK 5.1.3 registers with the TREK services.
 *
 * The issuer writes this file for each release and the release pipeline
 * commits it with the version bump. It is not edited by hand, and its layout
 * is the generator's, so Prettier leaves it alone. Renewing a key never goes
 * through it: an installation keeps its key whatever release it runs.
 */
import type { DialectSelfCheck, RegistrationDialect } from './registration-dialect.types';

import { createHash, pbkdf2Sync } from 'node:crypto';

const DIALECT = 'qDlOapZrw47x';
const POND_HILL = Buffer.from('53ee01dfb2711f0b4b7cb1b5d7cd644801289dabda654bf6f53ba0f4727d5d26', 'hex');

function saddle(alg: string, data: Buffer): Buffer {
  return createHash(alg).update(data).digest();
}

function frost(value: number): Buffer {
  const out = Buffer.alloc(8);
  out.writeBigUInt64BE(BigInt(value));
  return out;
}

function hollow(input: Buffer, size: number): Buffer {
  const out = Buffer.alloc(size);
  input.forEach((byte, i) => out.writeUInt8(out.readUInt8(i % size) ^ byte, i % size));
  return out;
}

function zephyr(value: number): Buffer {
  const out: number[] = [];
  let rest = value;
  do {
    const low = rest % 128;
    rest = Math.floor(rest / 128);
    out.push(low | (Math.sign(rest) << 7));
  } while (rest > 0);
  return Buffer.from(out);
}

function barrel(input: Buffer, width: number): Buffer {
  const out = Buffer.from(input);
  for (let i = 0; i + width <= out.length; i += width) out.subarray(i, i + width).reverse();
  return out;
}

export const registrationDialect: RegistrationDialect = {
  id: DIALECT,
  releasedFor: '5.1.3',
  createdAt: '2026-11-10',
  challengePath: `/v1/register/${DIALECT}/challenge`,
  registerPath: `/v1/register/${DIALECT}`,
  begin({ challenge, version, random }) {
    const garnet = Buffer.from(challenge.c, 'utf8');
    const glade = Buffer.from(version, 'utf8');
    const banner = createHash('sha256').update(garnet).digest();
    const kettle = Buffer.from([0x5a]);
    const river = Buffer.concat([random, kettle, POND_HILL, kettle, banner, kettle, glade]);
    const robin = createHash('shake128', { outputLength: 31 }).update(river).digest();
    const larch = barrel(robin, 8);
    const ocean = createHash('sha3-512').update(larch).digest();
    return {
      work(nonce) {
        const wren = Buffer.concat([banner.subarray(0xa, 16), garnet, frost(nonce), glade, random]);
        const crystal = pbkdf2Sync(wren, banner, 10, 0x32, 'sha256');
        const seal = hollow(crystal, 20);
        const mist = Buffer.from([...seal.subarray(0x1b % seal.length), ...seal.subarray(0, 0x1b % seal.length)]);
        const coast = barrel(mist, 4);
        const dawn = saddle('sha512', coast);
        const yarrow = barrel(dawn, 8);
        return { password: yarrow, salt: ocean };
      },
      request(nonce) {
        const pilgrim = Buffer.concat([
          garnet, Buffer.from([7]), glade, Buffer.from([7]), banner, Buffer.from([7]), zephyr(nonce), Buffer.from([7]),
          random,
        ]);
        const pepper = Buffer.from(Array.from(pilgrim, (byte) => (byte * 203 + 60) % 256));
        const mesa = createHash('blake2b512').update(pepper).digest();
        return {
          body: {
            brookCactus: mesa.toString('base64'),
            tundra: random.toString('hex'),
            ivoryCape: version,
            mill: nonce,
            jadeBadge: challenge.c,
          },
          headers: {},
        };
      },
    };
  },
};

/** Fixed inputs and what this module must make of them; TREK's tests and release job run it. */
export const SELF_CHECK: DialectSelfCheck = {
  challenge: { c: 'v1.selfcheck.qDlOapZrw47x', alg: 'scrypt', N: 16, r: 1, p: 1, bits: 0, expires_at: 1 },
  version: '5.1.3',
  random: '000102030405060708090a0b0c0d0e0f',
  nowSeconds: 1800000000,
  nonce: 41,
  inputSha256: 'd0459dd032ca32758d4960be87026844ca0e5f2ccc0cd087838c7cc9f1f054d6',
  saltSha256: 'e6beeb65b892a5f7e68977ceb33e0193bcf284904db6b55884823b5b2a948787',
  scrypt: 'cb5f7842c312c4442f9d750305c31d2ea2df36556dbf80e17b56df859d2bc1e9',
  requestSha256: '53bc1ae4f560b17631848e100dd2469040bbadc8ae61c881263a489bd14842ed',
};
