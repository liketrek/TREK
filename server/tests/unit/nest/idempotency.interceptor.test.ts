import { IdempotencyKeys } from '../../../src/db/entities/IdempotencyKeys.entity';
import type { IdempotencyKeysRepository } from '../../../src/db/repositories/IdempotencyKeys.repository';
import { IdempotencyInterceptor } from '../../../src/nest/common/idempotency.interceptor';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createUser } from '../../helpers/factories';
import { findRow as findStoredRow, insertRow } from '../../helpers/factories/rows';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { HttpException } from '@nestjs/common';
import type { CallHandler, ExecutionContext } from '@nestjs/common';

import { from, of, lastValueFrom } from 'rxjs';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

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

const testDb = createSnapshotTestDb();
let t: TestOrm;
let idempotencyKeys: IdempotencyKeysRepository;
let userId: number;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  idempotencyKeys = t.repo(IdempotencyKeys);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
  const { user } = createUser(testDb);
  userId = user.id;
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const findRow = async (key: string, user: number, method: string, path: string) => {
  const row = await findStoredRow(t, IdempotencyKeys, { key, user, method, path });
  return row ? { status_code: row.status_code, response_body: row.response_body } : undefined;
};

// A few `await Promise.resolve()` hops give the repository's async write
// chain (and its `.finally(release)`) the same room it gets under a real
// event loop, matching the timing this suite already needed before the
// conversion — `insertIfAbsent` is now a genuine repository call, not a
// synchronous `better-sqlite3` write wrapped in a resolved Promise.
async function settle(hops = 8): Promise<void> {
  for (let i = 0; i < hops; i++) await Promise.resolve();
}

