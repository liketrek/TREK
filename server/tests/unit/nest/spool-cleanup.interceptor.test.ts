import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firstValueFrom, of, throwError } from 'rxjs';
import type { Observable } from 'rxjs';
import type { CallHandler, ExecutionContext } from '@nestjs/common';

const fsMock = vi.hoisted(() => ({ unlinkSync: vi.fn() }));
vi.mock('fs', () => ({ ...fsMock, default: fsMock }));

import { SpoolCleanupInterceptor } from '../../../src/nest/common/spool-cleanup.interceptor';

function context(req: Record<string, unknown>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext;
}

function handler(observable: Observable<unknown>): CallHandler {
  return { handle: () => observable } as CallHandler;
}

const interceptor = new SpoolCleanupInterceptor();

beforeEach(() => {
  fsMock.unlinkSync.mockReset();
});

describe('SpoolCleanupInterceptor', () => {
  it('SPOOL-001: leaves the spool alone when the handler succeeds', async () => {
    const req = { files: [{ path: '/tmp/a.png' }] };
    await firstValueFrom(interceptor.intercept(context(req), handler(of('ok'))));
    // A handler that returned owns its files and moves them itself.
    expect(fsMock.unlinkSync).not.toHaveBeenCalled();
  });

  it('SPOOL-002: removes every spooled part when the request dies before the handler', async () => {
    const req = { files: [{ path: '/tmp/a.png' }, { path: '/tmp/b.png' }] };
    const boom = new Error('body rejected');

    await expect(firstValueFrom(interceptor.intercept(context(req), handler(throwError(() => boom)))))
      .rejects.toBe(boom);
    expect(fsMock.unlinkSync.mock.calls.map(c => c[0])).toEqual(['/tmp/a.png', '/tmp/b.png']);
  });

  it('SPOOL-003: covers the single-file shape and skips a part with no path', async () => {
    const req = { file: { path: '/tmp/one.png' }, files: [{ path: undefined }] };
    await expect(firstValueFrom(interceptor.intercept(context(req), handler(throwError(() => new Error('x'))))))
      .rejects.toThrow('x');
    expect(fsMock.unlinkSync.mock.calls.map(c => c[0])).toEqual(['/tmp/one.png']);
  });

  it('SPOOL-004: a file the handler already moved does not turn into a second failure', async () => {
    fsMock.unlinkSync.mockImplementation(() => { throw new Error('ENOENT'); });
    const req = { files: [{ path: '/tmp/gone.png' }] };
    await expect(firstValueFrom(interceptor.intercept(context(req), handler(throwError(() => new Error('original'))))))
      .rejects.toThrow('original');
  });

  it('SPOOL-005: a request that carried no files at all is a no-op', async () => {
    await expect(firstValueFrom(interceptor.intercept(context({}), handler(throwError(() => new Error('x'))))))
      .rejects.toThrow('x');
    expect(fsMock.unlinkSync).not.toHaveBeenCalled();
  });
});
