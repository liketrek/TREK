import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';

const { broadcastToUser } = vi.hoisted(() => ({ broadcastToUser: vi.fn() }));
vi.mock('../../../../src/websocket', () => ({ broadcastToUser }));

import { ImportJobsService } from '../../../../src/nest/booking-import/import-jobs.service';
import { RealtimeService } from '../../../../src/nest/realtime/realtime.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { Users } from '../../../../src/db/entities/Users.entity';

// R9 (Plan 3h Task 4): `run()` now forks its own `withRequestContext`, so the
// service needs a real `MikroORM` — the `StorageHealthNotifierService`
// precedent (`storage-health-notifier.service.test.ts`) for a hand-built
// double that still needs one.
const testDb = createSnapshotTestDb();
let t: TestOrm;
beforeAll(async () => {
  // Global context disallowed — the production setting — so a passing suite
  // genuinely proves `run()`'s own `withRequestContext` wrap is load-bearing,
  // not merely harmless (the `airports.service.test.ts` precedent).
  t = await createTestOrm(testDb, { allowGlobalContext: false });
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

type Preview = ReturnType<typeof vi.fn>;
function makeService(preview: Preview, readReceipt: Preview = vi.fn()) {
  return new ImportJobsService({ preview } as never, new RealtimeService(), { readReceipt } as never, t.orm);
}
const files = (n: number) => Array.from({ length: n }, (_, i) => ({ originalname: `f${i}.pdf` })) as never;
const eventsFor = (jobId: string) => broadcastToUser.mock.calls.map((c) => c[1]).filter((p) => p.jobId === jobId);

beforeEach(() => vi.clearAllMocks());

describe('ImportJobsService', () => {
  it('runs the parse off-request, reports progress and pushes the result on done', async () => {
    const preview = vi.fn(async (_f, _m, _u, onProgress: (d: number, t: number, name?: string) => void) => {
      onProgress(1, 2, 'f0.pdf');
      return { items: [{ id: 'x' }] };
    });
    const svc = makeService(preview);

    const id = svc.start('7', files(2), 'fallback-on-empty', 42);
    expect(typeof id).toBe('string');

    await vi.waitFor(() => expect(svc.get(id, 42)?.status).toBe('done'));
    const job = svc.get(id, 42)!;
    expect(job.result).toEqual({ items: [{ id: 'x' }] });
    expect(job.done).toBe(1);
    expect(preview).toHaveBeenCalledWith(expect.anything(), 'fallback-on-empty', 42, expect.any(Function));

    const types = eventsFor(id).map((p) => p.type);
    expect(types).toContain('import:progress');
    expect(types).toContain('import:done');
    expect(eventsFor(id).every((p) => p.tripId === '7')).toBe(true);
  });

  it('IMPORTJOBS-CTX-001 (R9 ratchet): start() is called from a bare, non-request context (like every test above) and the detached run() still resolves cleanly — the withRequestContext wrap around it means the missing ambient context never reaches BookingImportService.preview as cannotUseGlobalContext', async () => {
    // Plan 3h Task 7 review, M3: a plain `vi.fn` double for `preview` never
    // touches the ORM at all, so this ratchet stayed green even with the
    // wrap removed (the mutation log's MD4). `preview` now does a REAL read
    // through `t`'s `allowGlobalContext: false` EntityManager — the same
    // instance `beforeAll` built specifically so a passing suite proves the
    // wrap load-bearing, not merely harmless — so it throws
    // "global EntityManager"/`cannotUseGlobalContext` unless `run()`'s own
    // `withRequestContext` fork is actually live when this executes.
    const preview = vi.fn(async () => {
      await t.repo(Users).findOne({ id: -1 });
      return { items: [{ id: 'ctx' }] };
    });
    const svc = makeService(preview);

    const id = svc.start('7', files(1), 'no-ai', 42);
    await vi.waitFor(() => expect(svc.get(id, 42)?.status).toBe('done'));
    const job = svc.get(id, 42)!;
    expect(job.error).toBeUndefined();
    expect(job.result).toEqual({ items: [{ id: 'ctx' }] });
  });

  it('records an error and pushes import:error when the parse throws', async () => {
    const preview = vi.fn(async () => { throw new Error('parse boom'); });
    const svc = makeService(preview);

    const id = svc.start('1', files(1), 'no-ai', 9);
    await vi.waitFor(() => expect(svc.get(id, 9)?.status).toBe('error'));
    expect(svc.get(id, 9)!.error).toBe('parse boom');
    expect(eventsFor(id).map((p) => p.type)).toContain('import:error');
  });

  it('only returns a job to its owner', async () => {
    const svc = makeService(vi.fn(async () => ({ items: [] })));
    const id = svc.start('1', files(1), 'no-ai', 9);
    expect(svc.get(id, 9)).toBeDefined();
    expect(svc.get(id, 999)).toBeUndefined();
    expect(svc.get('does-not-exist', 9)).toBeUndefined();
  });

  it('chains a user\'s parses so they run one at a time', async () => {
    const order: string[] = [];
    const preview = vi.fn(async (f: { originalname: string }[]) => {
      order.push(`start:${f[0].originalname}`);
      await new Promise((r) => setTimeout(r, 5));
      order.push(`end:${f[0].originalname}`);
      return { items: [] };
    });
    const svc = makeService(preview);

    const a = svc.start('1', [{ originalname: 'A.pdf' }] as never, 'no-ai', 5);
    const b = svc.start('1', [{ originalname: 'B.pdf' }] as never, 'no-ai', 5);
    await vi.waitFor(() => expect(svc.get(b, 5)?.status).toBe('done'));
    expect(svc.get(a, 5)?.status).toBe('done');
    // B must not start before A finished — the per-user chain serializes them.
    expect(order).toEqual(['start:A.pdf', 'end:A.pdf', 'start:B.pdf', 'end:B.pdf']);
  });

  it('reports a parse failure as an error job rather than losing it', async () => {
    // The catch arm had no case: a throw inside the off-request parse would have
    // left the job stuck on 'running' and the widget spinning forever.
    const preview = vi.fn(async () => { throw new Error('kitinerary exploded'); });
    const svc = makeService(preview);

    const id = svc.start('7', files(1), 'no-ai', 42);
    await vi.waitFor(() => expect(svc.get(id, 42)?.status).toBe('error'));
    expect(svc.get(id, 42)?.error).toBe('kitinerary exploded');
    expect(eventsFor(id).some((p) => p.message === 'kitinerary exploded')).toBe(true);
  });

  it('turns a non-Error throw into a readable message', async () => {
    const preview = vi.fn(async () => { throw 'just a string'; });
    const svc = makeService(preview);

    const id = svc.start('7', files(1), 'no-ai', 42);
    await vi.waitFor(() => expect(svc.get(id, 42)?.status).toBe('error'));
    expect(svc.get(id, 42)?.error).toBe('just a string');
  });

  it('hides a job from a different user', () => {
    const svc = makeService(vi.fn(async () => ({ items: [] })));
    const id = svc.start('7', files(1), 'no-ai', 42);
    expect(svc.get(id, 99)).toBeUndefined();
  });
});

describe('ImportJobsService.startReceipt', () => {
  it('reads the receipt off-request and pushes the read as the result', async () => {
    const result = { receipt: { merchant: 'Shop', date: null, total: 4, currency: 'EUR', items: [] }, warnings: [] };
    const readReceipt = vi.fn(async () => result);
    const svc = makeService(vi.fn(), readReceipt);
    const id = svc.startReceipt('7', { originalname: 'r.jpg', buffer: Buffer.from('x') } as never, 42);

    await vi.waitFor(() => expect(svc.get(id, 42)?.status).toBe('done'));
    expect(svc.get(id, 42)).toMatchObject({ result, done: 1, total: 1 });
    expect(readReceipt).toHaveBeenCalledWith({ buffer: Buffer.from('x'), originalName: 'r.jpg' }, 42);
    expect(eventsFor(id).find((p) => p.type === 'import:done')).toMatchObject({ result, tripId: '7' });
  });

  it('queues behind the same user\'s booking parse rather than running beside it', async () => {
    let release!: () => void;
    const preview = vi.fn(() => new Promise((resolve) => { release = () => resolve({ items: [] }); }));
    const readReceipt = vi.fn(async () => ({ receipt: null, warnings: [] }));
    const svc = makeService(preview, readReceipt);
    svc.start('7', files(1), 'force-ai', 42);
    const id = svc.startReceipt('7', { originalname: 'r.jpg', buffer: Buffer.from('x') } as never, 42);
    await new Promise((r) => setTimeout(r, 10));
    expect(readReceipt).not.toHaveBeenCalled();
    release();
    await vi.waitFor(() => expect(svc.get(id, 42)?.status).toBe('done'));
  });
});
