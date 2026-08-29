/**
 * Unit tests for buildStorageUploadOptions — the multer options factory every
 * upload call site consumes via MulterModule.registerAsync.
 *
 * STORAGE-UPLOAD-001 … 010.
 *
 * The diskStorage engine exposes its destination/filename callbacks as
 * getDestination/getFilename on the engine instance (multer/storage/disk.js),
 * so the tests drive them directly instead of streaming a real request.
 */
import { buildStorageUploadOptions } from '../../../../src/nest/storage/storage-upload.factory';
import type { StorageService } from '../../../../src/nest/storage/storage.service';
import type { StorageCategory } from '../../../../src/nest/storage/storage.types';

import type { Request } from 'express';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

interface DiskEngine {
  getDestination: (req: Request, file: Express.Multer.File, cb: (err: Error | null, dir: string) => void) => void;
  getFilename: (req: Request, file: Express.Multer.File, cb: (err: Error | null, name: string) => void) => void;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function fakeFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return { fieldname: 'file', originalname: 'doc.pdf', ...overrides } as Express.Multer.File;
}

const req = {} as Request;

function destination(engine: DiskEngine, file: Express.Multer.File): Promise<string> {
  return new Promise((resolve, reject) =>
    engine.getDestination(req, file, (err, dir) => (err ? reject(err) : resolve(dir))),
  );
}

function filename(engine: DiskEngine, file: Express.Multer.File): Promise<string> {
  return new Promise((resolve, reject) =>
    engine.getFilename(req, file, (err, name) => (err ? reject(err) : resolve(name))),
  );
}

