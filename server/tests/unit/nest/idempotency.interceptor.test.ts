import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { IdempotencyInterceptor } from '../../../src/nest/common/idempotency.interceptor';
import type { DatabaseService } from '../../../src/nest/database/database.service';

type ReqShape = {
  method: string;
  headers: Record<string, string>;
  path?: string;
  user?: { id: number };
};

function makeRes() {
  const res = {
    statusCode: 200,
    status: vi.fn((code: number) => {
      res.statusCode = code;
      return res;
    }),
    json: vi.fn((body: unknown) => body),
  };
  return res;
}

function ctx(req: ReqShape, res: ReturnType<typeof makeRes>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
  } as unknown as ExecutionContext;
}

function handler(result: unknown): CallHandler & { handle: ReturnType<typeof vi.fn> } {
  return { handle: vi.fn(() => of(result)) };
}

function makeDb(overrides: Partial<DatabaseService> = {}): DatabaseService {
  return { get: vi.fn(), run: vi.fn(), ...overrides } as unknown as DatabaseService;
}

describe('IdempotencyInterceptor (parity with the legacy applyIdempotency middleware)', () => {
  it('passes a GET through without touching the store', async () => {
    const db = makeDb();
    const h = handler('weather');
    const out = await lastValueFrom(
      new IdempotencyInterceptor(db).intercept(ctx({ method: 'GET', headers: {} }, makeRes()), h),
    );
    expect(out).toBe('weather');
    expect(h.handle).toHaveBeenCalled();
    expect(db.get).not.toHaveBeenCalled();
  });

  it('passes a mutating request without a key through', async () => {
    const db = makeDb();
    const h = handler('done');
    await lastValueFrom(
      new IdempotencyInterceptor(db).intercept(ctx({ method: 'POST', headers: {}, user: { id: 1 } }, makeRes()), h),
    );
    expect(h.handle).toHaveBeenCalled();
    expect(db.get).not.toHaveBeenCalled();
  });

  it('passes through when there is no authenticated user', async () => {
    const db = makeDb();
    const h = handler('done');
    await lastValueFrom(
      new IdempotencyInterceptor(db).intercept(ctx({ method: 'POST', headers: { 'x-idempotency-key': 'k' } }, makeRes()), h),
    );
    expect(h.handle).toHaveBeenCalled();
    expect(db.get).not.toHaveBeenCalled();
  });

  it('rejects an over-long key with the exact legacy 400 body', () => {
    const db = makeDb();
    const h = handler('done');
    const run = () =>
      new IdempotencyInterceptor(db).intercept(
        ctx({ method: 'POST', headers: { 'x-idempotency-key': 'x'.repeat(129) }, user: { id: 1 } }, makeRes()),
        h,
      );
    expect(run).toThrow(HttpException);
    try {
      run();
    } catch (err) {
      const e = err as HttpException;
      expect(e.getStatus()).toBe(400);
      expect(e.getResponse()).toEqual({ error: 'X-Idempotency-Key exceeds maximum length of 128 characters' });
    }
    expect(h.handle).not.toHaveBeenCalled();
  });

  it('replays a cached response and skips the handler', async () => {
    const db = makeDb({ get: vi.fn().mockReturnValue({ status_code: 201, response_body: '{"id":5}' }) });
    const res = makeRes();
    const h = handler('should-not-run');
    const out = await lastValueFrom(
      new IdempotencyInterceptor(db).intercept(
        ctx({ method: 'POST', headers: { 'x-idempotency-key': 'k' }, path: '/api/categories', user: { id: 1 } }, res),
        h,
      ),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(out).toEqual({ id: 5 });
    expect(h.handle).not.toHaveBeenCalled();
    expect(db.get).toHaveBeenCalledWith(
      expect.stringContaining('idempotency_keys'),
      'k', 1, 'POST', '/api/categories',
    );
  });

  it('captures a successful JSON response under the key', async () => {
    const run = vi.fn();
    const db = makeDb({ get: vi.fn().mockReturnValue(undefined), run });
    const res = makeRes();
    const h = handler({ created: true });
    await lastValueFrom(
      new IdempotencyInterceptor(db).intercept(
        ctx({ method: 'POST', headers: { 'x-idempotency-key': 'k' }, path: '/api/categories', user: { id: 1 } }, res),
        h,
      ),
    );
    // Simulate Nest serialising the handler result through the wrapped res.json.
    res.statusCode = 201;
    res.json({ created: true });
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR IGNORE INTO idempotency_keys'),
      'k', 1, 'POST', '/api/categories', 201, '{"created":true}', expect.any(Number),
    );
  });

  it('does not cache a non-2xx response', async () => {
    const run = vi.fn();
    const db = makeDb({ get: vi.fn().mockReturnValue(undefined), run });
    const res = makeRes();
    const h = handler({ error: 'bad' });
    await lastValueFrom(
      new IdempotencyInterceptor(db).intercept(
        ctx({ method: 'POST', headers: { 'x-idempotency-key': 'k' }, path: '/api/categories', user: { id: 1 } }, res),
        h,
      ),
    );
    res.statusCode = 400;
    res.json({ error: 'bad' });
    expect(run).not.toHaveBeenCalled();
  });

  it('does not cache a body that exceeds the 256 KiB cap', async () => {
    const run = vi.fn();
    const db = makeDb({ get: vi.fn().mockReturnValue(undefined), run });
    const res = makeRes();
    const big = { blob: 'x'.repeat(300 * 1024) };
    const h = handler(big);
    await lastValueFrom(
      new IdempotencyInterceptor(db).intercept(
        ctx({ method: 'POST', headers: { 'x-idempotency-key': 'k' }, path: '/api/categories', user: { id: 1 } }, res),
        h,
      ),
    );
    res.statusCode = 200;
    res.json(big);
    expect(run).not.toHaveBeenCalled();
  });

  it('swallows a storage failure so the response still succeeds', async () => {
    const run = vi.fn(() => {
      throw new Error('db is locked');
    });
    const db = makeDb({ get: vi.fn().mockReturnValue(undefined), run });
    const res = makeRes();
    const h = handler({ ok: true });
    await lastValueFrom(
      new IdempotencyInterceptor(db).intercept(
        ctx({ method: 'POST', headers: { 'x-idempotency-key': 'k' }, path: '/api/categories', user: { id: 1 } }, res),
        h,
      ),
    );
    res.statusCode = 201;
    const returned = res.json({ ok: true });
    expect(run).toHaveBeenCalledTimes(1);
    expect(returned).toEqual({ ok: true });
  });

  it('treats a PATCH as a mutating method', async () => {
    const db = makeDb({ get: vi.fn().mockReturnValue(undefined), run: vi.fn() });
    const res = makeRes();
    const h = handler('done');
    await lastValueFrom(
      new IdempotencyInterceptor(db).intercept(
        ctx({ method: 'PATCH', headers: { 'x-idempotency-key': 'k' }, path: '/api/categories/1', user: { id: 1 } }, res),
        h,
      ),
    );
    expect(db.get).toHaveBeenCalled();
    expect(h.handle).toHaveBeenCalled();
  });
});
