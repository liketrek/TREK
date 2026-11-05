import { PlaceFieldOrigin } from '../../db/entities/PlaceFieldOrigin.entity';
import type {
  PlaceFieldOriginRepository,
  PlaceOriginWrite,
  PlaceShareableRow,
} from '../../db/repositories/PlaceFieldOrigin.repository';
import { dbNow } from '../../db/types';
import { resolveCountryCodeSync } from '../atlas/atlas-geo';
import { logWarn } from '../audit/audit-log.logger';
import { toRowId } from '../common/row-id';
import { valueHash } from '../common/value-hash';
import { UnitOfWork } from '../database/unit-of-work';
import { PlaceContribService } from '../place-contrib/place-contrib.service';
import {
  changedFields,
  needsProviders,
  originFor,
  providerIdsOf,
  providerValuesOf,
  snapshotOf,
  type OriginSnapshot,
  type OriginWriter,
  type ProviderValue,
} from './place-origins.helpers';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { PlaceContribField } from '@trek/shared';

/**
 * Where the shareable details of a place came from (website, phone, e-mail,
 * opening hours, description, picture), recorded after every place write.
 *
 * A write records an origin for each field whose value it changed, with the
 * hash of the new value: `user` for what a person typed, the provider for what
 * a search pick or a details lookup filled, `agent`, `plugin`, `import` or
 * `attachment` for the paths that decide themselves, `unknown` for a change
 * nobody vouched for. A cleared value loses its row. An unchanged value keeps
 * the row it had, so a value that existed before this tracking has none and is
 * never shared.
 *
 * The user's values then go to the contribution queue, which decides whether
 * anything is sent at all. Recording never fails the write it follows.
 */
@Injectable()
export class PlaceOriginsService {
  constructor(
    @InjectRepository(PlaceFieldOrigin) private readonly origins: PlaceFieldOriginRepository,
    private readonly contrib: PlaceContribService,
    private readonly uow: UnitOfWork,
  ) {}

  /** The shareable values of a place before a write, for {@link record} to see what changed; null without one. */
  async valuesBefore(placeId: number | string): Promise<OriginSnapshot | null> {
    const id = toRowId(placeId);
    if (id === null) return null;
    try {
      const row = await this.origins.placeValues(id);
      return row ? snapshotOf(row) : null;
    } catch (err) {
      logWarn(`Place origins: reading place ${id} failed: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  /**
   * Records the origins of what this write changed, then hands the user's
   * values to the contribution queue. `before` is null for a new place.
   *
   * @txStandalone a derived write after the place write committed; a failure is logged, never raised.
   */
  async record(placeId: number, before: OriginSnapshot | null, writer: OriginWriter): Promise<void> {
    try {
      await this.recordChanges(placeId, before, writer);
    } catch (err) {
      logWarn(`Place origins: recording place ${placeId} failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * New places from a file or a list import: every value they hold is the
   * import's. One read and one write for the whole batch.
   *
   * @txStandalone a derived write after the import committed; a failure is logged, never raised.
   */
  async recordImported(placeIds: number[]): Promise<void> {
    try {
      const rows = await this.origins.placeValuesMany(placeIds);
      const updatedAt = dbNow();
      const writes = rows.flatMap((row) => {
        const after = snapshotOf(row);
        return changedFields(null, after).map((field) => originWrite(row.id, field, after, 'import', updatedAt));
      });
      await this.origins.upsertOrigins(writes);
    } catch (err) {
      logWarn(`Place origins: recording an import failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async recordChanges(placeId: number, before: OriginSnapshot | null, writer: OriginWriter): Promise<void> {
    const row = await this.origins.placeValues(placeId);
    if (!row) return;
    const after = snapshotOf(row);
    const changed = changedFields(before, after).filter(
      (field) => writer.kind !== 'fixed' || writer.field === undefined || writer.field === field,
    );
    if (changed.length === 0) return;
    const providers = needsProviders(writer, changed) ? await this.providerValues(row) : [];
    const updatedAt = dbNow();
    const writes: PlaceOriginWrite[] = [];
    const cleared: PlaceContribField[] = [];
    const typed: PlaceContribField[] = [];
    for (const field of changed) {
      const value = after[field];
      if (value === null) {
        cleared.push(field);
        continue;
      }
      const origin = originFor(field, value, writer, providers);
      writes.push(originWrite(placeId, field, after, origin, updatedAt));
      if (origin === 'user') typed.push(field);
    }
    await this.uow.transactional(async () => {
      await this.origins.deleteOrigins(placeId, cleared);
      await this.origins.upsertOrigins(writes);
    });
    await this.contrib.enqueue({
      placeId,
      osmId: row.osm_id,
      name: row.name,
      lat: row.lat,
      lng: row.lng,
      country: resolveCountryCodeSync(row),
      values: typed.map((field) => ({ field, value: after[field] ?? '' })),
      dropped: changed.filter((field) => !typed.includes(field)),
    });
  }

  /** What the providers this instance asked handed out for the place, read from their cached records. */
  private async providerValues(row: PlaceShareableRow): Promise<ProviderValue[]> {
    return providerValuesOf(await this.origins.cachedProviderPayloads(providerIdsOf(row)));
  }
}

function originWrite(
  placeId: number,
  field: PlaceContribField,
  after: OriginSnapshot,
  origin: PlaceOriginWrite['origin'],
  updatedAt: string,
): PlaceOriginWrite {
  return { place_id: placeId, field, origin, value_hash: valueHash(after[field] ?? ''), updated_at: updatedAt };
}
