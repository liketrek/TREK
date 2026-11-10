/*
 * The work behind scripts/precompress.mjs: a Brotli copy (<file>.br) beside every
 * compressible build file under dist/assets.
 *
 * The server compresses a build file on every download otherwise, at the low level
 * a request path can afford. A file under assets/ carries its content hash in its
 * name and never changes, so it is compressed once here, at the level a build can
 * afford, and the server hands that copy out as it is
 * (server/src/nest/platform/precompressed-static.ts).
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { brotliCompressSync, constants } from 'node:zlib';

/** What the server's own compression would take; fonts, images and video are compressed formats already. */
const COMPRESSIBLE = /\.(?:m?js|css|svg|json|wasm|html|webmanifest)$/i;
/** The server leaves anything below 1 kB uncompressed too: the headers cost more than the saving. */
export const MIN_BYTES = 1024;
/** Quality 11 takes about ten times as long per byte as 9, so the largest chunks get 9. */
const BIG_BYTES = 1024 * 1024;

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

/**
 * Writes the .br copies under `dir` and returns what it did. A copy that would not be
 * smaller than its file is not written, and a directory that does not exist is no work.
 */
export function precompress(dir) {
  const result = { files: 0, before: 0, after: 0 };
  let files;
  try {
    files = [...walk(dir)];
  } catch (err) {
    if (err.code === 'ENOENT') return result;
    throw err;
  }
  for (const file of files) {
    if (!COMPRESSIBLE.test(file)) continue;
    const input = readFileSync(file);
    if (input.length < MIN_BYTES) continue;
    const output = brotliCompressSync(input, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: input.length > BIG_BYTES ? 9 : 11,
        [constants.BROTLI_PARAM_SIZE_HINT]: input.length,
      },
    });
    if (output.length >= input.length) continue;
    writeFileSync(`${file}.br`, output);
    result.files += 1;
    result.before += input.length;
    result.after += output.length;
  }
  return result;
}
