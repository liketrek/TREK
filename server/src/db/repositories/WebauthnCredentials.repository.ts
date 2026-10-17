import { currentTimestamp } from '../dialect/sql-functions';
import type { WebauthnCredentials } from '../entities/WebauthnCredentials.entity';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/**
 * A full `webauthn_credentials` row (`SELECT * ...`), as PK9 (`passkeyLoginVerify`)
 * needs it — `public_key` stays a `Buffer` end to end: `BlobType` (the entity's
 * `p.blob()` column type) has no `toJSON` override, so `EntityTransformer`'s
 * default (return the value unchanged) applies and `toRow`'s `wrap().toObject()`
 * never touches the bytes.
 */
export interface WebauthnCredentialRow {
  id: number;
  user_id: number;
  credential_id: string;
  public_key: Buffer;
  counter: number;
  transports: string | null;
  device_type: string | null;
  backed_up: number;
  name: string | null;
  aaguid: string | null;
  created_at: string | null;
  last_used_at: string | null;
}

const _webauthnCredentialRowKeys: AssertRowKeys<WebauthnCredentialRow, WebauthnCredentials> = true;

/** `PasskeyService.passkeyRegisterVerify` (PK7) — only verifier-vouched fields. */
export interface NewCredentialRow {
  user_id: number;
  credential_id: string;
  public_key: Buffer;
  counter: number;
  transports: string | null;
  device_type: string | null;
  backed_up: number;
  name: string | null;
  aaguid: string | null;
}

/** PK5's `excludeCredentials` shape and PK8/PK13's shared management-panel shape. */
export interface CredentialTransportsRow {
  credential_id: string;
  transports: string | null;
}

/** The column set PK8 (post-registration re-select) and PK13 (`listPasskeys`) both project. */
export interface PasskeyPanelRow {
  id: number;
  name: string | null;
  device_type: string | null;
  backed_up: number;
  created_at: string | null;
  last_used_at: string | null;
}

const PANEL_FIELDS = ['id', 'name', 'device_type', 'backed_up', 'created_at', 'last_used_at'] as const;

function toPanelRow(row: {
  id: number;
  name?: string | null;
  device_type?: string | null;
  backed_up: number;
  created_at?: string | null;
  last_used_at?: string | null;
}): PasskeyPanelRow {
  return {
    id: row.id,
    name: row.name ?? null,
    device_type: row.device_type ?? null,
    backed_up: row.backed_up,
    created_at: row.created_at ?? null,
    last_used_at: row.last_used_at ?? null,
  };
}

/**
 * Plan 3b Task 1 reserved this class and implemented `hasAny` (MP3/AU24 —
 * shared with `mfa-policy.guard.ts` and `AuthService.updateAppSettings`).
 * Task 3 (`PasskeyService`) adds everything else: the full WebAuthn
 * credential-store surface (PK5–PK18, minus PK6's dup check which the
 * service still gates the same insert with, race-proofed by the surrounding
 * `uow.transactional`). `hasAny` is untouched — nothing here changes its
 * name or shape.
 */
export class WebauthnCredentialsRepository extends TrekRepository<WebauthnCredentials> {
  /**
   * `SELECT 1 FROM webauthn_credentials WHERE user_id = ? LIMIT 1` (MP3/AU24
   * — identical statement, two callers). `findOne` with a narrow `fields`
   * selection mirrors the legacy existence probe without pulling a full
   * row; MikroORM's `count()` has no built-in short-circuit, so this is the
   * closer match to "does one exist" than `count() > 0`, which would still
   * scan/aggregate every matching row.
   *
   * `disableIdentityMap: true` (every row-out read in this file, applied by
   * the base class's default since Plan 3b interlude B —
   * `_shared/trek-repository.ts`): this
   * method's caller (`mfa-policy.guard.ts`, `AuthService.updateAppSettings`)
   * can run in the same request as other `webauthn_credentials`/`users`
   * reads and writes; a `findOne` that joins the identity map (even for a
   * `fields: ['id']` existence probe) registers a managed entity whose
   * unselected columns hold whatever the query returned as undefined/stale
   * — if that entity is later merged with a broader projection AND a
   * sibling `nativeUpdate` changes a column out of band in the same
   * transaction, the closing `flush()` can write the identity-mapped
   * entity's stale in-memory snapshot back over the `nativeUpdate`'s write
   * (reproduced live: `PUT /api/auth/me/settings` returning 200 while
   * discarding the change). `disableIdentityMap: true` returns an isolated,
   * unmanaged entity instead — nothing this method reads is ever merged
   * into the request's identity map, so it can never be flushed.
   */
  async hasAny(userId: number): Promise<boolean> {
    const row = await this.findOne({ user: userId }, { fields: ['id'] });
    return row !== null;
  }

  // ---------------------------------------------------------------------
  // PK5 — passkeyRegisterOptions' excludeCredentials
  // ---------------------------------------------------------------------

  /** `SELECT credential_id, transports FROM webauthn_credentials WHERE user_id = ?` */
  async listExcludeCredentials(userId: number): Promise<CredentialTransportsRow[]> {
    const rows = await this.find({ user: userId }, { fields: ['credential_id', 'transports'] });
    return rows.map((row) => ({ credential_id: row.credential_id, transports: row.transports ?? null }));
  }

  // ---------------------------------------------------------------------
  // PK6 — passkeyRegisterVerify's in-transaction duplicate check
  // ---------------------------------------------------------------------

