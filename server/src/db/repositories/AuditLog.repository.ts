import { AuditLog } from '../entities/AuditLog.entity';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/**
 * An `audit_log` row as the API emits it (Plan 3i's `admin.service.ts`
 * projection reads it via a `LEFT JOIN users`, not this shape — this is the
 * bare table row).
 */
export interface AuditLogRow {
  id: number;
  created_at: string | null;
  user_id: number | null;
  action: string;
  resource: string | null;
  details: string | null;
  ip: string | null;
}

const _auditLogRowKeys: AssertRowKeys<AuditLogRow, AuditLog> = true;

/** The column set `insertEntry` writes; `id`/`created_at` are generated. */
export type NewAuditLogRow = Omit<AuditLogRow, 'id' | 'created_at'>;

/**
 * AD22's joined projection (`admin.service.ts#getAuditLog`): `a.id,
 * a.created_at, a.user_id, u.username, u.email as user_email, a.action,
 * a.resource, a.details, a.ip` from `audit_log a LEFT JOIN users u ON
 * u.id = a.user_id`. Distinct from `AuditLogRow` (the bare-table shape
 * `insertEntry` writes) — a deleted/never-existing user leaves `username`/
 * `user_email` both null (the `LEFT JOIN`, not an `INNER JOIN`), the row
 * itself is still returned. The `created_at` ISO-suffix normalization and
 * the `details` JSON-parse-with-fallback stay in `AdminService` — this
 * repository returns the raw joined row untouched, same boundary the
 * class-level docs elsewhere in this program draw between repository and
 * service.
 */
export interface AuditLogPageRow {
  id: number;
  created_at: string | null;
  user_id: number | null;
  username: string | null;
  user_email: string | null;
  action: string;
  resource: string | null;
  details: string | null;
  ip: string | null;
}

/** Kysely shape for the `listPage` join — only the columns it actually selects. */
interface AuditLogKyselyDB {
  audit_log: AuditLogRow;
  users: { id: number; username: string; email: string };
}

export class AuditLogRepository extends TrekRepository<AuditLog> {
  /**
   * The column set of the legacy INSERT:
   * `INSERT INTO audit_log (user_id, action, resource, details, ip)
   * VALUES (?, ?, ?, ?, ?)`.
   *
   * Best-effort, fire-and-forget, exactly like the caller
   * (`AuditService.writeAudit`, wrapped in an outer try/catch that never
   * throws): no `refresh`, nothing the caller reads — MikroORM appends
   * `RETURNING id, created_at` for the defaults, but `insertEntry` resolves
   * `void`.
   *
   * A native `em.insert()`, not `create()` + `flush()`: `flush()` commits
   * the *whole* unit of work of the request's `EntityManager`, not just this
   * row — with ~98 call sites for `writeAudit`, one of them firing before
   * every MCP tool handler runs, an unrelated pending change elsewhere in
   * the same request would be committed early by an audit write, and the
   * outer try/catch that makes this best-effort would swallow whatever that
   * flush raised. `em.insert()` fires a single native INSERT with no side
   * effects on the context/identity map — the same fire-and-forget
   * semantics as the legacy `dbs.run(INSERT …)` autocommit statement.
   *
   * Named `insertEntry`, not `insert`: `EntityRepository` (`@mikro-orm/core`)
   * already declares a native `insert(data, options?): Promise<Primary<Entity>>`
   * (bypassing `create`/`persist`/`flush`), which is a `tsc`-verified
   * incompatible override for a `Promise<void>` method of the same name — the
   * same reason `Days.repository.ts`/`DayNotes.repository.ts` name their
   * inserts `createDay`/`createNote` rather than `create`.
   */
  async insertEntry(entry: NewAuditLogRow): Promise<void> {
    await this.insert({
      user: entry.user_id,
      action: entry.action,
      resource: entry.resource,
      details: entry.details,
      ip: entry.ip,
    });
  }

  /**
   * AD22 (`admin.service.ts#getAuditLog`) — `SELECT a.id, a.created_at,
   * a.user_id, u.username, u.email as user_email, a.action, a.resource,
   * a.details, a.ip FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
   * ORDER BY a.id DESC LIMIT ? OFFSET ?`. Kysely, not the ORM's own
   * QueryBuilder — the same `CollabMessagesRepository#joinedQuery` shape
   * every other flat-projection join in this program uses: `LEFT JOIN`
   * keeps a deleted-user's row (both `username`/`user_email` come back
   * null rather than dropping the row), and the projection is nine flat
   * scalars, not a hydrated `Users` entity.
   */
  async listPage(limit: number, offset: number): Promise<AuditLogPageRow[]> {
    return await this.kysely<AuditLogKyselyDB>()
      .selectFrom('audit_log as a')
      .leftJoin('users as u', 'u.id', 'a.user_id')
      .select([
        'a.id',
        'a.created_at',
        'a.user_id',
        'u.username',
        'u.email as user_email',
        'a.action',
        'a.resource',
        'a.details',
        'a.ip',
      ])
      .orderBy('a.id', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
  }

  /**
   * AD23 (`admin.service.ts#getAuditLog`) — `SELECT COUNT(*) as c FROM
   * audit_log`. `TrekRepository#count` (no filter) already renders the
   * equivalent `COUNT(*)` over the whole table; named explicitly here (a
   * thin `super.count()` pass-through) so the reserved AD23 call site has
   * its own documented anchor rather than admin's service code calling the
   * inherited method by its generic name.
   */
  override async count(): Promise<number> {
    return await super.count();
  }
}
