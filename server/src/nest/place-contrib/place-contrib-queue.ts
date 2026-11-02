import { PlaceContribLog } from '../../db/entities/PlaceContribLog.entity';
import { PlaceContribOutbox } from '../../db/entities/PlaceContribOutbox.entity';
import type { PlaceContribLogRepository, PlaceContribLogWrite } from '../../db/repositories/PlaceContribLog.repository';
import type { PlaceContribOutboxRepository } from '../../db/repositories/PlaceContribOutbox.repository';
import { dbNow } from '../../db/types';
import { inOrder } from '../common/in-order';
import { OUTBOX_CAP } from './place-contrib.constants';
import { contribKeyOf, dayOf, newEntryCid, payloadOf, summaryOf } from './place-contrib.helpers';
import type { ContribValue, ContribWrite } from './place-contrib.types';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { PlaceContribField } from '@trek/shared';

/**
 * Puts the user's values of one place into the contribution queue, for a
 * place write and for the catch-up after an agreement alike. Runs inside the
 * caller's transaction and sends nothing itself.
 */
@Injectable()
export class PlaceContribQueue {
  constructor(
    @InjectRepository(PlaceContribOutbox) private readonly outbox: PlaceContribOutboxRepository,
    @InjectRepository(PlaceContribLog) private readonly log: PlaceContribLogRepository,
  ) {}

  /**
   * Values that are no longer the user's leave the queue; the user's values
   * are queued for the fields switched on, and only for a place the service
   * can key. The newest value replaces a queued one; with `keepQueued` (the
   * catch-up, whose values are older than anything a save queued) a value
   * already waiting for the same key and field is left as it is.
   */
  async put(
    write: ContribWrite,
    active: readonly PlaceContribField[],
    now: Date,
    opts: { keepQueued?: boolean } = {},
  ): Promise<void> {
    await this.outbox.deleteForPlace(write.placeId, write.dropped);
    const shared = write.values.filter((value) => active.includes(value.field));
    if (shared.length === 0) return;
    const key = contribKeyOf(write.osmId);
    if (!key) {
      await this.log.insertLines(shared.map((value) => withheldLine(write, value, now, 'no_contrib_key')));
      return;
    }
    const due = dbNow(now);
    await inOrder(shared, (value) => this.queueOne(write, { key, value, due, now }, opts.keepQueued === true));
  }

  private async queueOne(
    write: ContribWrite,
    entry: { key: string; value: ContribValue; due: string; now: Date },
    keepQueued: boolean,
  ): Promise<void> {
    if (keepQueued && (await this.outbox.hasEntry(entry.key, entry.value.field))) return;
    const payload = payloadOf(entry.value.field, entry.value.value);
    if ('withheld' in payload) {
      await this.outbox.deleteForPlace(write.placeId, [entry.value.field]);
      await this.log.insertLines([withheldLine(write, entry.value, entry.now, payload.withheld)]);
      return;
    }
    // At the cap nothing new is queued; a value that replaces a queued one still does.
    if ((await this.outbox.size()) >= OUTBOX_CAP && !(await this.outbox.hasEntry(entry.key, entry.value.field))) {
      await this.log.insertLines([withheldLine(write, entry.value, entry.now, 'queue_full')]);
      return;
    }
    await this.outbox.upsertEntry({
      contrib_key: entry.key,
      field: entry.value.field,
      value: payload.value,
      place_id: write.placeId,
      place_name: write.name,
      lat: write.lat,
      lng: write.lng,
      country: write.country,
      cid: newEntryCid(),
      eligible_at: entry.due,
      next_attempt_at: entry.due,
    });
  }
}

function withheldLine(write: ContribWrite, value: ContribValue, now: Date, reason: string): PlaceContribLogWrite {
  return {
    day: dayOf(now),
    contrib_key: contribKeyOf(write.osmId) ?? '-',
    place_name: write.name,
    field: value.field,
    value_summary: summaryOf(value.field, value.value),
    result: 'withheld',
    reason,
  };
}
