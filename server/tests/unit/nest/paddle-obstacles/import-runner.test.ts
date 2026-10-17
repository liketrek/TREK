/**
 * Where a region's read runs (PAD-11): the node positions it keeps, the read
 * on the calling thread, the thread's own script, and the runner that starts
 * a thread per read, here with small threads written by the test that report
 * progress, hand back a network, fail, die or are called off.
 */
import {
  importRunner,
  InlineImportRunner,
  WorkerImportRunner,
} from '../../../../src/nest/paddle-obstacles/import-runner';
import { NodeStore } from '../../../../src/nest/paddle-obstacles/node-store';
import { WaterWorld } from '../../../helpers/water-world';

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const thread = vi.hoisted(() => ({
  postMessage: vi.fn(),
  workerData: { path: '', regionId: 'worker-test' },
}));
vi.mock('node:worker_threads', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:worker_threads')>()),
  parentPort: { postMessage: thread.postMessage },
  get workerData() {
    return thread.workerData;
  },
}));

let dir: string;
let extract: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'trek-import-runner-'));
  const world = new WaterWorld();
  world.line(
    [
      [0, 2000],
      [0, 0],
    ],
    { waterway: 'river', name: 'Regen' },
  );
  extract = join(dir, 'region.osm.pbf');
  await writeFile(extract, world.pbf());
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('NodeStore', () => {
  it('PIMP-001: keeps the positions of the nodes asked for, once each, at OSM resolution', () => {
    const store = new NodeStore();
    for (let id = 3000; id > 0; id -= 1) store.want(id);
    store.wantAll([5, 5, 7]);
    expect(store.size).toBe(3003);
    store.seal();
    store.seal();
    expect(store.size).toBe(3000);
    store.offer(5, 49.123456789, 12.000000049);
    store.offer(9999, 1, 1);
    expect(store.get(5)).toEqual([49.1234568, 12]);
    expect(store.get(6)).toBeNull();
    expect(store.get(9999)).toBeNull();
    expect(() => store.want(1)).toThrow('NodeStore is sealed');
  });
});

describe('the read on the calling thread', () => {
  it('PIMP-002: reads the extract into obstacles and a network, and gives up a read called off', async () => {
    const runner = new InlineImportRunner();
    const phases: string[] = [];
    const outcome = await runner.run(extract, 'regen', (phase) => phases.push(phase), new AbortController().signal);
    expect(outcome.graph?.stats.water_km).toBeCloseTo(2, 1);
    expect(phases).toContain('build');

    const calledOff = new AbortController();
    calledOff.abort(new Error('region removed'));
    await expect(runner.run(extract, 'regen', () => undefined, calledOff.signal)).rejects.toThrow('region removed');
  });

  it('PIMP-003: picks the inline read where the build shipped no thread script', () => {
    expect(importRunner()).toBeInstanceOf(InlineImportRunner);
  });

  it('PIMP-004: the thread script reads its region, reports progress and hands the outcome back', async () => {
    thread.workerData = { path: extract, regionId: 'worker-test' };
    await import('../../../../src/nest/paddle-obstacles/paddle-import.worker');
    await vi.waitFor(() =>
      expect(thread.postMessage).toHaveBeenCalledWith({
        outcome: expect.objectContaining({ graph: expect.anything() }),
      }),
    );
    expect(thread.postMessage).toHaveBeenCalledWith({ progress: { phase: 'build', fraction: null } });
  });

  it('PIMP-005: the thread script reports a read that failed', async () => {
    vi.resetModules();
    thread.postMessage.mockClear();
    thread.workerData = { path: join(dir, 'missing.osm.pbf'), regionId: 'worker-test' };
    await import('../../../../src/nest/paddle-obstacles/paddle-import.worker');
    await vi.waitFor(() =>
      expect(thread.postMessage).toHaveBeenCalledWith({ error: expect.stringContaining('missing.osm.pbf') }),
    );
  });
});

/** A thread script the runner can start: plain JS, so it runs without the server's loader. */
async function script(name: string, body: string): Promise<string> {
  const path = join(dir, `${name}.cjs`);
  await writeFile(path, `const { parentPort, workerData } = require('node:worker_threads');\n${body}\n`);
  return path;
}

describe('WorkerImportRunner', () => {
  it('PIMP-006: passes on the progress and hands back the outcome, its network bytes as bytes', async () => {
    const entry = await script(
      'reads',
      `parentPort.postMessage({ progress: { phase: 'read', fraction: 0.5 } });
       parentPort.postMessage({ outcome: { timestamp: 1, features: [], graph: { bytes: Buffer.from([1, 2, 3]), rev: 'r', stats: {}, box: {} } } });`,
    );
    const progress = vi.fn();
    const outcome = await new WorkerImportRunner(entry).run(extract, 'regen', progress, new AbortController().signal);
    expect(progress).toHaveBeenCalledWith('read', 0.5);
    expect(outcome.graph?.bytes).toBeInstanceOf(Uint8Array);
    expect([...(outcome.graph?.bytes ?? [])]).toEqual([1, 2, 3]);

    const dry = await script(
      'dry',
      `parentPort.postMessage({ outcome: { timestamp: null, features: [], graph: null } });`,
    );
    await expect(
      new WorkerImportRunner(dry).run(extract, 'dry', () => undefined, new AbortController().signal),
    ).resolves.toEqual({
      timestamp: null,
      features: [],
      graph: null,
    });
  });

  it('PIMP-007: a read the thread reports failed, a thread that throws and one that ends early all reject', async () => {
    const fails = await script('fails', `parentPort.postMessage({ error: 'not a PBF file' });`);
    const silent = await script('silent', `parentPort.postMessage({});`);
    const throws = await script('throws', `throw new Error('out of memory');`);
    const ends = await script('ends', `process.exit(7);`);
    const run = (entry: string) =>
      new WorkerImportRunner(entry).run(extract, 'x', () => undefined, new AbortController().signal);
    await expect(run(fails)).rejects.toThrow('not a PBF file');
    await expect(run(silent)).rejects.toThrow('the read failed');
    await expect(run(throws)).rejects.toThrow('out of memory');
    await expect(run(ends)).rejects.toThrow('the read ended early (7)');
  });

  it('PIMP-008: a read called off ends its thread at once, and one called off before it starts never starts', async () => {
    const slow = await script('slow', `setTimeout(() => parentPort.postMessage({ error: 'too late' }), 60000);`);
    const runner = new WorkerImportRunner(slow);
    const controller = new AbortController();
    const reading = runner.run(extract, 'x', () => undefined, controller.signal);
    controller.abort(new Error('removed'));
    await expect(reading).rejects.toThrow('removed');

    const notError = new AbortController();
    const pending = runner.run(extract, 'x', () => undefined, notError.signal);
    notError.abort('gone');
    await expect(pending).rejects.toThrow('gone');

    const before = new AbortController();
    before.abort(new Error('already off'));
    await expect(runner.run(extract, 'x', () => undefined, before.signal)).rejects.toThrow('already off');
  });
});
