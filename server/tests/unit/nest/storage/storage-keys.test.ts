import {
  isValidKey,
  assertValidKey,
  isValidPrefix,
  assertValidPrefix,
} from '../../../../src/nest/storage/storage-keys';
import {
  DEFAULT_UPLOADS_ROOT,
  DEFAULT_BACKUPS_ROOT,
  GLOBAL_TEMP_DIR,
} from '../../../../src/nest/storage/storage-paths';
import { StorageInvalidKeyError } from '../../../../src/nest/storage/storage.types';

import path from 'node:path';
import { describe, it, expect } from 'vitest';

// Central key validation (spec: storage-keys.ts owns the rules; drivers and
// routes never re-implement them). Every rejected shape here replaces one of
// the scattered per-route guards the refactor retires.
describe('storage keys', () => {
  const validKeys = [
    'files/a.pdf',
    'journey/thumbs/ab12.jpg',
    'backup-2026.zip', // backups category uses bare keys (spec rev 3.1)
    'photos/trek/deadbeef.bin',
    // legacy photos/<filename> keys are user-named flat files — spaces stay valid
    'photos/my holiday pic.jpg',
  ];

  const invalidKeys = [
    '', // empty
    '/abs', // absolute
    'a\\b', // backslash
    'a//b', // empty segment
    'a/', // trailing slash = empty segment
    '../x', // traversal
    'a/../b', // embedded traversal
    '.', // dot segment
    '..', // dot-dot segment
    '.tmp/x', // leading-dot segment (spool must be unreachable)
    'a/.hidden', // dotfile segment
    'a\u0000b', // control character
    `a/${'x'.repeat(1024)}`, // over length cap
  ];

  it.each(validKeys)('accepts %j', (key) => {
    expect(isValidKey(key)).toBe(true);
    expect(() => assertValidKey(key)).not.toThrow();
  });

  it.each(invalidKeys)('rejects %j', (key) => {
    expect(isValidKey(key)).toBe(false);
    expect(() => assertValidKey(key)).toThrow(StorageInvalidKeyError);
  });

  it('caps keys at 1024 chars (boundary)', () => {
    const exactly1024 = `a/${'x'.repeat(1022)}`;
    expect(exactly1024.length).toBe(1024);
    expect(isValidKey(exactly1024)).toBe(true);
    expect(isValidKey(`${exactly1024}x`)).toBe(false);
  });

  describe('prefixes', () => {
    it.each(['', 'thumbs/', 'thumbs', 'photos/google/'])('accepts %j', (prefix) => {
      expect(isValidPrefix(prefix)).toBe(true);
      expect(() => assertValidPrefix(prefix)).not.toThrow();
    });

    it.each(['../', '/abs', '.tmp/', 'a//b/', 'a\\b'])('rejects %j', (prefix) => {
      expect(isValidPrefix(prefix)).toBe(false);
      expect(() => assertValidPrefix(prefix)).toThrow(StorageInvalidKeyError);
    });
  });
});

// Depth contract for the storage domain's one __dirname anchor (the guard the
// deleted memories/uploads-root.ts pin used to carry): the resolved defaults
// must equal the paths the server has always used, under both src (vitest) and
// dist layouts.
describe('storage default paths', () => {
  it('anchors the default uploads root at <server>/uploads', () => {
    expect(DEFAULT_UPLOADS_ROOT).toBe(path.resolve(process.cwd(), 'uploads'));
  });

  it('anchors the default backups root at <server>/data/backups', () => {
    expect(DEFAULT_BACKUPS_ROOT).toBe(path.resolve(process.cwd(), 'data/backups'));
  });

  it('anchors the global temp dir at <server>/data/tmp', () => {
    expect(GLOBAL_TEMP_DIR).toBe(path.resolve(process.cwd(), 'data/tmp'));
  });
});
