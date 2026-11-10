#!/usr/bin/env node
/*
 * postbuild: writes a Brotli copy beside every compressible file under dist/assets,
 * which the server hands to a browser that accepts Brotli instead of compressing
 * the file again on each download. scripts/lib/precompress.mjs holds the work.
 */
import { fileURLToPath } from 'node:url';
import { precompress } from './lib/precompress.mjs';

const { files, before, after } = precompress(fileURLToPath(new URL('../dist/assets', import.meta.url)));
const mb = (bytes) => (bytes / 1048576).toFixed(1);
console.log(`precompress: ${files} files, ${mb(before)} MB -> ${mb(after)} MB (brotli)`);
