import { IdempotencyKeys } from '../../db/entities/IdempotencyKeys.entity';
import type {
  IdempotencyKeysRepository,
  IdempotencyResponseRow,
} from '../../db/repositories/IdempotencyKeys.repository';
import { InjectRepository } from '@mikro-orm/nestjs';
import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from '@nestjs/common';

import type { Request, Response } from 'express';
import { Observable, from, of } from 'rxjs';
import { finalize, mergeAll, switchMap } from 'rxjs/operators';

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
 *
 * Plan 4 Task 1: `lookup`/the `res.json` capture moved off `DatabaseService`
 * onto `IdempotencyKeysRepository` — both are now genuinely async repository
 * calls, not a synchronous `better-sqlite3` read/write wrapped in a Promise.
 * Program rule 11 names THIS file as the "check then act" race the async
 * conversion opens up: the `inFlight` claim used to be race-free only because
 * `lookup` resolved inside the same macrotask as the call that checked it. Now
 * that `lookup` genuinely awaits, the claim is taken BEFORE the first await —
 * see `intercept`'s own comment — so a second concurrent request for the same
 * key always finds the first request's in-flight promise and waits, rather
 * than racing it to an empty `inFlight` map.
 */

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const MAX_KEY_LENGTH = 128;
const MAX_CACHED_BODY_BYTES = 256 * 1024;

/**
 * (user, method, path, key) of every request currently running, resolved when it
 * answers. In memory rather than a reservation row on purpose: the process
 * that claims a signature is always the one that releases it, so a crash
 * cannot leave a key wedged for the table's 30-day TTL.
 */
const inFlight = new Map<string, Promise<void>>();

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(@InjectRepository(IdempotencyKeys) private readonly idempotencyKeys: IdempotencyKeysRepository) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
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

    const signature = `${userId}|${req.method}|${req.path}|${key}`;
    const pending = inFlight.get(signature);
    if (pending !== undefined) {
      // The wait stays inside the stream, where it was: `intercept` answers at
      // once with an Observable that only produces when the first request has.
      // `afterPending` is async now (the store read is), so what switchMap emits
      // is itself an Observable and needs the extra mergeAll to be flattened.
      return from(pending).pipe(
        switchMap(() => this.afterPending(signature, key, userId, req, res, next)),
        mergeAll(),
      );
    }

    // Claim the signature BEFORE the first `await` below (rule 11). Two
    // requests for the same key that both reach here concurrently must not
    // both see "nothing is in flight" — `lookup` is a real repository read
    // now, so it can genuinely yield the event loop, and a claim taken only
    // after it resolves would leave the exact window between two `awaits`
    // that overlapping replays exploited before the in-flight map existed.
    // Claiming here, synchronously, means the SECOND request always finds
    // the `pending` branch above instead.
    const release = this.claim(signature);
    try {
      const existing = await this.lookup(key, userId, req);
      if (existing) {
        release();
        return this.replay(existing, res);
      }
    } catch (err) {
      release();
      throw err;
    }

    return this.execute(key, userId, req, res, next, release);
  }

  /**
   * What a waiter does once the request holding its key has answered: replay the
   * response that request stored, or — when it stored nothing (it failed, or it
   * never went through res.json) — run normally rather than inventing one.
   */
  private async afterPending(
    signature: string,
    key: string,
    userId: number,
    req: Request,
    res: Response,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const stored = await this.lookup(key, userId, req);
    if (stored) return this.replay(stored, res);
    const release = this.claim(signature);
    return this.execute(key, userId, req, res, next, release);
  }

  /**
   * Reserve `signature` in the in-flight map and hand back its release. Split
   * out from `execute` so `intercept` can call it synchronously, before its
   * own first `await` — see the class docstring and `intercept`'s comment.
   */
  private claim(signature: string): () => void {
    let done!: () => void;
    inFlight.set(
      signature,
      new Promise<void>((resolve) => {
        done = resolve;
      }),
    );
    let released = false;
    // Idempotent: whichever of the two paths below gets there first releases the
    // waiter, and the other one is a no-op.
    return () => {
      if (released) return;
      released = true;
      inFlight.delete(signature);
      done();
    };
  }

  /**
   * Scope the lookup by method + path as well as user, so the same key replayed
   * against a different endpoint can't return an unrelated cached body.
   */
  private async lookup(key: string, userId: number, req: Request): Promise<IdempotencyResponseRow | null> {
    return this.idempotencyKeys.findResponse(key, userId, req.method, req.path);
  }

  private replay(row: IdempotencyResponseRow, res: Response): Observable<unknown> {
    res.status(row.status_code);
    return of(JSON.parse(row.response_body));
  }

  private execute(
    key: string,
    userId: number,
    req: Request,
    res: Response,
    next: CallHandler,
    release: () => void,
  ): Observable<unknown> {
    const originalJson = res.json.bind(res);
    const idempotencyKeys = this.idempotencyKeys;

    res.json = function (body: unknown): Response {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const serialized = JSON.stringify(body);
          if (serialized.length <= MAX_CACHED_BODY_BYTES) {
            // Fire-and-forget, not awaited: `res.json` is Express's synchronous
            // override contract (it must return `Response` for the caller to
            // keep chaining), and the store write's own errors are already
            // non-fatal (below) — same shape as the legacy synchronous
            // `database.run` this replaces, just genuinely async underneath.
            void idempotencyKeys
              .insertIfAbsent({
                key,
                user_id: userId,
                method: req.method,
                path: req.path,
                status_code: res.statusCode,
                response_body: serialized,
                created_at: Math.floor(Date.now() / 1000),
              })
              .catch(() => {
                /* Non-fatal: if storage fails, the request still succeeds. */
              })
              .finally(release);
            return originalJson(body);
          }
        } catch {
          // Non-fatal: if storage fails, the request still succeeds.
        }
      }
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
