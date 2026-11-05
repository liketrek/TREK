import { PlaceContribLog } from '../../db/entities/PlaceContribLog.entity';
import { PlaceContribOutbox } from '../../db/entities/PlaceContribOutbox.entity';
import type { PlaceContribLogRepository, PlaceContribLogWrite } from '../../db/repositories/PlaceContribLog.repository';
import type {
  OutboxCurrentRow,
  OutboxRow,
  PlaceContribOutboxRepository,
} from '../../db/repositories/PlaceContribOutbox.repository';
import { dbNow } from '../../db/types';
import { logInfo } from '../audit/audit-log.logger';
import { inOrder } from '../common/in-order';
import { valueHash } from '../common/value-hash';
import { UnitOfWork } from '../database/unit-of-work';
import { StorageService } from '../storage/storage.service';
import { contribJpeg } from './place-contrib-image';
import { PlaceContribSettings } from './place-contrib-settings';
import { PlaceContribClient, type ContribAnswer, type ServedPlace } from './place-contrib.client';
import {
  MAX_ATTEMPTS,
  NOT_ACCEPTING_WAIT_MS,
  OUTBOX_MAX_AGE_DAYS,
  PLACE_BODY_MAX_BYTES,
  PLACES_PER_RUN,
} from './place-contrib.constants';
import {
  UPLOADED_IMAGE_PREFIX,
  baseHashOf,
  dayOf,
  gersOf,
  logResultOf,
  payloadOf,
  requestCid,
  retryDelayMs,
  summaryOf,
} from './place-contrib.helpers';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  PLACE_CONTRIB_TERMS_VERSION,
  type PlaceContribField,
  type PlaceContribImageAnswer,
  type PlaceContribLogResult,
  type PlaceContribPlaceAnswer,
  type PlaceContribPlaceBody,
} from '@trek/shared';

const DAY_MS = 24 * 3_600_000;
/** The most a stored picture may weigh before it is read for sending: the upload cap. */
const STORED_IMAGE_MAX_BYTES = 20 * 1024 * 1024;
/** Old values are given up on in passes of this many. */
const EXPIRE_BATCH = 500;

/** Whether the run goes on with the next place or stops here (the service asked to wait, the key was refused). */
type Next = 'next' | 'stop';

/** What became of one queued value for good: the log line it gets, and it leaves the queue. */
interface Final {
  entry: OutboxRow;
  result: PlaceContribLogResult;
  reason: string | null;
}

/** What one run did, for the job's log line and the tests. */
interface SendRun {
  skipped: 'inactive' | 'paused' | null;
  places: number;
  expired: number;
}

/**
 * Sends what the queue holds to the TREK Places API, one place after the
 * other, at most PLACES_PER_RUN per run.
 *
 * Before a value goes, it is checked against the place once more: it must
 * still be what the place holds, and its origin row must still say the user
 * typed exactly that (C5). Anything else stays home and is logged as withheld.
 * A value the index already serves is not sent either.
 *
 * Every outcome is one of three: final (logged and gone from the queue),
 * another try later (10 min, 30 min, 2 h, 6 h, the service's Retry-After when
 * it names one, at most MAX_ATTEMPTS), or a pause for the whole run (a refused
 * key, the service not taking contributions). A refusal with a reason is
 * final; only an answer that never came, or a server error, is tried again.
 */
@Injectable()
export class PlaceContribSender {
  constructor(
    @InjectRepository(PlaceContribOutbox) private readonly outbox: PlaceContribOutboxRepository,
    @InjectRepository(PlaceContribLog) private readonly log: PlaceContribLogRepository,
    private readonly store: PlaceContribSettings,
    private readonly client: PlaceContribClient,
    private readonly storage: StorageService,
    private readonly uow: UnitOfWork,
  ) {}

