import type { RouteJob, RouterRunner } from './router-runner';
import type { PaddleRouteLeg } from '@trek/shared';

import { join } from 'node:path';
import { Worker } from 'node:worker_threads';

/** A request the thread has not answered in this long is given up, and the thread is started over. */
const ANSWER_MS = 8000;
/** A thread with nothing to do is ended after this long; the next request starts it again. */
const IDLE_MS = 30 * 60 * 1000;

interface Pending {
  resolve: (legs: PaddleRouteLeg[]) => void;
  reject: (err: Error) => void;
  timer: NodeJS.Timeout;
}

/**
 * The router's thread, started on the first request and ended when idle. A
 * search that hangs or a thread that dies fails its requests and is replaced
 * by a fresh thread, so one bad graph never stops routing for good.
 */
export class WorkerRouterRunner implements RouterRunner {
  private worker: Worker | null = null;
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();
  private idle: NodeJS.Timeout | null = null;

  constructor(private readonly entry = join(__dirname, 'paddle-router.worker.js')) {}

  run(job: RouteJob): Promise<PaddleRouteLeg[]> {
    const worker = this.thread();
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('timeout'));
        this.restart();
      }, ANSWER_MS);
      this.pending.set(id, { resolve, reject, timer });
      worker.postMessage({ id, job });
    });
  }

  forget(file: string): void {
    this.worker?.postMessage({ id: 0, forget: file });
  }

  async close(): Promise<void> {
    if (this.idle) clearTimeout(this.idle);
    this.failAll(new Error('closed'));
    const worker = this.worker;
    this.worker = null;
    await worker?.terminate();
  }

  private thread(): Worker {
    if (this.idle) clearTimeout(this.idle);
    this.idle = setTimeout(() => void this.close(), IDLE_MS);
    this.idle.unref();
    if (this.worker) return this.worker;
    // The thread loads compiled code the way the server does (with the path aliases the server's own start registers).
    const execArgv = process.execArgv.filter(
      (arg, index, all) =>
        arg === '--require' || arg === '-r' || all[index - 1] === '--require' || all[index - 1] === '-r',
    );
    const worker = new Worker(this.entry, { execArgv });
    worker.on('message', (message: { id: number; legs?: PaddleRouteLeg[]; error?: string }) => {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      clearTimeout(pending.timer);
      if (message.legs) pending.resolve(message.legs);
      else pending.reject(new Error(message.error ?? 'router failed'));
    });
    worker.on('error', (err: Error) => {
      if (this.worker === worker) this.worker = null;
      this.failAll(err);
    });
    worker.on('exit', () => {
      if (this.worker === worker) this.worker = null;
      this.failAll(new Error('router thread ended'));
    });
    worker.unref();
    this.worker = worker;
    return worker;
  }

  private restart(): void {
    const worker = this.worker;
    this.worker = null;
    void worker?.terminate();
  }

  private failAll(err: Error): void {
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(err);
      this.pending.delete(id);
    }
  }
}
