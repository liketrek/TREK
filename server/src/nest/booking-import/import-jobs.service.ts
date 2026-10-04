import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';
import { withRequestContext } from '../database/request-context';
import { RealtimeService } from '../realtime/realtime.service';
import { BookingImportService } from './booking-import.service';
import { LlmParseService } from '../llm-parse/llm-parse.service';
import type { BookingImportMode, BookingImportPreviewResponse, ReceiptScanResult, TrekWsPayload } from '@trek/shared';

type JobStatus = 'running' | 'done' | 'error';

interface ImportJob {
  id: string;
  tripId: string;
  userId: number;
  status: JobStatus;
  done: number;
  total: number;
  result?: BookingImportPreviewResponse | ReceiptScanResult;
  error?: string;
  createdAt: number;
}

// Keep a finished job around briefly so a client that missed the WebSocket push
// (navigation, reconnect) can still GET its result.
const JOB_TTL_MS = 10 * 60_000;

/**
 * Runs a booking-import parse OFF the request: the controller returns a job id
 * immediately, the parse continues here, and progress/completion are pushed to the
 * user's sockets via `broadcastToUser` (which reaches them on ANY page, not just the
 * trip room). This is what lets the upload modal close at once and a background widget
 * track the work while the user keeps navigating. The actual parsing is the same
 * `BookingImportService.preview` the synchronous endpoint uses. A receipt scanned
 * from the Costs tab rides the same queue, with `LlmParseService.readReceipt` as
 * its work: it is the same slow model on the same server.
 */
@Injectable()
export class ImportJobsService {
  private readonly jobs = new Map<string, ImportJob>();
  /** Tail of each user's job chain — parses run one at a time per user, not all at once. */
  private readonly chains = new Map<number, Promise<void>>();

  constructor(
    private readonly bookingImport: BookingImportService,
    private readonly realtime: RealtimeService,
    private readonly llmParse: LlmParseService,
    private readonly orm: MikroORM,
  ) {}

  /** Create a job and queue it behind the user's other parses; returns the job id at once. */
  start(tripId: string, files: Express.Multer.File[], mode: BookingImportMode, userId: number): string {
    return this.enqueue(tripId, userId, files.length, (job) =>
      this.bookingImport.preview(files, mode, job.userId, (done, total, fileName) => {
        job.done = done;
        this.push(job, 'import:progress', { status: 'running', done, total, fileName });
      }),
    );
  }

  /** Queue the read of one receipt photo, behind the same user's other parses. */
  startReceipt(tripId: string, file: Express.Multer.File, userId: number): string {
    return this.enqueue(tripId, userId, 1, async (job) => {
      const result = await this.llmParse.readReceipt({ buffer: file.buffer, originalName: file.originalname }, job.userId);
      job.done = 1;
      return result;
    });
  }

  private enqueue(
    tripId: string,
    userId: number,
    total: number,
    work: (job: ImportJob) => Promise<BookingImportPreviewResponse | ReceiptScanResult>,
  ): string {
    const id = randomUUID();
    const job: ImportJob = { id, tripId, userId, status: 'running', done: 0, total, createdAt: Date.now() };
    this.jobs.set(id, job);
    // Chain onto the user's previous parse so they run sequentially (one CPU-heavy
    // inference at a time), while the request returns immediately.
    //
    // R9 (Plan 3h Task 4, per 3f's own `StorageHealthNotifierService`
    // precedent): `run()` executes fully detached from the original HTTP
    // request — the controller has already returned by the time this
    // `.then()` continuation even starts — so it gets its own fresh
    // `withRequestContext` fork here, independent of whatever context (if
    // any) was live at the caller (`start()` / `startReceipt()`). The receipt
    // read (`LlmParseService.readReceipt` -> `llmConfig.resolve`) reaches the
    // ORM as well and relies on the same fork. Insurance, not a fix for
    // an observed failure: `BookingImportService.preview` has no
    // `EntityManager` to lose before this task's own conversion (raw
    // `better-sqlite3` calls have no request-scoping concept at all) — the
    // risk only exists AFTER BI1/BI2 convert, which is why the wrap lands
    // in this SAME commit.
    const prev = this.chains.get(userId) ?? Promise.resolve();
    const next = prev.then(() => withRequestContext(this.orm, () => this.run(job, work))).catch(() => {});
    this.chains.set(userId, next);
    void next.finally(() => {
      if (this.chains.get(userId) === next) this.chains.delete(userId);
    });
    return id;
  }

  get(id: string, userId: number): ImportJob | undefined {
    const job = this.jobs.get(id);
    return job && job.userId === userId ? job : undefined;
  }

  private async run(job: ImportJob, work: (job: ImportJob) => Promise<BookingImportPreviewResponse | ReceiptScanResult>): Promise<void> {
    this.push(job, 'import:progress', { status: 'running', done: 0, total: job.total });
    try {
      const result = await work(job);
      job.status = 'done';
      job.result = result;
      this.push(job, 'import:done', { result });
    } catch (err) {
      job.status = 'error';
      job.error = err instanceof Error ? err.message : String(err);
      this.push(job, 'import:error', { message: job.error });
    } finally {
      const id = job.id;
      setTimeout(() => this.jobs.delete(id), JOB_TTL_MS).unref?.();
    }
  }

  private push<E extends 'import:progress' | 'import:done' | 'import:error'>(
    job: ImportJob,
    type: E,
    payload: Omit<TrekWsPayload<E>, 'jobId' | 'tripId'>,
  ): void {
    // jobId/tripId are injected here; TS can't re-associate the spread with the
    // deferred generic payload, so re-assert the completed shape it just built.
    this.realtime.broadcastToUser(job.userId, {
      type,
      jobId: job.id,
      tripId: job.tripId,
      ...payload,
    } as { type: E } & TrekWsPayload<E>);
  }
}
