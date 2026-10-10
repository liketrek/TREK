import type { PhotoProviders } from '../entities/PhotoProviders.entity';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A `photo_providers` row as the API emits it. */
export interface PhotoProviderRow {
  id: string | null;
  name: string;
  description: string | null;
  icon: string | null;
  enabled: number | null;
  sort_order: number | null;
}

const _photoProviderRowKeys: AssertRowKeys<PhotoProviderRow, PhotoProviders> = true;

export class PhotoProvidersRepository extends TrekRepository<PhotoProviders> {
  /**
   * `SELECT id, name, icon, enabled, sort_order FROM photo_providers WHERE
   * enabled = 1 ORDER BY sort_order, id` — `enabled` is `p.integer()` on this
   * entity (unlike `Addons.enabled`, which is `p.boolean()`), so it comes
   * back as the raw stored `0`/`1`; `AddonsService.list()` does the `!!`
   * coercion itself, matching the legacy `!!p.enabled`.
   *
   * `disableIdentityMap: true`, applied by the base class's default (Plan 3b
   * interlude B — `_shared/trek-repository.ts`) — a "rows out"
   * read, converted via `toRow` and discarded.
   */
  async listEnabled(): Promise<PhotoProviderRow[]> {
    const rows = await this.find({ enabled: 1 }, { orderBy: { sort_order: 'asc', id: 'asc' } });
    return rows.map((row) => toRow(row) as PhotoProviderRow);
  }

  /**
   * UM1 (`UnifiedMemoriesService._providers`) — `SELECT id, enabled FROM
   * photo_providers` (`.all()`, no WHERE, no ORDER BY): every provider row,
   * enabled or not — the caller does its own journey-addon-gated filtering
   * in JS afterward. Distinct from {@link listEnabled} above, which is a
   * different legacy statement (WHERE-filtered, ordered) for a different
   * caller (the admin listing); do not collapse the two (D4).
   */
  async listAll(): Promise<Array<{ id: string; enabled: number }>> {
    const rows = await this.find({}, { fields: ['id', 'enabled'] });
    return rows.map((row) => ({ id: row.id ?? '', enabled: row.enabled ?? 0 }));
  }

  /** MMC1 (`MemoriesMcp.enabledProviderIds`) — `SELECT id FROM photo_providers WHERE enabled = 1`, no ORDER BY (unlike {@link listEnabled}'s admin-listing statement). */
  async listEnabledIds(): Promise<string[]> {
    const rows = await this.find({ enabled: 1 }, { fields: ['id'] });
    return rows.map((row) => row.id).filter((id): id is string => id != null);
  }

  /** MMC2 (`MemoriesMcp.providerRefusal`) — `SELECT enabled FROM photo_providers WHERE id = ?`. */
  async findEnabled(id: string): Promise<{ enabled: number | null } | null> {
    const row = await this.findOne({ id }, { fields: ['enabled'] });
    return row ? { enabled: row.enabled ?? null } : null;
  }

  // ---------------------------------------------------------------------
  // Plan 3i Task 1 (`AdminService` — AD27/AD31/AD34/AD37/AD40, admin's
  // addon-shelf listing + enabled writes).
  // ---------------------------------------------------------------------

  /**
   * AD27 (`admin.service.ts#listAddons`) — `SELECT id, name, description,
   * icon, enabled, sort_order FROM photo_providers ORDER BY sort_order,
   * id`, UNFILTERED (unlike {@link listEnabled}'s `WHERE enabled = 1`).
   */
  async listAllOrdered(): Promise<PhotoProviderRow[]> {
    const rows = await this.find({}, { orderBy: { sort_order: 'asc', id: 'asc' } });
    return rows.map((row) => toRow(row) as PhotoProviderRow);
  }

  /** AD31/AD40 (`admin.service.ts#updateAddon`'s pre-write read and post-TX re-select, byte-identical text at both sites) — `SELECT * FROM photo_providers WHERE id = ?`. */
  async findById(id: string): Promise<PhotoProviderRow | null> {
    const row = await this.findOne({ id });
    return row ? (toRow(row) as PhotoProviderRow) : null;
  }

  /**
   * AD34 (`admin.service.ts#updateAddon`, inside `uow.transactional`, the
   * Journey-off cascade — "Journey off takes its providers with it") —
   * `UPDATE photo_providers SET enabled = 0`, deliberately UNSCOPED (every
   * row, no WHERE). Named `disableAll`, not a generic `setEnabled` overload
   * that could be called with an accidentally omitted id (R4).
   */
  async disableAll(): Promise<void> {
    await this.nativeUpdate({}, { enabled: 0 });
  }

  /** AD37 (`admin.service.ts#updateAddon`, inside `uow.transactional`) — `UPDATE photo_providers SET enabled = ? WHERE id = ?`. `enabled` stays the raw stored int (this entity's column is `p.integer()`, not `p.boolean()` — see {@link listEnabled}'s docstring), matching the legacy `data.enabled ? 1 : 0` bind exactly. */
  async setEnabled(id: string, enabled: number): Promise<void> {
    await this.nativeUpdate({ id }, { enabled });
  }
}
