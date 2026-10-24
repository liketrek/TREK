/**
 * Where the piste router runs (spec 7.2): the networks a thread keeps
 * decoded within its budget, the runner on the calling thread, the router
 * thread's own script, and the runner that talks to a thread, here with
 * small threads written by the test that answer, fail, hang or die. Also the
 * area's lines for the map (spec 10.4).
 */
import { networkFeatures, simplifyLine } from '../../../../src/nest/ski-routing/engine/network';
import { stitchGraphs } from '../../../../src/nest/ski-routing/engine/stitch';
import { Lift } from '../../../../src/nest/ski-routing/ski-graph.contract';
import {
  InlineSkiRouterRunner,
  NetCache,
  NETWORK_BUDGET_BYTES,
  type SkiRouteJob,
} from '../../../../src/nest/ski-routing/ski-router-runner';
import { profileOf } from '../../../../src/nest/ski-routing/ski-routing.service';
import {
  answerTimeoutMs,
  MAX_WAITING_JOBS,
  WorkerSkiRouterRunner,
} from '../../../../src/nest/ski-routing/worker-router-runner';
import { decodePolyline } from '../../../../src/utils/polyline';
import { oneByOne } from '../../../helpers/one-by-one';
import { SkiWorld } from '../../../helpers/ski-world';
import { skiRouteRequestSchema } from '@trek/shared';

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
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
const world = new SkiWorld();
const valley = world.node(0, 0, 1200);
const top = world.node(0, 2000, 2200);
world.lift(valley, top, { name: 'Sonnenbahn', type: Lift.CHAIR_DETACHABLE, sec: 420 });
world.run(top, valley, 1, { name: 'Talabfahrt', via: [[200, 1000]] });

const job = (files: string[]): SkiRouteJob => {
  const request = skiRouteRequestSchema.parse({
    legs: [{ from: world.at(0, 2000), to: world.at(0, 0) }],
    discipline: 'alpine',
  });
  return {
    kind: 'route',
    files,
    areaIds: ['w:1'],
    legs: [{ from: world.at(0, 2000), to: world.at(0, 0), continues: false }],
    profile: profileOf(request),
    alternatives: 0,
  };
};

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'trek-ski-runner-'));
  file = join(dir, 'w_1@aaaaaaaa.sgr.gz');
  await writeFile(file, world.gz());
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('the decoded networks and the runner on the calling thread', () => {
  it('SKIRUN-001: decodes a network once, drops the oldest past the budget, forgets on request', async () => {
    const cache = new NetCache();
    const first = await cache.get([file]);
    expect(await cache.get([file])).toBe(first);
    const copy = join(dir, 'w_1@bbbbbbbb.sgr.gz');
    await writeFile(copy, world.gz());
    // A budget of one byte keeps only the network loaded last.
    const small = new NetCache(1);
    const a = await small.get([file]);
    await small.get([copy]);
    await vi.waitFor(async () => expect(await small.get([file])).not.toBe(a));
    cache.forget(file);
    expect(await cache.get([file])).not.toBe(first);
    await expect(cache.get([join(dir, 'missing.sgr.gz')])).rejects.toThrow();
    cache.clear();
    expect(NETWORK_BUDGET_BYTES).toBe(256 * 1024 * 1024);
  });

  it('SKIRUN-002: the inline runner plans a job and draws the lines of an area', async () => {
    const runner = new InlineSkiRouterRunner();
    const [leg] = await runner.run(job([file]));
    expect(leg).toMatchObject({ status: 'ok', area_ids: ['w:1'] });
    const lines = await runner.run({ kind: 'network', files: [file] });
    expect(lines.features.map((feature) => feature.kind).sort()).toEqual(['lift', 'run']);
    runner.forget(file);
    await expect(runner.close()).resolves.toBeUndefined();
  });

  it('SKIROUTE-WORKER-001: the thread answers a job, forgets on request, answers a failure as a message', async () => {
    await import('../../../../src/nest/ski-routing/ski-router.worker');
    port.emit('message', { id: 1, job: job([file]) });
    await vi.waitFor(() =>
      expect(port.postMessage).toHaveBeenCalledWith({ id: 1, result: [expect.objectContaining({ status: 'ok' })] }),
    );
    port.emit('message', { id: 0, forget: file });
    port.emit('message', { id: 2 });
    port.emit('message', { id: 3, job: job([join(dir, 'nowhere.sgr.gz')]) });
    await vi.waitFor(() =>
      expect(port.postMessage).toHaveBeenCalledWith({ id: 3, error: expect.stringContaining('nowhere.sgr.gz') }),
    );
    expect(port.postMessage).toHaveBeenCalledTimes(2);
  });
});

