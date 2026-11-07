import { PlaceContribOutbox } from '../../db/entities/PlaceContribOutbox.entity';
import type { PlacesContributeBackfill } from '../../db/json-columns';
import type { PlaceContribOutboxRepository, PlaceTypedRow } from '../../db/repositories/PlaceContribOutbox.repository';
import { getCountryFromCoords } from '../../utils/country-borders';
import { logInfo } from '../audit/audit-log.logger';
import { inOrder } from '../common/in-order';
import { valueHash } from '../common/value-hash';
import { UnitOfWork } from '../database/unit-of-work';
import { PlaceContribQueue } from './place-contrib-queue';
import { PlaceContribSettings } from './place-contrib-settings';
import { contribKeyOf } from './place-contrib.helpers';
import type { ContribWrite } from './place-contrib.types';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { PLACE_CONTRIB_COLUMN, type PlaceContribField } from '@trek/shared';

/** Places read per step of the catch-up. */
const BACKFILL_PAGE = 100;
/** The catch-up only adds to the queue while it holds fewer values than this, so new writes never wait behind it. */
export const BACKFILL_LOW_WATER = 200;

/**
 * The catch-up after an agreement: everything users typed into places since
 * the origin tracking began (TREK 5.1.0) goes out as well, not only what they
 * type from the agreement on. It walks the places page by page on the sender's
 * schedule and only tops the queue up, so it never fills it and a restart
 * goes on where it stopped.
 *
 * A value goes only while it is still the one the user typed (its hash
 * matches the origin), for a field switched on, and for a place the service
 * can key; a place without such a key is passed over without a log line. A
 * value a save queued for the same key and field is newer and stays.
 */
@Injectable()
export class PlaceContribBackfill {
  constructor(
    @InjectRepository(PlaceContribOutbox) private readonly outbox: PlaceContribOutboxRepository,
    private readonly store: PlaceContribSettings,
    private readonly queue: PlaceContribQueue,
    private readonly uow: UnitOfWork,
  ) {}

  /**
   * One step: queues the next page of earlier values when the queue has room.
   * Waits while sending is not possible (no key yet, not eligible), and ends
   * the catch-up once no place is left. Answers how many places it queued.
   */
  async step(now: Date = new Date()): Promise<number> {
    const pending = await this.store.backfill();
    if (pending === null) return 0;
    const active = await this.store.activeFields();
    if (active.length === 0) return 0;
    const fields = pending.fields.filter((field) => active.includes(field));
    if (fields.length === 0) {
      await this.store.writeBackfill(null);
      return 0;
    }
    if ((await this.outbox.size()) >= BACKFILL_LOW_WATER) return 0;
    const page = await this.outbox.typedAfter(pending.afterId, fields, BACKFILL_PAGE);
    if (page.length === 0) {
      await this.store.writeBackfill(null);
      logInfo('Places contribution: the place details typed before the agreement are all queued');
      return 0;
    }
    // The reads above ran outside the transaction, so a withdrawal, a switch
    // off or a field change may have committed meanwhile. Only a catch-up that
    // still stands where it was read goes on, and only for fields still on:
    // what was just taken back must not be queued again.
    return this.uow.transactional(async () => {
      if (!sameBackfill(await this.store.backfill(), pending)) return 0;
      const stillActive = await this.store.activeFields();
      const live = fields.filter((field) => stillActive.includes(field));
      if (live.length === 0) return 0;
      const writes = page.map((row) => typedWrite(row, live)).filter((write) => write.values.length > 0);
      await inOrder(writes, (write) => this.queue.put(write, live, now, { keepQueued: true }));
      await this.store.writeBackfill({ fields: live, afterId: page[page.length - 1].place.id });
      return writes.length;
    });
  }
}

function sameBackfill(current: PlacesContributeBackfill | null, read: PlacesContributeBackfill): boolean {
  return (
    current !== null &&
    current.afterId === read.afterId &&
    current.fields.length === read.fields.length &&
    current.fields.every((field, i) => field === read.fields[i])
  );
}

/** The values of one place that are still the ones a user typed, for a place the service can key. */
function typedWrite(row: PlaceTypedRow, fields: readonly PlaceContribField[]): ContribWrite {
  const { place } = row;
  const keyed = contribKeyOf(place.osm_id) !== null;
  const values = row.typed.flatMap(({ field, value_hash }) => {
    const known = fields.find((candidate) => candidate === field);
    const value = known ? place[PLACE_CONTRIB_COLUMN[known]] : null;
    if (!keyed || !known || typeof value !== 'string' || value.trim() === '') return [];
    return valueHash(value) === value_hash ? [{ field: known, value }] : [];
  });
  return {
    placeId: place.id,
    osmId: place.osm_id,
    name: place.name,
    lat: place.lat,
    lng: place.lng,
    country:
      values.length > 0 && place.lat !== null && place.lng !== null ? getCountryFromCoords(place.lat, place.lng) : null,
    values,
    dropped: [],
  };
}
