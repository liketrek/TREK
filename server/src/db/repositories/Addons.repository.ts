import type { Addons, AddonConfig } from '../entities/Addons.entity';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** An `addons` row as the API emits it. */
export interface AddonRow {
  id: string | null;
  name: string;
  description: string | null;
  type: string;
  icon: string | null;
  enabled: boolean | null;
  config: AddonConfig | null;
  sort_order: number | null;
}

const _addonRowKeys: AssertRowKeys<AddonRow, Addons> = true;

export class AddonsRepository extends TrekRepository<Addons> {
  /**
   * `SELECT enabled FROM addons WHERE id = ?`
   *
   * `disableIdentityMap: true`, applied by the base class's default (Plan 3b
   * interlude B — `_shared/trek-repository.ts`; supersedes Plan 3a's I1
   * "`refresh: true` on every PK-only `findOne`" — see
   * `Users.repository.ts`'s class-level docstring and
   * `.superpowers/sdd/2026-09-22-orm-phase3b/task-1-review.md` B1): a
   * throwaway forked context always sees a write on the same id inside the
   * same request (`admin.service.ts`'s still-raw `UPDATE addons SET enabled
   * = ?` on the same connection), and the entity never lands in the
   * request's identity map.
   */
  async isEnabled(id: string): Promise<boolean> {
    const row = await this.findOne({ id }, { fields: ['enabled'] });
    return !!row?.enabled;
  }

  /**
   * `SELECT id, name, type, icon, enabled FROM addons WHERE enabled = 1
   * ORDER BY sort_order` — this reads every scalar column (not just the
   * legacy statement's five), because `AddonsService.list()` already
   * explicitly picks the five fields it forwards to the client; narrowing the
   * query itself would need a second, `AssertRowKeys`-incompatible row type
   * for no parity benefit.
   */
  async listEnabled(): Promise<AddonRow[]> {
    const rows = await this.find({ enabled: true }, { orderBy: { sort_order: 'asc' } });
    return rows.map((row) => toRow(row) as AddonRow);
  }

  // ---------------------------------------------------------------------
  // Plan 3i Task 1 (`AdminService` — AD26/AD30/AD33/AD36/AD39, admin's
  // addon-shelf listing + config/enabled writes).
  // ---------------------------------------------------------------------

  /**
   * AD26 (`admin.service.ts#listAddons`) — `SELECT * FROM addons ORDER BY
   * sort_order, id`, UNFILTERED (unlike {@link listEnabled}'s `WHERE
   * enabled = 1`) — admin's own catalog listing, filtered afterward in JS
   * for managed-instance hiding.
   */
  async listAllOrdered(): Promise<AddonRow[]> {
    const rows = await this.find({}, { orderBy: { sort_order: 'asc', id: 'asc' } });
    return rows.map((row) => toRow(row) as AddonRow);
  }

  /** AD30/AD39 (`admin.service.ts#updateAddon`'s pre-write read and post-TX re-select, byte-identical text at both sites) — `SELECT * FROM addons WHERE id = ?`. */
  async findById(id: string): Promise<AddonRow | null> {
    const row = await this.findOne({ id });
    return row ? (toRow(row) as AddonRow) : null;
  }

  /** AD33 (`admin.service.ts#updateAddon`, inside `uow.transactional`) — `UPDATE addons SET enabled = ? WHERE id = ?`. */
  async setEnabled(id: string, enabled: boolean): Promise<void> {
    await this.nativeUpdate({ id }, { enabled: !!enabled });
  }

  /**
   * AD36 (`admin.service.ts#updateAddon`, inside `uow.transactional`) —
   * `UPDATE addons SET config = ? WHERE id = ?`. The LLM-parsing addon's API
   * key is already encrypted by `AdminService`
   * (`prepareLlmAddonConfigForWrite`) before this call — this repository
   * never touches the crypto, only persists whatever JSON blob it is
   * handed (3e R6's encrypted-column precedent: the service encrypts, the
   * repository passes the ciphertext through untouched). `config` is a
   * `p.json()` column — MikroORM serializes the object to the stored TEXT
   * column itself, the same JSON text the legacy statement's hand-called
   * `JSON.stringify` produced.
   */
  async setConfig(id: string, config: AddonConfig): Promise<void> {
    await this.nativeUpdate({ id }, { config });
  }
}