describe('the lines of an area for the map', () => {
  it('SKIRUN-010: runs and lifts as lines with names, grades, types and one-way; links and stations left out', () => {
    const net = stitchGraphs([world.graph()]);
    const { features, simplified_m } = networkFeatures(net);
    expect(simplified_m).toBe(5);
    const run = features.find((feature) => feature.kind === 'run');
    expect(run).toMatchObject({ name: 'Talabfahrt', difficulty: 'easy', lift_type: null, oneway: true });
    const lift = features.find((feature) => feature.kind === 'lift');
    expect(lift).toMatchObject({ name: 'Sonnenbahn', lift_type: 'chair_detachable', oneway: true, difficulty: null });
    const line = decodePolyline(run?.line ?? '', 5);
    expect(line).toHaveLength(3);
    expect(line[0]?.[0]).toBeCloseTo(world.at(0, 2000).lat, 4);
    expect(features).toHaveLength(2);
  });

  it('SKIRUN-011: drops the points within the tolerance of the line, the ends always kept', () => {
    const straight: Array<[number, number]> = [
      [46, 7],
      [46.0005, 7.00001],
      [46.001, 7],
    ];
    expect(simplifyLine(straight, 5)).toEqual([
      [46, 7],
      [46.001, 7],
    ]);
    const bent: Array<[number, number]> = [
      [46, 7],
      [46.0005, 7.001],
      [46.001, 7],
    ];
    expect(simplifyLine(bent, 5)).toHaveLength(3);
    expect(simplifyLine([[46, 7]], 5)).toEqual([[46, 7]]);
  });
});

/** A thread script the runner can start: plain JS, so it runs without the server's loader. */
async function script(name: string, body: string): Promise<string> {
  const path = join(dir, `${name}.cjs`);
  await writeFile(path, `const { parentPort } = require('node:worker_threads');\n${body}\n`);
  return path;
}