describe('IdempotencyInterceptor (parity with the legacy applyIdempotency middleware)', () => {
  it('passes a GET through without touching the store', async () => {
    const h = handler('weather');
    const out = await lastValueFrom(
      await new IdempotencyInterceptor(idempotencyKeys).intercept(ctx({ method: 'GET', headers: {} }, makeRes()), h),
    );
    expect(out).toBe('weather');
    expect(h.handle).toHaveBeenCalled();
  });

  it('passes a mutating request without a key through', async () => {
    const h = handler('done');
    await lastValueFrom(
      await new IdempotencyInterceptor(idempotencyKeys).intercept(
        ctx({ method: 'POST', headers: {}, user: { id: userId } }, makeRes()),
        h,
      ),
    );
    expect(h.handle).toHaveBeenCalled();
  });

  it('passes through when there is no authenticated user', async () => {
    const h = handler('done');
    await lastValueFrom(
      await new IdempotencyInterceptor(idempotencyKeys).intercept(
        ctx({ method: 'POST', headers: { 'x-idempotency-key': 'k' } }, makeRes()),
        h,
      ),
    );
    expect(h.handle).toHaveBeenCalled();
  });

  it('rejects an over-long key with the exact legacy 400 body', async () => {
    const h = handler('done');
    // `intercept` is async now, so the cap is reported as a rejection. Nest's
    // InterceptorsConsumer already awaited the interceptor's result, so a
    // synchronous throw reached it as a rejected promise too: same 400 body.
    const run = () =>
      new IdempotencyInterceptor(idempotencyKeys).intercept(
        ctx({ method: 'POST', headers: { 'x-idempotency-key': 'x'.repeat(129) }, user: { id: userId } }, makeRes()),
        h,
      );
    await expect(run()).rejects.toThrow(HttpException);
    try {
      await run();
    } catch (err) {
      const e = err as HttpException;
      expect(e.getStatus()).toBe(400);
      expect(e.getResponse()).toEqual({ error: 'X-Idempotency-Key exceeds maximum length of 128 characters' });
    }
    expect(h.handle).not.toHaveBeenCalled();
  });

  it('replays a cached response and skips the handler', async () => {
    await insertRow(t, IdempotencyKeys, {
      key: 'k',
      user: userId,
      method: 'POST',
      path: '/api/categories',
      status_code: 201,
      response_body: '{"id":5}',
    });
    const res = makeRes();
    const h = handler('should-not-run');
    const out = await lastValueFrom(
      await new IdempotencyInterceptor(idempotencyKeys).intercept(
        ctx(
          { method: 'POST', headers: { 'x-idempotency-key': 'k' }, path: '/api/categories', user: { id: userId } },
          res,
        ),
        h,
      ),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(out).toEqual({ id: 5 });
    expect(h.handle).not.toHaveBeenCalled();
  });

  it('captures a successful JSON response under the key', async () => {
    const res = makeRes();
    const h = handler({ created: true });
    await lastValueFrom(
      await new IdempotencyInterceptor(idempotencyKeys).intercept(
        ctx(
          { method: 'POST', headers: { 'x-idempotency-key': 'k' }, path: '/api/categories', user: { id: userId } },
          res,
        ),
        h,
      ),
    );
    // Simulate Nest serialising the handler result through the wrapped res.json.
    res.statusCode = 201;
    res.json({ created: true });
    await settle();

    expect(await findRow('k', userId, 'POST', '/api/categories')).toEqual({
      status_code: 201,
      response_body: '{"created":true}',
    });
  });

  it('does not cache a non-2xx response', async () => {
    const res = makeRes();
    const h = handler({ error: 'bad' });
    await lastValueFrom(
      await new IdempotencyInterceptor(idempotencyKeys).intercept(
        ctx(
          { method: 'POST', headers: { 'x-idempotency-key': 'k' }, path: '/api/categories', user: { id: userId } },
          res,
        ),
        h,
      ),
    );
    res.statusCode = 400;
    res.json({ error: 'bad' });
    await settle();

    expect(await findRow('k', userId, 'POST', '/api/categories')).toBeUndefined();
  });

  it('does not cache a body that exceeds the 256 KiB cap', async () => {
    const res = makeRes();
    const big = { blob: 'x'.repeat(300 * 1024) };
    const h = handler(big);
    await lastValueFrom(
      await new IdempotencyInterceptor(idempotencyKeys).intercept(
        ctx(
          { method: 'POST', headers: { 'x-idempotency-key': 'k' }, path: '/api/categories', user: { id: userId } },
          res,
        ),
        h,
      ),
    );
    res.statusCode = 200;
    res.json(big);
    await settle();

    expect(await findRow('k', userId, 'POST', '/api/categories')).toBeUndefined();
  });

  it('swallows a storage failure so the response still succeeds', async () => {
    const failing = {
      findResponse: vi.fn().mockResolvedValue(null),
      insertIfAbsent: vi.fn().mockRejectedValue(new Error('db is locked')),
    } as unknown as IdempotencyKeysRepository;
    const res = makeRes();
    const h = handler({ ok: true });
    await lastValueFrom(
      await new IdempotencyInterceptor(failing).intercept(
        ctx(
          { method: 'POST', headers: { 'x-idempotency-key': 'k' }, path: '/api/categories', user: { id: userId } },
          res,
        ),
        h,
      ),
    );
    res.statusCode = 201;
    const returned = res.json({ ok: true });
    await settle();

    expect(failing.insertIfAbsent).toHaveBeenCalledTimes(1);
    expect(returned).toEqual({ ok: true });
  });

  it('makes an overlapping replay of the same key wait, then answers it from the first response', async () => {
    // The row only appears once the first request answers, so without the
    // in-flight map both of these would miss the SELECT and both would run.
    const interceptor = new IdempotencyInterceptor(idempotencyKeys);

    // The first handler is still running when the second request arrives.
    let finish!: (value: unknown) => void;
    const slow = {
      handle: vi.fn(() =>
        from(
          new Promise((resolve) => {
            finish = resolve;
          }),
        ),
      ),
    };
    const firstRes = makeRes();
    const first = lastValueFrom(
      await interceptor.intercept(
        ctx(
          { method: 'POST', headers: { 'x-idempotency-key': 'k' }, path: '/api/places', user: { id: userId } },
          firstRes,
        ),
        slow,
      ),
    );

    const secondHandler = handler({ id: 'second' });
    const secondRes = makeRes();
    const second = lastValueFrom(
      await interceptor.intercept(
        ctx(
          { method: 'POST', headers: { 'x-idempotency-key': 'k' }, path: '/api/places', user: { id: userId } },
          secondRes,
        ),
        secondHandler,
      ),
    );

    // The order Nest uses, and the one that makes this test worth having: the
    // handler's observable completes FIRST, and the response - which is what
    // stores the row - is written a few microtasks later. Release the waiter any
    // earlier and it looks the key up, misses, and runs the handler again.
    finish({ id: 'first' });
    // Nest is several microtask hops from the completion to the write
    // (transformToResult -> lastValueFrom -> apply), so give the waiter the same
    // room it gets in production to wake up too early — plus the repository
    // write's own async chain (`insertIfAbsent`'s promise + its `.finally`).
    firstRes.statusCode = 201;
    firstRes.json({ id: 'first' });
    await settle(12);

    expect(await first).toEqual({ id: 'first' });
    expect(await second).toEqual({ id: 'first' });
    expect(secondHandler.handle).not.toHaveBeenCalled();
    expect(secondRes.status).toHaveBeenCalledWith(201);
  });

  it('runs the waiting request itself when the first one cached nothing', async () => {
    const interceptor = new IdempotencyInterceptor(idempotencyKeys);

    let finish!: (value: unknown) => void;
    const slow = {
      handle: vi.fn(() =>
        from(
          new Promise((resolve) => {
            finish = resolve;
          }),
        ),
      ),
    };
    const first = lastValueFrom(
      await interceptor.intercept(
        ctx(
          { method: 'POST', headers: { 'x-idempotency-key': 'k' }, path: '/api/places', user: { id: userId } },
          makeRes(),
        ),
        slow,
      ),
    );

    const secondHandler = handler({ id: 'second' });
    const second = lastValueFrom(
      await interceptor.intercept(
        ctx(
          { method: 'POST', headers: { 'x-idempotency-key': 'k' }, path: '/api/places', user: { id: userId } },
          makeRes(),
        ),
        secondHandler,
      ),
    );

    // Nothing writes a response here, so the waiter is freed by the backstop in
    // finalize, which defers a full tick past the response write.
    finish({ id: 'first' });
    await first;
    expect(await second).toEqual({ id: 'second' });
    expect(secondHandler.handle).toHaveBeenCalled();
  });

  it('treats a PATCH as a mutating method', async () => {
    const res = makeRes();
    const h = handler('done');
    await lastValueFrom(
      await new IdempotencyInterceptor(idempotencyKeys).intercept(
        ctx(
          { method: 'PATCH', headers: { 'x-idempotency-key': 'k' }, path: '/api/categories/1', user: { id: userId } },
          res,
        ),
        h,
      ),
    );
    expect(h.handle).toHaveBeenCalled();
  });

  it('IDEMP-RACE-001 (rule 11 mutation proof): the in-flight slot is claimed BEFORE the first await, so a concurrent request for the same key never issues its own lookup', async () => {
    // Regression guard for the exact bug rule 11 warns about: if
    // `inFlight.set()` (this.claim) were moved back to AFTER `await
    // this.lookup(...)`, the SECOND call below would run its synchronous
    // prefix (which now includes NO claim yet) before the first call's
    // lookup — gated open here by `gate` — resolves, and would issue its own
    // `findResponse` call instead of finding `pending` and waiting. Holding
    // the repository's lookup open with a controlled promise makes the race
    // window deterministic instead of timing-dependent.
    let resolveLookup!: () => void;
    const gate = new Promise<void>((resolve) => {
      resolveLookup = resolve;
    });
    const findResponse = vi.fn(async () => {
      await gate;
      return null;
    });
    const gatedRepo = {
      findResponse,
      insertIfAbsent: vi.fn().mockResolvedValue(undefined),
    } as unknown as IdempotencyKeysRepository;
    const interceptor = new IdempotencyInterceptor(gatedRepo);

    const firstHandler = handler({ id: 'a' });
    const secondHandler = handler({ id: 'b' });
    const reqOpts = {
      method: 'POST',
      headers: { 'x-idempotency-key': 'race' },
      path: '/api/places',
      user: { id: userId },
    };

    // Fired back to back, synchronously — exactly how two nearly-simultaneous
    // HTTP requests reach the interceptor.
    const firstPromise = interceptor.intercept(ctx(reqOpts, makeRes()), firstHandler);
    const secondPromise = interceptor.intercept(ctx(reqOpts, makeRes()), secondHandler);

    // Both `intercept()` calls have now run their full synchronous prefix
    // (each up to its own first genuine await) while `gate` is still open.
    await Promise.resolve();
    expect(findResponse).toHaveBeenCalledTimes(1);

    resolveLookup();
    await Promise.all([firstPromise, secondPromise]);
  });
});
