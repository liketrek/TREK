/**
 * Where the router runs (PAD-11): the graphs a thread keeps loaded, the
 * runner on the calling thread, the router thread's own script, and the
 * runner that talks to a thread, here with small threads written by the
 * test that answer, fail, hang or die. Also the graph file's format.
 */
import { importExtract } from '../../../../src/nest/paddle-obstacles/paddle-import';
import { GraphCache, InlineRouterRunner, type RouteJob } from '../../../../src/nest/paddle-routing/router-runner';
import { decodeWaterGraph, encodeWaterGraph } from '../../../../src/nest/paddle-routing/water-graph';
import { WorkerRouterRunner } from '../../../../src/nest/paddle-routing/worker-router-runner';
import { WaterWorld } from '../../../helpers/water-world';

import { mkdtemp, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

/** The router thread's port, as its script sees it: messages in, messages out. */
const port = vi.hoisted(() => {
  const listeners: Array<(message: unknown) => void> = [];
  return {
    on: (event: string, listener: (message: unknown) => void) => {
      if (event === 'message') listeners.push(listener);
    },
    emit: (_event: 'message', message: unknown) => listeners.forEach((listener) => listener(message)),
    postMessage: vi.fn(),
  };
});
vi.mock('node:worker_threads', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:worker_threads')>()),
  parentPort: port,
}));

let dir: string;
let file: string;
const world = new WaterWorld();
world.line(
  [
    [0, 4000],
    [0, 0],
  ],
  { waterway: 'river', name: 'Regen' },
);
const PROFILE = { boat: 'kayak' as const, lakeStyle: 'direct' as const, lockPolicy: 'auto' as const };
const job = (path: string): RouteJob => ({
  file: path,
  legs: [{ from: world.at(0, 3500), to: world.at(0, 500) }],
  profile: PROFILE,
});

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'trek-router-runner-'));
  const pbf = join(dir, 'world.osm.pbf');
  await writeFile(pbf, world.pbf());
  const { graph } = await importExtract(pbf, 'runner', () => undefined);
  if (!graph) throw new Error('no network');
  file = join(dir, 'region.wgraph');
  await writeFile(file, graph.bytes);
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('the water graph file', () => {
  it('PADRUN-001: the same graph gives the same bytes and revision; a foreign or newer file is refused', async () => {
    const { readFile } = await import('node:fs/promises');
    const bytes = await readFile(file);
    const again = encodeWaterGraph(decodeWaterGraph(bytes));
    expect(Buffer.compare(again.bytes, bytes)).toBe(0);
    expect(again.rev).toMatch(/^[0-9a-f]{16}$/);

    expect(() => decodeWaterGraph(Buffer.from('PK\u0003\u0004 not a graph at all'))).toThrow('Not a water graph');
    // The magic TREKWG, then the head's length, then the head.
    const headLength = bytes.readUInt32LE(6);
    const head = bytes.toString('utf8', 10, 10 + headLength);
    const newer = Buffer.from(bytes);
    newer.write(head.replace(/"format":\d+/, '"format":9'), 10, 'utf8');
    expect(() => decodeWaterGraph(newer)).toThrow(/format 9/);
    const lacking = Buffer.from(bytes);
    lacking.write(head.replace('"name":"nodeLat"', '"name":"nodeLaX"'), 10, 'utf8');
    expect(() => decodeWaterGraph(lacking)).toThrow('Water graph lacks nodeLat');
  });
});