  /** @txIndependent one place after the other, with a request between each place's writes. */
  async run(now: Date = new Date()): Promise<SendRun> {
    const fields = await this.store.activeFields();
    if (fields.length === 0) return { skipped: 'inactive', places: 0, expired: 0 };
    if (await this.store.pauseReason(now)) return { skipped: 'paused', places: 0, expired: 0 };
    const expired = await this.expire(now);
    const keys = await this.outbox.dueKeys(dbNow(now), PLACES_PER_RUN);
    let places = 0;
    await inOrder(keys, async (key) => {
      places += 1;
      return (await this.sendKey(key, fields, now)) !== 'stop';
    });
    if (places > 0 || expired > 0) logInfo(`Places contribution: ${places} place(s) sent, ${expired} expired`);
    return { skipped: null, places, expired };
  }

  /** Values queued for longer than OUTBOX_MAX_AGE_DAYS are dropped as withheld:expired. */
  private async expire(now: Date): Promise<number> {
    const before = dbNow(new Date(now.getTime() - OUTBOX_MAX_AGE_DAYS * DAY_MS));
    const old = await this.outbox.queuedBefore(before, EXPIRE_BATCH);
    await this.finish(
      old.map((entry): Final => ({ entry, result: 'withheld', reason: 'expired' })),
      now,
    );
    return old.length;
  }

  /** @txIndependent the stale values settle before the place's request, its answer after it. */
  private async sendKey(key: string, fields: PlaceContribField[], now: Date): Promise<Next> {
    const entries = await this.outbox.dueFor(key, dbNow(now));
    const current = new Map((await this.outbox.currentOf(entries.map((e) => e.id))).map((row) => [row.id, row]));
    const stale: Final[] = [];
    const valid: OutboxRow[] = [];
    for (const entry of entries) {
      const reason = staleReason(entry, current.get(entry.id), fields);
      if (reason) stale.push({ entry, result: 'withheld', reason });
      else valid.push(entry);
    }
    await this.finish(stale, now);
    const text = valid.filter((entry) => entry.field !== 'image');
    if (text.length > 0 && (await this.sendText(key, text, now)) === 'stop') return 'stop';
    const images = valid.filter((entry) => entry.field === 'image');
    const all = await inOrder(images, async (image) => (await this.sendImage(image, now)) !== 'stop');
    return all ? 'next' : 'stop';
  }

  /** @txIndependent the values the index already serves settle before the request, the rest after it. */
  private async sendText(key: string, entries: OutboxRow[], now: Date): Promise<Next> {
    const gers = gersOf(key);
    const served = gers ? await this.client.servedPlace(gers) : null;
    const unchanged = entries.filter((entry) => servedValue(served, entry.field) === entry.value);
    await this.finish(
      unchanged.map((entry): Final => ({ entry, result: 'withheld', reason: 'unchanged' })),
      now,
    );
    const rest = entries.filter((entry) => !unchanged.includes(entry));
    if (rest.length === 0) return 'next';
    const body = placeBody(key, rest, served);
    if (Buffer.byteLength(JSON.stringify(body), 'utf8') > PLACE_BODY_MAX_BYTES) {
      await this.finish(
        rest.map((entry): Final => ({ entry, result: 'withheld', reason: 'too_large' })),
        now,
      );
      return 'next';
    }
    return this.settlePlace(rest, await this.client.postPlace(body), now);
  }

  /** @txIndependent a picture that cannot go settles at once, one that goes after its request. */
  private async sendImage(entry: OutboxRow, now: Date): Promise<Next> {
    const bytes = await this.storedImage(entry.value.slice(UPLOADED_IMAGE_PREFIX.length));
    const jpeg = bytes ? await contribJpeg(bytes) : null;
    if (!jpeg) {
      await this.finish([{ entry, result: 'withheld', reason: bytes ? 'image_unreadable' : 'image_missing' }], now);
      return 'next';
    }
    const answer = await this.client.postImage(entry.contrib_key, requestCid([entry.cid]), jpeg);
    // Images are off on the service until it screens them. That is no failure
    // to try again: the picture stays home and the log says so.
    if (answer.kind === 'refused' && answer.error === 'images_disabled') {
      await this.finish([{ entry, result: 'withheld', reason: 'images_disabled' }], now);
      return 'next';
    }
    return this.settleImage(entry, answer, now);
  }

