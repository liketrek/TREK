import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { broadcastToUser } from '../../websocket';
import { BookingImportService } from './booking-import.service';
import type { BookingImportMode, BookingImportPreviewResponse } from '@trek/shared';

type JobStatus = 'running' | 'done' | 'error';

interface ImportJob {
  id: string;
  tripId: string;
  userId: number;
  status: JobStatus;
  done: number;
  total: number;
  result?: BookingImportPreviewResponse;
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
 * `BookingImportService.preview` the synchronous endpoint uses.
 */
@Injectable()
export class ImportJobsService {
  private readonly jobs = new Map<string, ImportJob>();
  /** Tail of each user's job chain — parses run one at a time per user, not all at once. */
  private readonly chains = new Map<number, Promise<void>>();

  constructor(private readonly bookingImport: BookingImportService) {}

  /** Create a job and queue it behind the user's other parses; returns the job id at once. */
  start(tripId: string, files: Express.Multer.File[], mode: BookingImportMode, userId: number): string {
    const id = randomUUID();
    const job: ImportJob = { id, tripId, userId, status: 'running', done: 0, total: files.length, createdAt: Date.now() };
    this.jobs.set(id, job);
    // Chain onto the user's previous parse so they run sequentially (one CPU-heavy
    // inference at a time), while the request returns immediately.
    const prev = this.chains.get(userId) ?? Promise.resolve();
    const next = prev.then(() => this.run(job, files, mode)).catch(() => {});
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

  private async run(job: ImportJob, files: Express.Multer.File[], mode: BookingImportMode): Promise<void> {
    this.push(job, 'import:progress', { status: 'running', done: 0, total: job.total });
    try {
      const result = await this.bookingImport.preview(files, mode, job.userId, (done, total, fileName) => {
        job.done = done;
        this.push(job, 'import:progress', { status: 'running', done, total, fileName });
      });
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

  private push(job: ImportJob, type: string, payload: Record<string, unknown>): void {
    broadcastToUser(job.userId, { type, jobId: job.id, tripId: job.tripId, ...payload });
  }
}
