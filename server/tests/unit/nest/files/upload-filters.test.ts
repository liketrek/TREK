import type { AllowedFileTypesService } from '../../../../src/nest/files/allowed-file-types.service';
import { filesUploadFileFilter } from '../../../../src/nest/files/files.controller';
import { journeyImageFileFilter } from '../../../../src/nest/journey/journey.controller';

import type { Request } from 'express';
import { describe, it, expect, vi } from 'vitest';

/**
 * Unit coverage for the two upload fileFilters that read the operator's
 * allowed-extension list asynchronously (files.controller.ts,
 * journey.controller.ts). Both filters run a synchronous pre-check first (a
 * blocked extension / non-image mimetype), then a detached async IIFE that
 * always answers through `cb` exactly once — even when the allow-list lookup
 * itself rejects (fail closed, never `cb(null, true)`).
 */

const req = {} as Request;

function fakeFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 100,
    stream: undefined as never,
    destination: '',
    filename: '',
    path: '',
    buffer: undefined as never,
    ...overrides,
  };
}

/** A stub whose get() can either resolve to a comma-separated list or reject. */
function allowedTypesStub(result: string | Error): AllowedFileTypesService {
  return {
    get: vi.fn(() => (result instanceof Error ? Promise.reject(result) : Promise.resolve(result))),
  } as unknown as AllowedFileTypesService;
}

/** Wait a couple of microtask turns so the filter's detached async IIFE settles. */
async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('filesUploadFileFilter', () => {
  it('UPLOAD-FILTER-001: a blocked extension is rejected synchronously, before the allow-list is read', async () => {
    const allowedTypes = allowedTypesStub('jpg,png');
    const filter = filesUploadFileFilter(allowedTypes)!;
    const cb = vi.fn();
    filter(req, fakeFile({ originalname: 'malware.exe', mimetype: 'application/octet-stream' }), cb);
    await flush();
    expect(cb).toHaveBeenCalledTimes(1);
    const err = cb.mock.calls[0][0] as (Error & { statusCode?: number }) | null;
    expect(err).toBeInstanceOf(Error);
    expect(err?.statusCode).toBe(400);
    expect(allowedTypes.get).not.toHaveBeenCalled();
  });

  it('UPLOAD-FILTER-002: an unresolvable allow-list rejects the file, never cb(null, true)', async () => {
    const allowedTypes = allowedTypesStub(new Error('db down'));
    const filter = filesUploadFileFilter(allowedTypes)!;
    const cb = vi.fn();
    filter(req, fakeFile({ originalname: 'photo.jpg', mimetype: 'image/jpeg' }), cb);
    await flush();
    expect(cb).toHaveBeenCalledTimes(1);
    const [err, accept] = cb.mock.calls[0] as [(Error & { statusCode?: number }) | null, boolean | undefined];
    expect(err).toBeInstanceOf(Error);
    expect(accept).toBeUndefined();
  });

  it('UPLOAD-FILTER-003: an allowed extension resolves cb(null, true) exactly once', async () => {
    const allowedTypes = allowedTypesStub('jpg,png');
    const filter = filesUploadFileFilter(allowedTypes)!;
    const cb = vi.fn();
    filter(req, fakeFile({ originalname: 'photo.jpg', mimetype: 'image/jpeg' }), cb);
    await flush();
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('UPLOAD-FILTER-007: an error escaping the detached IIFE (outside the allow-list try/catch) still answers cb, not an unhandled rejection', async () => {
    const allowedTypes = allowedTypesStub('jpg,png');
    const filter = filesUploadFileFilter(allowedTypes)!;
    const cb = vi.fn().mockImplementationOnce(() => {
      throw new Error('cb blew up');
    });
    filter(req, fakeFile({ originalname: 'photo.jpg', mimetype: 'image/jpeg' }), cb);
    await flush();
    // First call is the filter's own cb(null, true), which throws; the outer
    // .catch() answers a second time with the escaped error rather than
    // leaving the request hanging or crashing the process.
    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenNthCalledWith(1, null, true);
    const secondErr = cb.mock.calls[1][0] as Error;
    expect(secondErr).toBeInstanceOf(Error);
    expect(secondErr.message).toBe('cb blew up');
  });
});

describe('journeyImageFileFilter', () => {
  it('UPLOAD-FILTER-004: a non-image mimetype is rejected synchronously, before the allow-list is read', async () => {
    const allowedTypes = allowedTypesStub('jpg,png');
    const filter = journeyImageFileFilter(allowedTypes)!;
    const cb = vi.fn();
    filter(req, fakeFile({ originalname: 'notes.pdf', mimetype: 'application/pdf' }), cb);
    await flush();
    expect(cb).toHaveBeenCalledTimes(1);
    const err = cb.mock.calls[0][0] as (Error & { statusCode?: number }) | null;
    expect(err).toBeInstanceOf(Error);
    expect(err?.statusCode).toBe(400);
    expect(allowedTypes.get).not.toHaveBeenCalled();
  });

  it('UPLOAD-FILTER-005: an unresolvable allow-list rejects the file, never cb(null, true)', async () => {
    const allowedTypes = allowedTypesStub(new Error('db down'));
    const filter = journeyImageFileFilter(allowedTypes)!;
    const cb = vi.fn();
    filter(req, fakeFile({ originalname: 'photo.jpg', mimetype: 'image/jpeg' }), cb);
    await flush();
    expect(cb).toHaveBeenCalledTimes(1);
    const [err, accept] = cb.mock.calls[0] as [(Error & { statusCode?: number }) | null, boolean | undefined];
    expect(err).toBeInstanceOf(Error);
    expect(accept).toBeUndefined();
  });

  it('UPLOAD-FILTER-006: an allowed image extension resolves cb(null, true) exactly once', async () => {
    const allowedTypes = allowedTypesStub('jpg,png');
    const filter = journeyImageFileFilter(allowedTypes)!;
    const cb = vi.fn();
    filter(req, fakeFile({ originalname: 'photo.jpg', mimetype: 'image/jpeg' }), cb);
    await flush();
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('UPLOAD-FILTER-007: an error escaping the detached IIFE (outside the allow-list try/catch) still answers cb, not an unhandled rejection', async () => {
    const allowedTypes = allowedTypesStub('jpg,png');
    const filter = journeyImageFileFilter(allowedTypes)!;
    const cb = vi.fn().mockImplementationOnce(() => {
      throw new Error('cb blew up');
    });
    filter(req, fakeFile({ originalname: 'photo.jpg', mimetype: 'image/jpeg' }), cb);
    await flush();
    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenNthCalledWith(1, null, true);
    const secondErr = cb.mock.calls[1][0] as Error;
    expect(secondErr).toBeInstanceOf(Error);
    expect(secondErr.message).toBe('cb blew up');
  });
});
