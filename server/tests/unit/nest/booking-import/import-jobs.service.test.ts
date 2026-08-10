import { describe, it, expect, vi, beforeEach } from 'vitest';

const { broadcastToUser } = vi.hoisted(() => ({ broadcastToUser: vi.fn() }));
vi.mock('../../../../src/websocket', () => ({ broadcastToUser }));

import { ImportJobsService } from '../../../../src/nest/booking-import/import-jobs.service';
import { RealtimeService } from '../../../../src/nest/realtime/realtime.service';

type Preview = ReturnType<typeof vi.fn>;
function makeService(preview: Preview) {
  return new ImportJobsService({ preview } as never, new RealtimeService());
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