describe('WorkerSkiRouterRunner', () => {
  it('SKIRUN-020: hands a job to its thread and answers its result; a failure the thread reports rejects', async () => {
    const entry = await script(
      'answers',
      `parentPort.on('message', (m) => {
        if (m.forget) return;
        if (m.job.files[0] === 'bad') parentPort.postMessage({ id: m.id, error: 'graph broken' });
        else if (m.job.files[0] === 'silent') parentPort.postMessage({ id: m.id });
        else parentPort.postMessage({ id: m.id, result: [{ status: 'failed', code: 'disconnected' }] });
      });`,
    );
    const runner = new WorkerSkiRouterRunner(entry);
    await expect(runner.run(job(['good']))).resolves.toEqual([{ status: 'failed', code: 'disconnected' }]);
    await expect(runner.run(job(['bad']))).rejects.toThrow('graph broken');
    await expect(runner.run(job(['silent']))).rejects.toThrow('router failed');
    runner.forget('good');
    await runner.close();
  });

  it('SKIRUN-021: a thread that dies fails what it held, and the next job gets a fresh thread', async () => {
    const entry = await script(
      'dies',
      `parentPort.on('message', (m) => {
        if (m.job.files[0] === 'crash') process.exit(3);
        parentPort.postMessage({ id: m.id, result: [] });
      });`,
    );
    const runner = new WorkerSkiRouterRunner(entry);
    await expect(runner.run(job(['crash']))).rejects.toThrow('router thread ended');
    await expect(runner.run(job(['fine']))).resolves.toEqual([]);
    await runner.close();
  });

  it('SKIRUN-022: a thread that throws fails its jobs; closing fails what is still waiting', async () => {
    const entry = await script(
      'throws',
      `parentPort.on('message', (m) => {
        if (m.job.files[0] === 'throw') setTimeout(() => { throw new Error('boom'); });
      });`,
    );
    const runner = new WorkerSkiRouterRunner(entry);
    await expect(runner.run(job(['throw']))).rejects.toThrow('boom');
    const waiting = runner.run(job(['never'])).catch((err: Error) => err.message);
    await runner.close();
    expect(await waiting).toBe('closed');
  });

  it('SKIRUN-023: a job left unanswered times out, the thread is started over; a full queue is busy', async () => {
    const entry = await script('hangs', `parentPort.on('message', () => undefined);`);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const runner = new WorkerSkiRouterRunner(entry);
      const waiting = Array.from({ length: MAX_WAITING_JOBS }, () =>
        runner.run(job(['hang'])).catch((err: Error) => err.message),
      );
      await expect(runner.run(job(['hang']))).rejects.toThrow('busy');
      // One job at a time is with the thread, each on its own clock.
      await oneByOne(Array.from({ length: MAX_WAITING_JOBS }), () =>
        vi.advanceTimersByTimeAsync(answerTimeoutMs(job(['hang']))),
      );
      expect(await Promise.all(waiting)).toEqual(Array.from({ length: MAX_WAITING_JOBS }, () => 'timeout'));
      await runner.close();
    } finally {
      vi.useRealTimers();
    }
  });

  it('SKIRUN-025: a job times out on its own clock from when the thread takes it, and takes no other job down', async () => {
    const entry = await script(
      'slow',
      `parentPort.on('message', (m) => {
        if (m.forget || m.job.files[0] === 'hang') return;
        parentPort.postMessage({ id: m.id, result: [] });
      });`,
    );
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const runner = new WorkerSkiRouterRunner(entry);
      const ms = answerTimeoutMs(job(['hang']));
      const first = runner.run(job(['hang'])).catch((err: Error) => err.message);
      const second = runner.run(job(['hang'])).catch((err: Error) => err.message);
      const third = runner.run(job(['fine']));
      await vi.advanceTimersByTimeAsync(ms);
      expect(await first).toBe('timeout');
      // The second job waited behind the first; its clock started only when the fresh thread took it.
      let secondDone = false;
      void second.then(() => {
        secondDone = true;
      });
      await vi.advanceTimersByTimeAsync(ms - 1);
      expect(secondDone).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(await second).toBe('timeout');
      // The third job runs on the thread after it and is answered; no earlier clock ends it or its thread.
      await expect(third).resolves.toEqual([]);
      await vi.advanceTimersByTimeAsync(ms);
      await expect(runner.run(job(['fine']))).resolves.toEqual([]);
      await runner.close();
    } finally {
      vi.useRealTimers();
    }
  });

  it('SKIRUN-026: a thread that cannot start fails each job in line on its own', async () => {
    // A bare relative path is one node refuses to start a thread from.
    const runner = new WorkerSkiRouterRunner('no-such-router.js');
    await expect(runner.run(job(['x']))).rejects.toThrow();
    await expect(runner.run(job(['y']))).rejects.toThrow();
    await runner.close();
  });

  it('SKIRUN-024: a job of many legs waits longer for its answer, never beyond a minute', () => {
    const one = job(['x']);
    expect(answerTimeoutMs(one)).toBe(8000);
    expect(answerTimeoutMs({ ...one, legs: [...one.legs, ...one.legs, ...one.legs] })).toBe(16_000);
    const leg = one.legs[0] as SkiRouteJob['legs'][number];
    expect(answerTimeoutMs({ ...one, legs: Array.from({ length: 40 }, () => leg) })).toBe(60_000);
    expect(answerTimeoutMs({ kind: 'network', files: ['x'] })).toBe(8000);
  });
});
