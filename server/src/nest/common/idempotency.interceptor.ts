import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, from, of } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import { DatabaseService } from '../database/database.service';

/**
 * Replaces the `applyIdempotency` middleware the Express `authenticate` ran on
 * every authenticated request. Both are gone; this is the only implementation.
 *
 * The TREK client attaches an `X-Idempotency-Key` to ALL write operations (see
 * client/src/api/client.ts) and the offline sync queue replays mutations with
 * that key, so a migrated mutating route MUST honour it — otherwise a replayed
 * POST would create a duplicate instead of returning the cached response. This
 * reproduces the legacy behaviour exactly, against the same `idempotency_keys`
 * table:
 *   - non-mutating method, or no key, or no authenticated user -> pass through
 *   - key longer than the cap -> 400 with the exact legacy message
 *   - (key, user, method, path) already stored -> replay the cached response
 *   - the same key still in flight -> wait for it, then replay its response
 *   - otherwise -> capture a successful JSON response under the key
 *
 * The in-flight step is the one thing the Express wrapper did not do. The row
 * only exists once the first request answers, so two overlapping replays of one
 * key (two tabs draining the same offline queue, or a client retrying after a
 * timeout) both missed the SELECT and both ran the handler — the duplicate
 * write the key exists to prevent. Waiting keeps the promise the client was
 * given: the second caller gets the first one's response, not a new error to
 * interpret.
 *
 * Capturing wraps `res.json`, so 204 / `res.end()` responses are not cached —
 * matching the Express wrapper, which only fires on `res.json`.
 */

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const MAX_KEY_LENGTH = 128;
const MAX_CACHED_BODY_BYTES = 256 * 1024;

/**
 * (user, method, path, key) of every request currently running, resolved when it
 * answers. In memory rather than a reservation row on purpose: better-sqlite3 is
 * synchronous and the whole overlap lives inside one process, so a crash cannot
 * leave a key wedged for the table's 30-day TTL.
 */
const inFlight = new Map<string, Promise<void>>();

interface IdempotencyRow {
  status_code: number;
  response_body: string;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly database: DatabaseService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: { id: number } }>();
    const res = context.switchToHttp().getResponse<Response>();

    if (!MUTATING_METHODS.has(req.method)) return next.handle();

    const key = req.headers['x-idempotency-key'] as string | undefined;
    if (!key) return next.handle();

    // Idempotency only applies to authenticated requests — the legacy code runs
    // inside `authenticate`, after req.user is set.
    const userId = req.user?.id;
    if (userId == null) return next.handle();

    if (key.length > MAX_KEY_LENGTH) {
      throw new HttpException({ error: 'X-Idempotency-Key exceeds maximum length of 128 characters' }, 400);
    }

    const existing = this.lookup(key, userId, req);
    if (existing) return this.replay(existing, res);

    const signature = `${userId}|${req.method}|${req.path}|${key}`;
    const pending = inFlight.get(signature);
    if (pending !== undefined) {
      return from(pending).pipe(
        switchMap(() => {
          const stored = this.lookup(key, userId, req);
          if (stored) return this.replay(stored, res);
          // The first request answered without caching anything (it failed, or
          // it never went through res.json). Run this one normally rather than
          // inventing a response for it.
          return this.run(signature, key, userId, req, res, next);
        }),
      );
    }

    return this.run(signature, key, userId, req, res, next);
  }

  /**
   * Scope the lookup by method + path as well as user, so the same key replayed
   * against a different endpoint can't return an unrelated cached body.
   */
  private lookup(key: string, userId: number, req: Request): IdempotencyRow | undefined {
    return this.database.get<IdempotencyRow>(
      'SELECT status_code, response_body FROM idempotency_keys WHERE key = ? AND user_id = ? AND method = ? AND path = ?',
      key, userId, req.method, req.path,
    );
  }

  private replay(row: IdempotencyRow, res: Response): Observable<unknown> {
    res.status(row.status_code);
    return of(JSON.parse(row.response_body));
  }

  private run(
    signature: string,
    key: string,
    userId: number,
    req: Request,
    res: Response,
    next: CallHandler,
  ): Observable<unknown> {
    const originalJson = res.json.bind(res);
    const database = this.database;

    let done!: () => void;
    inFlight.set(signature, new Promise<void>((resolve) => { done = resolve; }));
    let released = false;
    // Idempotent: whichever of the two paths below gets there first releases the
    // waiter, and the other one is a no-op.
    const release = () => {
      if (released) return;
      released = true;
      inFlight.delete(signature);
      done();
    };

    res.json = function (body: unknown): Response {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const serialized = JSON.stringify(body);
          if (serialized.length <= MAX_CACHED_BODY_BYTES) {
            database.run(
              `INSERT OR IGNORE INTO idempotency_keys (key, user_id, method, path, status_code, response_body, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              key, userId, req.method, req.path, res.statusCode, serialized, Math.floor(Date.now() / 1000),
            );
          }
        } catch {
          // Non-fatal: if storage fails, the request still succeeds.
        }
      }
      // Release here, not in finalize: this is the point the row exists, and a
      // waiter woken any earlier looks the key up, misses, and runs the handler
      // a second time - the duplicate write the key is meant to prevent.
      // Release here, not in finalize: this is the point the row exists, and a
      // waiter woken any earlier looks the key up, misses, and runs the handler
      // a second time - the duplicate write the key is meant to prevent.
      release();
      return originalJson(body);
    };

    return next.handle().pipe(
      finalize(() => {
        // Backstop for a handler that never reaches res.json: it threw, or it
        // answered through @Res() with send/end. Deferred by a full tick because
        // finalize runs when the handler's observable completes and Nest writes
        // the response several microtasks after that - firing straight away
        // would beat the wrapper above to it on the ordinary path.
        setImmediate(release);
      }),
    );
  }
}