describe('GraphCache and the runner on the calling thread', () => {
  it('PADRUN-002: loads a graph once, keeps four, forgets on request, and retries a file that failed to load', async () => {
    const cache = new GraphCache();
    const first = await cache.get(file);
    expect(await cache.get(file)).toBe(first);
    const copies = await Promise.all(
      [1, 2, 3, 4].map(async (index) => {
        const copy = join(dir, `copy-${index}.wgraph`);
        await writeFile(copy, await (await import('node:fs/promises')).readFile(file));
        await cache.get(copy);
        return copy;
      }),
    );
    // Four others were loaded since: the first went.
    expect(await cache.get(file)).not.toBe(first);
    const kept = await cache.get(copies[3] as string);
    cache.forget(copies[3] as string);
    expect(await cache.get(copies[3] as string)).not.toBe(kept);

    const missing = join(dir, 'missing.wgraph');
    await expect(cache.get(missing)).rejects.toThrow();
    await writeFile(missing, await (await import('node:fs/promises')).readFile(file));
    await expect(cache.get(missing)).resolves.toBeDefined();
    await unlink(missing);
    cache.clear();
  });

  it('PADRUN-003: the inline runner plans the job and closes', async () => {
    const runner = new InlineRouterRunner();
    const [leg] = await runner.run(job(file));
    expect(leg).toMatchObject({ status: 'ok' });
    runner.forget(file);
    await expect(runner.close()).resolves.toBeUndefined();
  });

  it('PADROUTE-WORKER-001: the router thread plans what it is sent, forgets on request and answers a failure as a message', async () => {
    await import('../../../../src/nest/paddle-routing/paddle-router.worker');
    port.emit('message', { id: 1, job: job(file) });
    await vi.waitFor(() =>
      expect(port.postMessage).toHaveBeenCalledWith({ id: 1, legs: [expect.objectContaining({ status: 'ok' })] }),
    );
    port.emit('message', { id: 0, forget: file });
    port.emit('message', { id: 2 });
    port.emit('message', { id: 3, job: job(join(dir, 'nowhere.wgraph')) });
    await vi.waitFor(() =>
      expect(port.postMessage).toHaveBeenCalledWith({ id: 3, error: expect.stringContaining('nowhere.wgraph') }),
    );
    expect(port.postMessage).toHaveBeenCalledTimes(2);
  });
});

/** A thread script the runner can start: plain JS, so it runs without the server's loader. */
async function script(name: string, body: string): Promise<string> {
  const path = join(dir, `${name}.cjs`);
  await writeFile(path, `const { parentPort } = require('node:worker_threads');\n${body}\n`);
  return path;
}

describe('WorkerRouterRunner', () => {
  it('PADRUN-004: hands the job to its thread and answers its legs; a failure the thread reports rejects', async () => {
    const entry = await script(
      'answers',
      `parentPort.on('message', (m) => {
        if (m.forget) return;
        if (m.job.file === 'bad') parentPort.postMessage({ id: m.id, error: 'graph broken' });
        else if (m.job.file === 'silent') parentPort.postMessage({ id: m.id });
        else parentPort.postMessage({ id: m.id, legs: [{ status: 'failed', code: 'no_water_path', at: null }] });
      });`,
    );
    const runner = new WorkerRouterRunner(entry);
    await expect(runner.run(job('good'))).resolves.toEqual([{ status: 'failed', code: 'no_water_path', at: null }]);
    await expect(runner.run(job('bad'))).rejects.toThrow('graph broken');
    await expect(runner.run(job('silent'))).rejects.toThrow('router failed');
    runner.forget('good');
    await runner.close();
  });

  it('PADRUN-005: a thread that dies fails what it held, and the next job gets a fresh thread', async () => {
    const entry = await script(
      'dies',
      `parentPort.on('message', (m) => {
        if (m.job.file === 'crash') process.exit(3);
        parentPort.postMessage({ id: m.id, legs: [] });
      });`,
    );
    const runner = new WorkerRouterRunner(entry);
    await expect(runner.run(job('crash'))).rejects.toThrow('router thread ended');
    await expect(runner.run(job('fine'))).resolves.toEqual([]);
    await runner.close();
  });

  it('PADRUN-006: a thread that throws fails its jobs; closing fails what is still waiting', async () => {
    const entry = await script(
      'throws',
      `parentPort.on('message', (m) => {
        if (m.job.file === 'throw') setTimeout(() => { throw new Error('boom'); });
      });`,
    );
    const runner = new WorkerRouterRunner(entry);
    await expect(runner.run(job('throw'))).rejects.toThrow('boom');
    const waiting = runner.run(job('never')).catch((err: Error) => err.message);
    await runner.close();
    expect(await waiting).toBe('closed');
  });

  it('PADRUN-007: a job its thread leaves unanswered times out and the thread is started over', async () => {
    const entry = await script('hangs', `parentPort.on('message', () => undefined);`);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const runner = new WorkerRouterRunner(entry);
      const hanging = runner.run(job('hang'));
      const caught = hanging.catch((err: Error) => err.message);
      await vi.advanceTimersByTimeAsync(8000);
      expect(await caught).toBe('timeout');
      // The idle timer ends a thread nobody asks for long enough.
      runner.run(job('again')).catch(() => undefined);
      await vi.advanceTimersByTimeAsync(30 * 60 * 1000);
      await runner.close();
    } finally {
      vi.useRealTimers();
    }
  });
});