  /**
   * `SELECT id FROM webauthn_credentials WHERE credential_id = ?` — called
   * from inside `uow.transactional` alongside `insertCredential` so the
   * check-then-insert can never race a UNIQUE violation past the service's
   * `DUPLICATE_CREDENTIAL` sentinel (identity-compared, not string-matched).
   * `disableIdentityMap: true` per `hasAny`'s docstring above — this read
   * runs inside the same transaction as PK7's write, so keeping it out of
   * the identity map matters even more here.
   */
  async existsByCredentialId(credentialId: string): Promise<boolean> {
    const row = await this.findOne({ credential_id: credentialId }, { fields: ['id'] });
    return row !== null;
  }

  // ---------------------------------------------------------------------
  // PK7 — credential enrollment (same transaction as PK6)
  // ---------------------------------------------------------------------

  /**
   * `INSERT INTO webauthn_credentials (user_id, credential_id, public_key,
   *  counter, transports, device_type, backed_up, name, aaguid, last_used_at)
   *  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)` — `last_used_at` is always
   * `NULL` on insert (a fresh credential has never been used yet), same as
   * the legacy statement's literal.
   *
   * `EntityRepository.insert()`, not `create()` + `persist().flush()`: a
   * native insert that commits immediately and has no identity-map/UnitOfWork
   * side effects, so it can never be part of a stale-snapshot flush the way
   * a persisted-and-tracked entity could; `persist().flush()` would also
   * flush the ENTIRE request's UnitOfWork, not just this row, which is
   * exactly the write-discarding hazard `hasAny`'s docstring describes.
   */
  async insertCredential(row: NewCredentialRow): Promise<void> {
    await this.insert({
      user: row.user_id,
      credential_id: row.credential_id,
      public_key: row.public_key,
      counter: row.counter,
      transports: row.transports,
      device_type: row.device_type,
      backed_up: row.backed_up,
      name: row.name,
      aaguid: row.aaguid,
      last_used_at: null,
    });
  }

  // ---------------------------------------------------------------------
  // PK8 — post-registration re-select (after the transaction resolves)
  // ---------------------------------------------------------------------

  /**
   * `SELECT id, name, device_type, backed_up, created_at, last_used_at
   *  FROM webauthn_credentials WHERE credential_id = ?` — a DIFFERENT
   * column set from PK9's full-row read below, so a separate method (D4:
   * mirror each statement's own projection, never one full-row read the
   * caller trims down).
   */
  async findCreatedCredential(credentialId: string): Promise<PasskeyPanelRow | null> {
    const row = await this.findOne({ credential_id: credentialId }, { fields: [...PANEL_FIELDS] });
    return row ? toPanelRow(row) : null;
  }

  // ---------------------------------------------------------------------
  // PK9 — login-verify ceremony input (full row, Buffer public_key)
  // ---------------------------------------------------------------------

  /**
   * `SELECT * FROM webauthn_credentials WHERE credential_id = ?`.
   * `disableIdentityMap: true`, not `{ refresh: true }` — this is not a
   * primary-key filter (`credential_id` is a unique column, not `id`), and
   * per `hasAny`'s docstring, a plain `refresh: true` re-snapshot risks a
   * stale-write-back on flush if this same entity is already (or later)
   * identity-mapped under a different projection within the same request —
   * PK11's `updateCounterAndLastUsed` runs a `nativeUpdate` on this exact
   * row moments later, in the same request.
   */
  async findByCredentialId(credentialId: string): Promise<WebauthnCredentialRow | null> {
    const credential = await this.findOne({ credential_id: credentialId });
    return credential ? (toRow(credential) as WebauthnCredentialRow) : null;
  }

  // ---------------------------------------------------------------------
  // PK11 — counter/last-used bookkeeping (same transaction as UsersRepository.touchLastLogin)
  // ---------------------------------------------------------------------

  /** `UPDATE webauthn_credentials SET counter = ?, last_used_at = CURRENT_TIMESTAMP WHERE id = ?` */
  async updateCounterAndLastUsed(id: number, counter: number): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate({ id }, { counter, last_used_at: currentTimestamp(platform) });
  }

  // ---------------------------------------------------------------------
  // PK13 — settings-panel list
  // ---------------------------------------------------------------------

  /**
   * `SELECT id, name, device_type, backed_up, created_at, last_used_at
   *  FROM webauthn_credentials WHERE user_id = ? ORDER BY created_at DESC`
   */
  async listForPanel(userId: number): Promise<PasskeyPanelRow[]> {
    const rows = await this.find({ user: userId }, { fields: [...PANEL_FIELDS], orderBy: { created_at: 'desc' } });
    return rows.map((row) => toPanelRow(row));
  }

  // ---------------------------------------------------------------------
  // PK14 — rename (ownership in the WHERE)
  // ---------------------------------------------------------------------

  /**
   * `UPDATE webauthn_credentials SET name = ? WHERE id = ? AND user_id = ?`
   * — ownership enforced in the WHERE, not a separate check; returns the
   * affected-row count so `renamePasskey` keeps its 404-never-403 behaviour
   * (a foreign or unknown id both yield 0, indistinguishable by design).
   */
  async renameOwned(id: number, userId: number, name: string): Promise<number> {
    return this.nativeUpdate({ id, user: userId }, { name });
  }

  // ---------------------------------------------------------------------
  // PK16 — delete (ownership in the WHERE)
  // ---------------------------------------------------------------------

  /** `DELETE FROM webauthn_credentials WHERE id = ? AND user_id = ?` */
  async deleteOwned(id: number, userId: number): Promise<number> {
    return this.nativeDelete({ id, user: userId });
  }

  // ---------------------------------------------------------------------
  // PK18 — admin bulk-clear
  // ---------------------------------------------------------------------

  /** `DELETE FROM webauthn_credentials WHERE user_id = ?` — returns the deleted count for `adminResetPasskeys`' response. */
  async deleteAllForUser(userId: number): Promise<number> {
    return this.nativeDelete({ user: userId });
  }
}
