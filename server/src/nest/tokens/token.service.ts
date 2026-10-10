import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { randomBytes, createHash } from 'crypto';
import {
  PUBLIC_API_SCOPES,
  type PublicApiGrant,
  type PublicApiScope,
} from '@trek/shared';
import { McpTokens } from '../../db/entities/McpTokens.entity';
import type { McpTokensRepository, McpTokenBasicRow } from '../../db/repositories/McpTokens.repository';
import { Users } from '../../db/entities/Users.entity';
import type { UsersRepository } from '../../db/repositories/Users.repository';
import { EphemeralTokenService } from '../auth/ephemeral-token.service';
import { toRowId } from '../common/row-id';
// Import from sessionManager directly, NOT the ../../mcp barrel: the barrel pulls
// the whole tools fan-out (and via the domain bridges, the Nest services) into
// every consumer of this module — a nest→mcp→nest module cycle.
import { revokeUserSessions } from '../../mcp/sessionManager';
import { User } from '../../types';
import { MCP_TOKEN_API_SCOPES } from '../../db/json-columns';
import { decodeJson } from '../../utils/json-column';

/**
 * What a token is allowed to drive. Stored on the row so each surface can accept
 * only its own: 'mcp' for the assistant tools, 'api' for the public REST surface.
 */
type TokenKind = 'mcp' | 'api';

/**
 * Everything that mints or checks a token that is not the login JWT: the
 * long-lived MCP tokens a user manages in settings, and the short-lived ws /
 * download tokens.
 *
 * Split out of AuthService, which had grown to carry identity, profile,
 * settings and tokens at once. Tokens are the cleanest cut of the four: they
 * touch one table (mcp_tokens) plus the ephemeral-token store, and nothing in
 * here needs to know how a password is hashed or how a session is established.
 *
 * The methods moved verbatim — same SQL (now through `McpTokensRepository`),
 * same validation order, same error strings and status codes, same
 * best-effort session revoke on delete. The raw token is still never stored —
 * only its SHA-256 hash reaches the repository, computed here exactly as
 * before.
 *
 * Deliberately NOT here: verifyJwtToken (that is login identity, and it stays
 * next to the cookie/JWT logic on AuthService).
 */
