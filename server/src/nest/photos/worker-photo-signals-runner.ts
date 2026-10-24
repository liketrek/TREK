import type { PhotoPixels, PhotoSignalsRunner } from './photo-signals-runner';

import { join } from 'node:path';
import { Worker } from 'node:worker_threads';

/** A photo is decoded and measured in well under this; one that takes longer counts as unmeasurable. */
export const MEASURE_TIMEOUT_MS = 20_000;
/** With this many photos already in line for the thread, a new one is turned away as busy. */
export const MAX_WAITING_PHOTOS = 16;
/** A thread with nothing to do ends after ten minutes; the next photo starts one again. */
const IDLE_MS = 10 * 60 * 1000;
/** The thread's heap. The decoded pixels sit outside it, which is why the decoder checks a photo's size first. */
const SIGNALS_HEAP_MB = 256;

type Reply = { id: number; pixels?: PhotoPixels | null; error?: string };
/** What the thread sends once its script has loaded, before any photo. */
type Ready = { ready: true };

/**
 * The photo signals' own thread, so decoding a photo never holds up the
 * server's requests (the piste router's thread is the precedent). Photos go to
 * it one at a time, in the order they came, each on its own clock from when
 * the thread takes it up: a photo not answered in time fails as `timeout` and
 * the thread is replaced, a thread that dies fails the photo it held, and the
 * next photo starts a fresh one. Started on the first photo, ended when idle.
 *
 * Only a thread that has said it is ready can blame a photo. One that cannot be
 * started, or dies before its script has loaded (a broken build, a bad flag),
 * fails its photos as `unavailable`, and one ended by `close()` as `closed`:
 * both say nothing about the photo, so the caller tries it again later.
 */
export class WorkerPhotoSignalsRunner implements PhotoSignalsRunner {
  private thread: Worker | null = null;
  private line: Promise<unknown> = Promise.resolve();
  private inLine = 0;
  private lastId = 0;
  private closed = false;
  private idleTimer: NodeJS.Timeout | null = null;
  /** The threads that have said they are ready. */
  private readonly started = new WeakSet<Worker>();

  constructor(private readonly entry = join(__dirname, 'photo-signals.worker.js')) {}

  measure(bytes: Uint8Array): Promise<PhotoPixels | null> {
    if (this.inLine >= MAX_WAITING_PHOTOS) return Promise.reject(new Error('busy'));
    this.inLine++;
    const turn = this.line.then(() => this.ask(bytes));
    this.line = turn.catch(() => undefined);
    return turn.finally(() => {
      this.inLine--;
    });
  }

  async close(): Promise<void> {
    this.closed = true;
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
    const worker = this.thread;
    this.thread = null;
    await worker?.terminate();
  }

  /** One photo to the thread and its answer back. */
  private ask(bytes: Uint8Array): Promise<PhotoPixels | null> {
    if (this.closed) return Promise.reject(new Error('closed'));
    let worker: Worker;
    try {
      worker = this.ensureThread();
    } catch (err: unknown) {
      return Promise.reject(new Error('unavailable', { cause: err }));
    }
    const id = ++this.lastId;
    return new Promise<PhotoPixels | null>((resolve, reject) => {
      const settle = (outcome: () => void) => {
        clearTimeout(timer);
        worker.off('message', onMessage);
        worker.off('error', onError);
        worker.off('exit', onExit);
        outcome();
      };
      const onMessage = (reply: Reply | Ready) => {
        if (!('id' in reply) || reply.id !== id) return;
        const { pixels, error } = reply;
        if (pixels === undefined) settle(() => reject(new Error(error ?? 'measurement failed')));
        else settle(() => resolve(pixels));
      };
      // Why the photo failed: the thread's own fault once it was ready, else nothing to do with the photo.
      const blame = (err: Error) => {
        if (this.closed) return new Error('closed');
        return this.started.has(worker) ? err : new Error('unavailable', { cause: err });
      };
      const onError = (err: Error) => settle(() => reject(blame(err)));
      const onExit = () => settle(() => reject(blame(new Error('signals thread ended'))));
      const timer = setTimeout(() => {
        // The thread is stuck on this photo; the next photo gets a fresh one.
        this.thread = null;
        void worker.terminate();
        settle(() => reject(new Error('timeout')));
      }, MEASURE_TIMEOUT_MS);
      worker.on('message', onMessage);
      worker.on('error', onError);
      worker.on('exit', onExit);
      worker.postMessage({ id, bytes });
    });
  }

  private ensureThread(): Worker {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => void this.endIdle(), IDLE_MS);
    this.idleTimer.unref();
    if (this.thread) return this.thread;
    // The compiled thread needs the same --require hooks (path aliases) the server was started with.
    const hooks = process.execArgv.filter(
      (arg, i, all) => ['--require', '-r'].includes(arg) || ['--require', '-r'].includes(all[i - 1] ?? ''),
    );
    const worker = new Worker(this.entry, {
      execArgv: hooks,
      resourceLimits: { maxOldGenerationSizeMb: SIGNALS_HEAP_MB },
    });
    // Kept for the thread's whole life: a thread error with no listener would take the server down.
    const forget = () => {
      if (this.thread === worker) this.thread = null;
    };
    // Any message, its first being `ready`, says the script has loaded.
    worker.on('message', () => {
      this.started.add(worker);
    });
    worker.on('error', forget);
    worker.on('exit', forget);
    worker.unref();
    this.thread = worker;
    return worker;
  }

  /** An idle thread ends; the runner stays open for the next photo. */
  private async endIdle(): Promise<void> {
    const worker = this.thread;
    this.thread = null;
    await worker?.terminate();
  }
}
