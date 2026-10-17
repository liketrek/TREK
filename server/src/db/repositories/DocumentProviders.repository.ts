import type { DocumentProviders } from '../entities/DocumentProviders.entity';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** DSCTRL2's wider catalog row — id/name/description/icon, no `enabled`/`sort_order` (those only gate/order the read, they are never returned to the client). */
export interface DocumentProviderCatalogRow {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

/** A bare `document_providers` row (every scalar column). */
export interface DocumentProviderRow {
  id: string | null;
  name: string;
  description: string | null;
  icon: string | null;
  enabled: number | null;
  sort_order: number | null;
}

const _providerRowKeys: AssertRowKeys<DocumentProviderRow, DocumentProviders> = true;

/**
 * `document_providers` — the read-only catalog of document-store adapters
 * this build ships (Paperless, Papra, Nextcloud, OpenCloud, Synology Drive).
 * Nothing in doc-sync's OWN statements writes to this table — only
 * `admin.service.ts`'s future Plan 3i work toggles `enabled` — so every
 * method here is a getter, shaped for 3i's eventual reuse per the plan's
 * "For the user" cross-reference note. Three distinct read shapes (DSC1's
 * bare id list, DSC3's single name lookup, DSCTRL2's wider catalog row) stay
 * three methods rather than one generic "list providers" — R2's own ruling:
 * different column sets, different callers, never silently unified.
 */
export class DocumentProvidersRepository extends TrekRepository<DocumentProviders> {
  /**
   * DSC1 (`DocSyncConfigService.enabledProviderIds`) — `SELECT id FROM
   * document_providers WHERE enabled = 1 ORDER BY sort_order`. Only the
   * providers an instance admin switched on may be configured.
   */
  async listEnabledIds(): Promise<string[]> {
    const rows = await this.find({ enabled: 1 }, { fields: ['id'], orderBy: { sort_order: 'asc' } });
    return rows.map((r) => r.id as string);
  }

  /**
   * DSC3 (`DocSyncConfigService.providerName`, private) — `SELECT name FROM
   * document_providers WHERE id = ?`. Whatever the enabled flag says — a
   * binding outlives the admin switching its provider off, and the client
   * still needs its name.
   */
  async findName(id: string): Promise<string | undefined> {
    const row = await this.findOne({ id }, { fields: ['name'] });
    return row?.name;
  }

  /**
   * DSCTRL2 (`DocSyncController.providers`) — `SELECT id, name, description,
   * icon FROM document_providers WHERE enabled = 1 ORDER BY sort_order`. A
   * wider column list than DSC1 (adds `description`/`icon` for the form the
   * client renders) — kept as its own method per R2, not folded into
   * `listEnabledIds`.
   */
  async listEnabledCatalog(): Promise<DocumentProviderCatalogRow[]> {
    const rows = await this.find(
      { enabled: 1 },
      { fields: ['id', 'name', 'description', 'icon'], orderBy: { sort_order: 'asc' } },
    );
    return rows.map((r) => ({
      id: r.id as string,
      name: r.name,
      description: r.description ?? null,
      icon: r.icon ?? null,
    }));
  }

  // ---------------------------------------------------------------------
  // Plan 3i Task 1 (`AdminService` — AD29/AD32/AD35/AD38, admin's
  // addon-shelf listing + `enabled` toggle — R6: this repository is 3h's
  // doc-sync task's to own; these four are additive, on top of its three
  // read shapes above, for admin's reuse).
  // ---------------------------------------------------------------------

  /**
   * AD29 (`admin.service.ts#listAddons`) — `SELECT id, name, description,
   * icon, enabled, sort_order FROM document_providers ORDER BY sort_order,
   * id`, UNFILTERED (unlike {@link listEnabledCatalog}'s `WHERE enabled =
   * 1`).
   */
  async listAllOrdered(): Promise<DocumentProviderRow[]> {
    const rows = await this.find({}, { orderBy: { sort_order: 'asc', id: 'asc' } });
    return rows.map((row) => toRow(row) as DocumentProviderRow);
  }

  /** AD32 (`admin.service.ts#updateAddon`'s pre-write read) — `SELECT * FROM document_providers WHERE id = ?`. */
  async findById(id: string): Promise<DocumentProviderRow | null> {
    const row = await this.findOne({ id });
    return row ? (toRow(row) as DocumentProviderRow) : null;
  }

  /**
   * AD35 (`admin.service.ts#updateAddon`, inside `uow.transactional`, the
   * Documents-off cascade) — `UPDATE document_providers SET enabled = 0`,
   * deliberately UNSCOPED (every row, no WHERE). Named `disableAll`, not a
   * generic `setEnabled` overload that could be called with an
   * accidentally omitted id (R4), same reasoning as
   * `PhotoProvidersRepository.disableAll` (AD34).
   */
  async disableAll(): Promise<void> {
    await this.nativeUpdate({}, { enabled: 0 });
  }

  /** AD38 (`admin.service.ts#updateAddon`, inside `uow.transactional`) — `UPDATE document_providers SET enabled = ? WHERE id = ?`. */
  async setEnabled(id: string, enabled: number): Promise<void> {
    await this.nativeUpdate({ id }, { enabled });
  }
}