@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(McpTokens) private readonly tokens: McpTokensRepository,
    @InjectRepository(Users) private readonly users: UsersRepository,
    private readonly ephemeral: EphemeralTokenService,
  ) {}

  async listMcpTokens(userId: number) {
    return await this.listTokens(userId, 'mcp');
  }

  /**
   * Integration keys for the public API — a different credential from an MCP
   * token even though both live in this table.
   *
   * They are split because they open different doors: an MCP token drives every
   * tool the assistant exposes, an API key reads trips over HTTP. Handing a
   * third-party integration something that can also delete a place is a blast
   * radius nobody asked for, so `kind` keeps the two apart and each surface
   * verifies the one it accepts.
   */
  async listApiTokens(userId: number) {
    return await this.listTokens(userId, 'api');
  }

  private async listTokens(userId: number, kind: TokenKind) {
    const rows = await this.tokens.listByUserAndKind(userId, kind);
    // The MCP list keeps the exact shape it has always had: those tokens carry
    // no read scopes, and two columns that are always "everything" would be
    // noise in a panel that cannot act on them.
    if (kind === 'mcp') {
      return rows.map(({ scope_mode: _mode, api_scopes: _scopes, ...rest }) => rest);
    }
    return rows.map((row) => {
      const grant = resolveGrant(row.scope_mode, row.api_scopes);
      return {
        id: row.id,
        name: row.name,
        token_prefix: row.token_prefix,
        created_at: row.created_at,
        last_used_at: row.last_used_at,
        scope_mode: grant.mode,
        scopes: grant.scopes,
      };
    });
  }

  async createMcpToken(userId: number, rawName: unknown) {
    return await this.createToken(userId, rawName, 'mcp');
  }

  /**
   * An integration key, optionally narrowed to a few sections.
   *
   * Omitting `scopes` means the key reads everything — what every key did
   * before this argument existed. Narrowing is opt-in on purpose: shipping the
   * column must not change what an already-running integration can do.
   */
  async createApiToken(userId: number, rawName: unknown, scopes?: readonly string[]) {
    return await this.createToken(userId, rawName, 'api', scopes);
  }

  private async createToken(userId: number, rawName: unknown, kind: TokenKind, scopes?: readonly string[]): Promise<{ error?: string; status?: number; token?: Record<string, unknown> }> {
    const name = rawName as string | undefined;
    if (!name?.trim()) return { error: 'Token name is required', status: 400 };
    if (name.trim().length > 100) return { error: 'Token name must be 100 characters or less', status: 400 };

    const tokenCount = await this.tokens.countByUserAndKind(userId, kind);
    if (tokenCount >= 10) return { error: 'Maximum of 10 tokens per user reached', status: 400 };

    const rawToken = 'trek_' + randomBytes(24).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const tokenPrefix = rawToken.slice(0, 13);

    // An MCP token never carries read scopes, so it is stored as "everything" —
    // the column default — rather than being handed a list it would ignore.
    const narrowed = kind === 'api' ? sanitizeScopes(scopes) : null;

    const inserted = await this.tokens.insertToken({
      user_id: userId,
      name: name.trim(),
      token_hash: tokenHash,
      token_prefix: tokenPrefix,
      kind,
      scope_mode: narrowed ? 'limited' : 'all',
      api_scopes: narrowed ? JSON.stringify(narrowed) : null,
    });

    // A separate re-select, matching the legacy INSERT-then-SELECT shape
    // exactly (TK3 then TK4 — two statements, `insertToken` returns only
    // the generated id and never re-queries the row itself) — `findBasic`
    // also serves TK9's admin lookup, so its `user_id` field is dropped
    // here: TK4's response never carried it, and leaking it would be a new
    // field on the client-facing token payload, not a refactor.
    const basic = (await this.tokens.findBasic(inserted.id)) as McpTokenBasicRow;
    const { user_id: _userId, ...token } = basic;

    const grant = kind === 'api'
      ? { scope_mode: narrowed ? 'limited' : 'all', scopes: narrowed ?? [...PUBLIC_API_SCOPES] }
      : {};
    return { token: { ...token, ...grant, raw_token: rawToken } };
  }

  async deleteMcpToken(userId: number, tokenId: string) {
    return await this.deleteToken(userId, tokenId, 'mcp');
  }

  async deleteApiToken(userId: number, tokenId: string) {
    return await this.deleteToken(userId, tokenId, 'api');
  }

  /**
   * Scoped by kind as well as by owner: without it the integrations panel would
   * happily delete a token the MCP panel manages, and the user would find a key
   * missing from a screen they never opened.
   */
  private async deleteToken(userId: number, tokenId: string, kind: TokenKind): Promise<{ error?: string; status?: number; success?: boolean }> {
    // Convert, VALIDATE, and answer the legacy not-found before any
    // repository call (program rule 15): the legacy statement bound
    // `tokenId` straight into `WHERE id = ?` and let SQLite's affinity rules
    // miss on a non-numeric string; a typed repository filter has no such
    // leniency, so a bare `Number()` turned a 404 into a 500 (Plan 3b Task 2
    // review, F1).
    const id = toRowId(tokenId);
    if (id === null) return { error: 'Token not found', status: 404 };
    const token = await this.tokens.findOwnedByKind(id, userId, kind);
    if (!token) return { error: 'Token not found', status: 404 };
    await this.tokens.deleteById(id);
    // Best-effort, like the changePassword/resetPassword revocations: a session
    // sweep failure must not turn a successful token delete into a 500.
    try { revokeUserSessions?.(userId); } catch { /* best-effort */ }
    return { success: true };
  }

  // -------------------------------------------------------------------------
  // Ephemeral tokens
  // -------------------------------------------------------------------------

  async createWsToken(userId: number): Promise<{ error?: string; status?: number; token?: string }> {
    // Bind the ws-token to the user's current password_version so a token minted
    // before a password reset is rejected on connect (defence-in-depth session gate).
    const pv = (await this.users.getPasswordVersion(userId)) ?? 0;
    const token = this.ephemeral.create(userId, 'ws', { pv });
    if (!token) return { error: 'Service unavailable', status: 503 };
    return { token };
  }

  createResourceToken(userId: number, rawPurpose: unknown): { error?: string; status?: number; token?: string } {
    const purpose = rawPurpose as string | undefined;
    if (purpose !== 'download') {
      return { error: 'Invalid purpose', status: 400 };
    }
    const token = this.ephemeral.create(userId, purpose);
    if (!token) return { error: 'Service unavailable', status: 503 };
    return { token };
  }

  // -------------------------------------------------------------------------
  // Admin view
  //
  // The same table, seen across all users. Moved here from AdminService, which
  // owned a second copy of the delete purely because the admin route lived
  // there. Note the two are genuinely different queries, not duplicates: the
  // user-facing ones scope every statement by user_id, these deliberately do
  // not, and the admin delete revokes sessions unconditionally where the
  // user-facing one treats that as best-effort.
  // -------------------------------------------------------------------------

  async listAllMcpTokens() {
    return await this.tokens.listAllWithUsername();
  }

  async adminDeleteMcpToken(id: string) {
    // Same guard as `deleteToken` above — convert, VALIDATE, answer the
    // legacy 404 before any repository call (F1).
    const numericId = toRowId(id);
    if (numericId === null) return { error: 'Token not found', status: 404 };
    const token = await this.tokens.findBasic(numericId);
    if (!token) return { error: 'Token not found', status: 404 };
    await this.tokens.deleteById(numericId);
    revokeUserSessions(token.user_id);
    return {};
  }

  // -------------------------------------------------------------------------
  // Verification
  // -------------------------------------------------------------------------

  async verifyMcpToken(rawToken: string): Promise<User | null> {
    return await this.verifyToken(rawToken, 'mcp');
  }

  /** Verifies an integration key. An MCP token presented here does not resolve. */
  async verifyApiToken(rawToken: string): Promise<User | null> {
    return await this.verifyToken(rawToken, 'api');
  }

  /**
   * The same lookup, plus what the key is allowed to read.
   *
   * A second method rather than a widened `verifyApiToken`: the guard needs
   * both halves, nothing else needs either, and the existing signature is
   * pinned by tests that assert exactly a `User`.
   */
  async verifyApiTokenWithGrant(rawToken: string): Promise<{ user: User; grant: PublicApiGrant } | null> {
    const hash = createHash('sha256').update(rawToken).digest('hex');
    const row = await this.tokens.findGrantByHash(hash);
    if (!row) return null;
    await this.tokens.touchLastUsedByHash(hash);
    const { scope_mode, api_scopes, ...user } = row;
    return { user: user as User, grant: resolveGrant(scope_mode, api_scopes) };
  }

  /**
   * Hash, look up, and require the kind the calling surface accepts.
   *
   * The kind is part of the WHERE clause rather than checked afterwards, so a
   * token of the wrong kind is indistinguishable from one that does not exist —
   * neither the caller nor a timing measurement learns that the string was a
   * real credential for somewhere else.
   */
  private async verifyToken(rawToken: string, kind: TokenKind): Promise<User | null> {
    const hash = createHash('sha256').update(rawToken).digest('hex');
    const row = await this.tokens.findUserByHashAndKind(hash, kind);
    if (row) {
      await this.tokens.touchLastUsedByHash(hash);
      // `role` is `users.role TEXT`, narrower at runtime than the repository's
      // row type states — same trust boundary the pre-ORM raw-SQL lookup's
      // generic type parameter asserted without a runtime check.
      return row as User;
    }
    return null;
  }
}