  private async settlePlace(
    entries: OutboxRow[],
    answer: ContribAnswer<PlaceContribPlaceAnswer>,
    now: Date,
  ): Promise<Next> {
    if (answer.kind === 'failed') return this.retry(entries, { now, retryAfterMs: answer.retryAfterMs });
    if (answer.kind === 'refused') return this.refused(entries, answer, now);
    const finals: Final[] = [];
    const quota: OutboxRow[] = [];
    for (const entry of entries) {
      const outcome = answer.body.results[entry.field as PlaceContribField];
      if (!outcome) {
        finals.push({ entry, result: answer.body.duplicate ? 'duplicate' : 'rejected', reason: 'no_result' });
      } else if (outcome.result === 'quota') {
        quota.push(entry);
      } else {
        finals.push({ entry, result: logResultOf(outcome.result), reason: outcome.reason ?? outcome.result });
      }
    }
    await this.uow.transactional(async () => {
      await this.finish(finals, now);
      if (quota.length > 0) await this.retry(quota, { now, retryAfterMs: null });
    });
    return 'next';
  }

  private async settleImage(
    entry: OutboxRow,
    answer: ContribAnswer<PlaceContribImageAnswer>,
    now: Date,
  ): Promise<Next> {
    if (answer.kind === 'failed') return this.retry([entry], { now, retryAfterMs: answer.retryAfterMs });
    if (answer.kind === 'refused') return this.refused([entry], answer, now);
    const outcome = answer.body.result;
    if (outcome.result === 'quota') return this.retry([entry], { now, retryAfterMs: null });
    await this.finish([{ entry, result: logResultOf(outcome.result), reason: outcome.reason ?? outcome.result }], now);
    return 'next';
  }

  /** A status with the service's reason: its writes land together. */
  private async refused(
    entries: OutboxRow[],
    refusal: { status: number; error: string; retryAfterMs: number | null },
    now: Date,
  ): Promise<Next> {
    return this.uow.transactional(() => this.settleRefusal(entries, refusal, now));
  }

  private async settleRefusal(
    entries: OutboxRow[],
    refusal: { status: number; error: string; retryAfterMs: number | null },
    now: Date,
  ): Promise<Next> {
    if (refusal.status === 401 || refusal.status === 403) {
      // The key is not taken: wait for another one, never fall back to sending without.
      await this.store.pauseFor(refusal.status === 401 ? 'key_invalid' : 'key_refused', null);
      await this.outbox.postpone(entries, dbNow(new Date(now.getTime() + NOT_ACCEPTING_WAIT_MS)));
      return 'stop';
    }
    if (refusal.status === 429) {
      await this.retry(entries, { now, retryAfterMs: refusal.retryAfterMs });
      return 'stop';
    }
    if (refusal.status === 503) {
      const until = new Date(now.getTime() + (refusal.retryAfterMs ?? NOT_ACCEPTING_WAIT_MS));
      await this.store.pauseFor('not_accepting', until);
      await this.outbox.postpone(entries, dbNow(until));
      return 'stop';
    }
    const refusedField = /^field_not_accepted:([a-z_]+)$/.exec(refusal.error)?.[1];
    if (refusedField) {
      // The service names the one field it does not take; the others go again
      // on the next run, without it, and without counting an attempt.
      const [taken, others] = partition(entries, (entry) => entry.field === refusedField);
      await this.finish(
        taken.map((entry): Final => ({ entry, result: 'rejected', reason: refusal.error })),
        now,
      );
      await this.outbox.postpone(others, dbNow(now));
      return 'next';
    }
    await this.finish(
      entries.map((entry): Final => ({ entry, result: 'rejected', reason: refusal.error })),
      now,
    );
    return 'next';
  }

  /** Another try later, or given up after MAX_ATTEMPTS. */
  private async retry(entries: OutboxRow[], opts: { now: Date; retryAfterMs: number | null }): Promise<Next> {
    const [givenUp, again] = partition(entries, (entry) => entry.attempts + 1 >= MAX_ATTEMPTS);
    const attempts = Math.max(1, ...again.map((entry) => entry.attempts + 1));
    const next = dbNow(new Date(opts.now.getTime() + (opts.retryAfterMs ?? retryDelayMs(attempts))));
    await this.uow.transactional(async () => {
      await this.outbox.scheduleRetry(again, next);
      await this.finishInTx(
        givenUp.map((entry): Final => ({ entry, result: 'withheld', reason: 'gave_up' })),
        opts.now,
      );
    });
    return 'next';
  }

