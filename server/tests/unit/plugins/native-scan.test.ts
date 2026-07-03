/**
 * Native-binary scan (#plugins, M4): .node / binding.gyp / prebuilds are
 * forbidden; symlinks are never followed.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scanForNativeBinaries } from '../../../src/nest/plugins/install/native-scan';

let dir: string;
beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nscan-')); });
afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

describe('scanForNativeBinaries', () => {
  it('is clean for a plain JS plugin', () => {
    fs.mkdirSync(path.join(dir, 'server'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'server', 'index.js'), 'module.exports = {}');
    expect(scanForNativeBinaries(dir)).toEqual([]);
  });

  it('flags .node binaries, binding.gyp and prebuilds/', () => {
    fs.mkdirSync(path.join(dir, 'node_modules', 'sharp', 'prebuilds'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'node_modules', 'sharp', 'sharp.node'), '\0');
    fs.writeFileSync(path.join(dir, 'node_modules', 'sharp', 'binding.gyp'), '{}');
    fs.writeFileSync(path.join(dir, 'node_modules', 'sharp', 'prebuilds', 'x.txt'), 'x');
    const hits = scanForNativeBinaries(dir);
    expect(hits.some((h) => h.endsWith('sharp.node'))).toBe(true);
    expect(hits.some((h) => h.endsWith('binding.gyp'))).toBe(true);
    expect(hits.some((h) => h.includes('prebuilds'))).toBe(true);
  });
});
