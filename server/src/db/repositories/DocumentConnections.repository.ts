import { currentTimestamp, coalesceOverride } from '../dialect/sql-functions';
import type { DocumentConnections } from '../entities/DocumentConnections.entity';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/**
 * A bare `document_connections` row. `secrets` is opaque encrypted TEXT here
 * and everywhere in this repository (R7): encryption/decryption stays in
 * `DocSyncConfigService`/`doc-sync-secrets.ts`, never in this file — a
 * repository method takes and returns the ciphertext exactly as stored,
 * calling no crypto function of its own.
 */
export interface DocumentConnectionRow {
  id: number;
  trip_id: number;
  provider_id: string;
  owner_user_id: number;
  base_url: string;
  secrets: string | null;
  settings: string;
  allow_insecure_tls: number;
  capabilities: string | null;
  last_probe_at: string | null;
  last_probe_state: string;
  last_probe_error: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const _connectionRowKeys: AssertRowKeys<DocumentConnectionRow, DocumentConnections> = true;

interface OwnerLeftKyselyDB {
  document_connections: { id: number; trip_id: number; owner_user_id: number };
  trip_members: { trip_id: number; user_id: number };
  trips: { id: number; user_id: number };
}

/**
 * `document_connections` — one provider credential per trip (R7's encrypted
 * `secrets` column; see its class docstring for the encrypt-in-service rule).
 */
export class DocumentConnectionsRepository extends TrekRepository<DocumentConnections> {
  /** DSC4 (`getConnection`) — `SELECT * FROM document_connections WHERE id = ?`. */
  async findById(id: number): Promise<DocumentConnectionRow | undefined> {
    const row = await this.findOne({ id });
    return row ? toRow(row) : undefined;
  }

  /** DSC5 (`listConnections`) — `SELECT * FROM document_connections WHERE trip_id = ? ORDER BY id`. */
  async listForTrip(tripId: number): Promise<DocumentConnectionRow[]> {
    const rows = await this.find({ trip_id: tripId }, { orderBy: { id: 'asc' } });
    return rows.map(toRow);
  }

  /** DSC7 (`upsertConnection`'s pre-check) — `SELECT * FROM document_connections WHERE trip_id = ? AND provider_id = ?`. */
  async findForTripAndProvider(tripId: number, providerId: string): Promise<DocumentConnectionRow | undefined> {
    const row = await this.findOne({ trip_id: tripId, provider_id: providerId });
    return row ? toRow(row) : undefined;
  }

  /**
   * DSC6 (`saveEarnedSecret`, inside `uow.transactional`) — `UPDATE
   * document_connections SET secrets = ? WHERE id = ?`. `secrets` arrives
   * already encrypted — this method never calls `encryptSecrets` itself.
   */
  async updateSecrets(id: number, secrets: string | null): Promise<void> {
    await this.nativeUpdate({ id }, { secrets });
  }

  /**
   * DSC8 (`upsertConnection`, existing row, inside `uow.transactional`) —
   * `UPDATE document_connections SET base_url = ?, secrets = ?, settings =
   * ?, allow_insecure_tls = ?, owner_user_id = ?, updated_at =
   * CURRENT_TIMESTAMP WHERE id = ?`.
   */
  async updateConnection(
    id: number,
    data: {
      base_url: string;
      secrets: string | null;
      settings: string;
      allow_insecure_tls: number;
      owner_user_id: number;
    },
  ): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate(
      { id },
      {
        base_url: data.base_url,
        secrets: data.secrets,
        settings: data.settings,
        allow_insecure_tls: data.allow_insecure_tls,
        ownerUser: data.owner_user_id,
        updated_at: currentTimestamp(platform),
      },
    );
  }

  /**
   * DSC9 (`upsertConnection`, new row, inside `uow.transactional`) —
   * `INSERT INTO document_connections (trip_id, provider_id, owner_user_id,
   * base_url, secrets, settings, allow_insecure_tls) VALUES (?×7)`.
   */
  async insertConnection(data: {
    trip_id: number;
    provider_id: string;
    owner_user_id: number;
    base_url: string;
    secrets: string | null;
    settings: string;
    allow_insecure_tls: number;
  }): Promise<number> {
    return await this.insert({
      trip: data.trip_id,
      provider: data.provider_id,
      ownerUser: data.owner_user_id,
      base_url: data.base_url,
      secrets: data.secrets,
      settings: data.settings,
      allow_insecure_tls: data.allow_insecure_tls,
    });
  }

  /**
   * DSC10 (`recordProbe`) — `UPDATE document_connections SET last_probe_at =
   * CURRENT_TIMESTAMP, last_probe_state = ?, last_probe_error = ?,
   * capabilities = COALESCE(?, capabilities), updated_at = CURRENT_TIMESTAMP
   * WHERE id = ?`.
   */
  async recordProbe(id: number, state: string, error: string | null, capabilitiesJson: string | null): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate(
      { id },
      {
        last_probe_at: currentTimestamp(platform),
        last_probe_state: state,
        last_probe_error: error,
        capabilities: coalesceOverride(platform, capabilitiesJson, 'capabilities'),
        updated_at: currentTimestamp(platform),
      },
    );
  }

  /** DSC11 (`deleteConnection`) — `DELETE FROM document_connections WHERE id = ?`. Its bindings cascade (ON DELETE CASCADE). */
  async deleteById(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  /**
   * DSC20/DSC21's shared predicate — "which connections' credential owner is
   * no longer on the connection's trip (neither via `trip_members` nor as
   * the trip's own owner)". The legacy code re-implemented this `NOT IN
   * (... UNION ...)` subquery inline at BOTH call sites
   * (`ownerLeft`'s single-connection check, `markOrphanedLinks`'s bulk
   * sweep); this is the ONE typed version both now consume —
   * `DocSyncConfigService.ownerLeft(id)` checks membership of this list,
   * `.markOrphanedLinks()` hands the whole list to
   * `TripDocumentLinksRepository.markOrphanedByConnectionIds`. `UNION` (not
   * `UNION ALL`) — the legacy text dedupes, matched exactly: Kysely's
   * `.union()`, not `.unionAll()`.
   */
  async listOrphanedIds(): Promise<number[]> {
    const rows = await this.kysely<OwnerLeftKyselyDB>()
      .selectFrom('document_connections as c')
      .select('c.id')
      .where((eb) =>
        eb('c.owner_user_id', 'not in', (qb) =>
          qb
            .selectFrom('trip_members as tm')
            .select('tm.user_id')
            .whereRef('tm.trip_id', '=', 'c.trip_id')
            .union(qb.selectFrom('trips as t').select('t.user_id').whereRef('t.id', '=', 'c.trip_id')),
        ),
      )
      .execute();
    return rows.map((r) => r.id);
  }
}

function toRow(entity: DocumentConnections): DocumentConnectionRow {
  return {
    id: entity.id,
    trip_id: entity.trip_id,
    provider_id: entity.provider_id,
    owner_user_id: entity.owner_user_id,
    base_url: entity.base_url,
    secrets: entity.secrets ?? null,
    settings: entity.settings,
    allow_insecure_tls: entity.allow_insecure_tls,
    capabilities: entity.capabilities ?? null,
    last_probe_at: entity.last_probe_at ?? null,
    last_probe_state: entity.last_probe_state,
    last_probe_error: entity.last_probe_error ?? null,
    created_at: entity.created_at ?? null,
    updated_at: entity.updated_at ?? null,
  };
}