describe('buildStorageUploadOptions', () => {
  let dirA: string;
  let dirB: string;

  beforeAll(() => {
    dirA = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-upload-factory-a-'));
    dirB = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-upload-factory-b-'));
  });

  afterAll(() => {
    fs.rmSync(dirA, { recursive: true, force: true });
    fs.rmSync(dirB, { recursive: true, force: true });
  });

  it('STORAGE-UPLOAD-001 — destination resolves spoolDirFor per request, never cached', async () => {
    const spoolDirFor = vi.fn(() => dirA);
    const storage = { spoolDirFor } as unknown as StorageService;
    const opts = buildStorageUploadOptions(storage, { category: 'files', maxSize: 10 });
    const engine = opts.storage as unknown as DiskEngine;

    expect(await destination(engine, fakeFile())).toBe(dirA);
    spoolDirFor.mockReturnValue(dirB);
    expect(await destination(engine, fakeFile())).toBe(dirB);
    expect(spoolDirFor).toHaveBeenCalledTimes(2);
    expect(spoolDirFor).toHaveBeenCalledWith('files');
  });

  it('STORAGE-UPLOAD-002 — destination creates the spool dir if missing', async () => {
    const missing = path.join(dirA, 'not-yet-created');
    const storage = { spoolDirFor: () => missing } as unknown as StorageService;
    const opts = buildStorageUploadOptions(storage, { category: 'files', maxSize: 10 });
    const engine = opts.storage as unknown as DiskEngine;

    expect(await destination(engine, fakeFile())).toBe(missing);
    expect(fs.existsSync(missing)).toBe(true);
  });

  it('STORAGE-UPLOAD-003 — category resolver receives (req, file) and routes per file', async () => {
    const spoolDirFor = vi.fn((cat: StorageCategory) => (cat === 'places' ? dirA : dirB));
    const storage = { spoolDirFor } as unknown as StorageService;
    const category = vi.fn(
      (_r: Request, file: Express.Multer.File): StorageCategory => (file.fieldname === 'image' ? 'places' : 'covers'),
    );
    const opts = buildStorageUploadOptions(storage, { category, maxSize: 10 });
    const engine = opts.storage as unknown as DiskEngine;

    expect(await destination(engine, fakeFile({ fieldname: 'image' }))).toBe(dirA);
    expect(await destination(engine, fakeFile({ fieldname: 'cover' }))).toBe(dirB);
    expect(spoolDirFor).toHaveBeenNthCalledWith(1, 'places');
    expect(spoolDirFor).toHaveBeenNthCalledWith(2, 'covers');
    expect(category).toHaveBeenCalledWith(req, expect.objectContaining({ fieldname: 'cover' }));
  });

  it('STORAGE-UPLOAD-004 — destination surfaces spoolDirFor errors through the callback', async () => {
    const boom = new Error('registry not initialized');
    const storage = {
      spoolDirFor: () => {
        throw boom;
      },
    } as unknown as StorageService;
    const opts = buildStorageUploadOptions(storage, { category: 'files', maxSize: 10 });
    const engine = opts.storage as unknown as DiskEngine;

    await expect(destination(engine, fakeFile())).rejects.toBe(boom);
  });

  it('STORAGE-UPLOAD-005 — default filename is a v4 uuid with the case-preserved extension', async () => {
    const storage = { spoolDirFor: () => dirA } as unknown as StorageService;
    const opts = buildStorageUploadOptions(storage, { category: 'files', maxSize: 10 });
    const engine = opts.storage as unknown as DiskEngine;

    const upper = await filename(engine, fakeFile({ originalname: 'Photo.JPG' }));
    expect(upper).toMatch(/\.JPG$/);
    expect(upper.slice(0, -4)).toMatch(UUID_RE);
  });

  it('STORAGE-UPLOAD-006 — default filename has no fallback extension for extensionless names', async () => {
    const storage = { spoolDirFor: () => dirA } as unknown as StorageService;
    const opts = buildStorageUploadOptions(storage, { category: 'files', maxSize: 10 });
    const engine = opts.storage as unknown as DiskEngine;

    expect(await filename(engine, fakeFile({ originalname: 'noext' }))).toMatch(UUID_RE);
  });

  it('STORAGE-UPLOAD-007 — a custom filename hook is used verbatim', async () => {
    const storage = { spoolDirFor: () => dirA } as unknown as StorageService;
    const opts = buildStorageUploadOptions(storage, {
      category: 'journey',
      maxSize: 10,
      filename: (_r, file) => (file.fieldname === 'poster' ? 'forced.jpg' : 'other.bin'),
    });
    const engine = opts.storage as unknown as DiskEngine;

    expect(await filename(engine, fakeFile({ fieldname: 'poster', originalname: 'x.html' }))).toBe('forced.jpg');
    expect(await filename(engine, fakeFile({ fieldname: 'video' }))).toBe('other.bin');
  });

  it('STORAGE-UPLOAD-008 — maxSize becomes limits.fileSize', () => {
    const storage = { spoolDirFor: () => dirA } as unknown as StorageService;
    const opts = buildStorageUploadOptions(storage, { category: 'files', maxSize: 123456 });
    expect(opts.limits).toEqual({ fileSize: 123456 });
  });

  it('STORAGE-UPLOAD-009 — fileFilter passes through untouched, and is absent when not given', () => {
    const storage = { spoolDirFor: () => dirA } as unknown as StorageService;
    const filter = vi.fn();
    const withFilter = buildStorageUploadOptions(storage, { category: 'files', maxSize: 10, fileFilter: filter });
    expect(withFilter.fileFilter).toBe(filter);

    const without = buildStorageUploadOptions(storage, { category: 'files', maxSize: 10 });
    expect('fileFilter' in without).toBe(false);
  });

  it('STORAGE-UPLOAD-010 — defParamCharset defaults to utf8 everywhere (fix #3)', () => {
    const storage = { spoolDirFor: () => dirA } as unknown as StorageService;
    const without = buildStorageUploadOptions(storage, { category: 'files', maxSize: 10 });
    expect((without as { defParamCharset?: string }).defParamCharset).toBe('utf8');

    const withCharset = buildStorageUploadOptions(storage, { category: 'files', maxSize: 10, defParamCharset: 'utf8' });
    expect((withCharset as { defParamCharset?: string }).defParamCharset).toBe('utf8');
  });
});