/**
 * The requested sections, cleaned up — unknown values dropped, duplicates
 * collapsed, order pinned to the canonical list so two keys with the same
 * access read the same in the panel.
 *
 * Returns null for "no narrowing was asked for", which is what makes the caller
 * store full access rather than an empty list that would lock the key out of
 * everything.
 */
function sanitizeScopes(scopes: readonly string[] | undefined): PublicApiScope[] | null {
  if (!scopes || scopes.length === 0) return null;
  const wanted = new Set(scopes);
  const kept = PUBLIC_API_SCOPES.filter((scope) => wanted.has(scope));
  return kept.length > 0 ? [...kept] : null;
}

/**
 * What a stored row means, read defensively — in both directions.
 *
 * A row that does not say 'limited' is a full-access key: that is what every key
 * written before this column existed had, and a missing narrowing must not cost
 * a running integration its access. Narrowing is a deliberate act; its absence
 * is not a denial.
 *
 * But once a row HAS said 'limited', every way of failing to read its list
 * denies. Unparseable JSON, a non-array, or a list of scope names this version
 * no longer knows (a renamed constant, a hand-edited row) resolves to no scopes
 * at all rather than to everything: the whole reason `scope_mode` is an explicit
 * flag instead of "NULL means everything" is that a key minted as restricted
 * must never widen on its own. A key that stops working is a support ticket; a
 * key that quietly reads every trip is the bug this feature exists to prevent.
 *
 * Still defends against `mode`/`raw` arriving `null`, even though
 * `McpTokensRepository`'s rows type them as non-nullable strings (the
 * `mcp_tokens.scope_mode` column is `NOT NULL DEFAULT 'all'`): this function
 * is shared, pure, and untouched by the repository conversion — the
 * defensiveness costs nothing and keeps `PUBAPI-SCOPE-U042` (a hand-built row
 * simulating a pre-migration NULL) meaningful.
 */
function resolveGrant(mode: string | null, raw: string | null): PublicApiGrant {
  if (mode !== 'limited') return { mode: 'all', scopes: [...PUBLIC_API_SCOPES] };
  const parsed = decodeJson(MCP_TOKEN_API_SCOPES, raw);
  const kept = sanitizeScopes(parsed.filter((value): value is string => typeof value === 'string'));
  return { mode: 'limited', scopes: kept ?? [] };
}
