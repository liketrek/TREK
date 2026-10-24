import type { SkiJob, SkiJobResult, SkiRouterRunner } from './ski-router-runner';

import { join } from 'node:path';
import { Worker } from 'node:worker_threads';

/** A job waits this long for its answer, and four seconds more for every leg it plans. */
const BASE_ANSWER_MS = 8000;
const ANSWER_MS_PER_LEG = 4000;
const MAX_ANSWER_MS = 60_000;
/** With this many jobs already waiting, a new one is turned away as busy rather than queued. */
export const MAX_WAITING_JOBS = 8;
/** A thread with nothing to do ends after half an hour; the next job starts one again. */
const IDLE_MS = 30 * 60 * 1000;

/** A job in line for the thread, not yet handed to it. */
interface Queued {
  id: number;
  job: SkiJob;
  settle: (outcome: { result: unknown } | { error: Error }) => void;
}

/** The job the thread is working on, the thread it went to, and its clock. */
interface Running extends Queued {
  worker: Worker;
  timer: NodeJS.Timeout;
}

type Reply = { id: number; result?: unknown; error?: string };

export function answerTimeoutMs(job: SkiJob): number {
  const legs = job.kind === 'route' ? job.legs.length : 1;
  return Math.min(MAX_ANSWER_MS, BASE_ANSWER_MS + ANSWER_MS_PER_LEG * Math.max(0, legs - 1));
}

/**
 * The piste router's own thread, so a search never holds up the server's
 * requests. Started on the first job and ended when idle. The thread is
 * handed one job at a time, so a job's clock starts when the thread takes it
 * up, not while it waits behind a slow one. A job not answered in time fails
 * as `timeout` and its thread is replaced; a thread that dies fails the job
 * it held. Either way the jobs still in line go to a fresh thread.
 */
export class WorkerSkiRouterRunner implements SkiRouterRunner {
  private thread: Worker | null = null;
  private lastId = 0;
  private readonly queue: Queued[] = [];
  private running: Running | null = null;
  private idleTimer: NodeJS.Timeout | null = null;

  constructor(private readonly entry = join(__dirname, 'ski-router.worker.js')) {}

  run<J extends SkiJob>(job: J): Promise<SkiJobResult<J>> {
    if (this.queue.length + (this.running ? 1 : 0) >= MAX_WAITING_JOBS) return Promise.reject(new Error('busy'));
    const id = ++this.lastId;
    return new Promise<SkiJobResult<J>>((resolve, reject) => {
      this.queue.push({
        id,
        job,
        settle: (outcome) => ('error' in outcome ? reject(outcome.error) : resolve(outcome.result as SkiJobResult<J>)),
      });
      this.next();
    });
  }

  forget(file: string): void {
    this.thread?.postMessage({ id: 0, forget: file });
  }

  async close(): Promise<void> {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
    this.failAll(new Error('closed'));
    const worker = this.thread;
    this.thread = null;
    await worker?.terminate();
  }

  /** Hands the next job in line to the thread, once the one before it is done. */
  private next(): void {
    if (this.running) return;
    const queued = this.queue.shift();
    if (!queued) return;
    let worker: Worker;
    try {
      worker = this.ensureThread();
    } catch (err: unknown) {
      queued.settle({ error: err instanceof Error ? err : new Error(String(err)) });
      this.next();
      return;
    }
    const timer = setTimeout(() => this.timedOut(queued.id), answerTimeoutMs(queued.job));
    this.running = { ...queued, worker, timer };
    worker.postMessage({ id: queued.id, job: queued.job });
  }

  private ensureThread(): Worker {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => void this.close(), IDLE_MS);
    this.idleTimer.unref();
    if (this.thread) return this.thread;
    // The thread runs the compiled code with the path aliases the server's own start registers.
    const execArgv = process.execArgv.filter(
      (arg, index, all) =>
        arg === '--require' || arg === '-r' || all[index - 1] === '--require' || all[index - 1] === '-r',
    );
    const worker = new Worker(this.entry, { execArgv });
    worker.on('message', (reply: Reply) => this.receive(worker, reply));
    worker.on('error', (err: Error) => this.lost(worker, err));
    worker.on('exit', () => this.lost(worker, new Error('router thread ended')));
    worker.unref();
    this.thread = worker;
    return worker;
  }

  private receive(worker: Worker, reply: Reply): void {
    const running = this.running;
    if (running?.worker !== worker || running.id !== reply.id) return;
    this.finish(
      running,
      reply.result !== undefined ? { result: reply.result } : { error: new Error(reply.error ?? 'router failed') },
    );
  }

  /** Only the job still running on the thread it went to times out; its thread goes with it. */
  private timedOut(id: number): void {
    const running = this.running;
    if (running?.id !== id) return;
    this.dropThread(running.worker);
    this.finish(running, { error: new Error('timeout') });
  }

  /** A thread that ended or failed takes its job with it; a thread already replaced touches no other job. */
  private lost(worker: Worker, err: Error): void {
    if (this.thread === worker) this.thread = null;
    const running = this.running;
    if (running?.worker === worker) this.finish(running, { error: err });
  }

  private finish(running: Running, outcome: { result: unknown } | { error: Error }): void {
    clearTimeout(running.timer);
    this.running = null;
    running.settle(outcome);
    this.next();
  }

  private dropThread(worker: Worker): void {
    if (this.thread === worker) this.thread = null;
    void worker.terminate();
  }

  private failAll(err: Error): void {
    const running = this.running;
    this.running = null;
    if (running) {
      clearTimeout(running.timer);
      running.settle({ error: err });
    }
    for (const queued of this.queue.splice(0)) queued.settle({ error: err });
  }
}