  /** Logs the outcomes and takes the values out of the queue, together. */
  private async finish(finals: Final[], now: Date): Promise<void> {
    if (finals.length === 0) return;
    await this.uow.transactional(() => this.finishInTx(finals, now));
  }

  private async finishInTx(finals: Final[], now: Date): Promise<void> {
    if (finals.length === 0) return;
    await this.log.insertLines(finals.map((final) => logLine(final, now)));
    await this.outbox.deleteSent(finals.map((final) => final.entry));
  }

  /** The bytes of an uploaded place picture, null when it is gone or heavier than any upload could be. */
  private async storedImage(name: string): Promise<Buffer | null> {
    if (!name || name.includes('/')) return null;
    try {
      const stat = await this.storage.stat('places', name);
      if (!stat || stat.size > STORED_IMAGE_MAX_BYTES) return null;
      const { stream } = await this.storage.getStream('places', name);
      const chunks: Buffer[] = [];
      let total = 0;
      for await (const chunk of stream) {
        const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
        total += part.length;
        if (total > STORED_IMAGE_MAX_BYTES) {
          stream.destroy();
          return null;
        }
        chunks.push(part);
      }
      return Buffer.concat(chunks);
    } catch {
      return null;
    }
  }
}

/** Why a queued value may not go any more, or null when it still may. */
function staleReason(
  entry: OutboxRow,
  current: OutboxCurrentRow | undefined,
  fields: readonly PlaceContribField[],
): string | null {
  const field = entry.field as PlaceContribField;
  if (!fields.includes(field)) return 'field_off';
  if (!current || current.origin !== 'user' || !current.value_hash) return 'origin_changed';
  const column = columnOf(current, field);
  if (column === null || valueHash(column) !== current.value_hash) return 'origin_stale';
  const payload = payloadOf(field, column);
  return 'value' in payload && payload.value === entry.value ? null : 'value_changed';
}

/** The column a field is stored in. */
function columnOf(row: OutboxCurrentRow, field: PlaceContribField): string | null {
  return field === 'image' ? row.image_url : row[field];
}

/** What the index serves for a field, in the form a queued value has; null when it serves nothing. */
function servedValue(served: ServedPlace | null, field: string): string | null {
  if (!served || field === 'image') return null;
  const raw = served[field as Exclude<PlaceContribField, 'image'>];
  if (!raw) return null;
  // Served hours are OSM syntax already, which is the form a queued value has.
  if (field === 'opening_hours') return raw.trim() || null;
  const payload = payloadOf(field as PlaceContribField, raw);
  return 'value' in payload ? payload.value : null;
}

function placeBody(key: string, entries: OutboxRow[], served: ServedPlace | null): PlaceContribPlaceBody {
  const first = entries[0];
  const fields: PlaceContribPlaceBody['fields'] = {};
  for (const entry of entries) {
    const field = entry.field as Exclude<PlaceContribField, 'image'>;
    fields[field] = { value: entry.value, baseHash: baseHashOf(served?.[field]) };
  }
  return {
    v: 1,
    termsVersion: PLACE_CONTRIB_TERMS_VERSION,
    cid: requestCid(entries.map((entry) => entry.cid)),
    key,
    fields,
    place: {
      name: first.place_name.slice(0, 200),
      lat: first.lat,
      lng: first.lng,
      country: first.country && /^[A-Z]{2}$/.test(first.country) ? first.country : null,
    },
  };
}

function logLine(final: Final, now: Date): PlaceContribLogWrite {
  const field = final.entry.field as PlaceContribField;
  return {
    day: dayOf(now),
    contrib_key: final.entry.contrib_key,
    place_name: final.entry.place_name,
    field,
    value_summary: summaryOf(field, final.entry.value),
    result: final.result,
    reason: final.reason?.slice(0, 200) ?? null,
  };
}

function partition<T>(items: T[], test: (item: T) => boolean): [T[], T[]] {
  const yes: T[] = [];
  const no: T[] = [];
  for (const item of items) (test(item) ? yes : no).push(item);
  return [yes, no];
}
