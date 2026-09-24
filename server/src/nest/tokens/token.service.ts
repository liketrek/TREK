import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import {
  PUBLIC_API_SCOPES,
  type PublicApiGrant,
  type PublicApiScope,
} from '@trek/shared';
import { DatabaseService } from '../database/database.service';
import { EphemeralTokenService } from '../auth/ephemeral-token.service';
// Import from sessionManager directly, NOT the ../../mcp barrel: the barrel pulls
// the whole tools fan-out (and via the domain bridges, the Nest services) into
// every consumer of this module — a nest→mcp→nest module cycle.
import { revokeUserSessions } from '../../mcp/sessionManager';
import { User } from '../../types';

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
 * The methods moved verbatim — same SQL, same validation order, same error
 * strings and status codes, same best-effort session revoke on delete.
 *
 * Deliberately NOT here: verifyJwtToken (that is login identity, and it stays
 * next to the cookie/JWT logic on AuthService) and isDemoUser (a demo gate that
 * happens to read the users table).
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly db: DatabaseService,
    private readonly ephemeral: EphemeralTokenService,
  ) {}

  listMcpTokens(userId: number) {
    return this.listTokens(userId, 'mcp');
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
  listApiTokens(userId: number) {
    return this.listTokens(userId, 'api');
  }

  private listTokens(userId: number, kind: TokenKind) {
    const rows = this.db.all<TokenRow>(
      'SELECT id, name, token_prefix, created_at, last_used_at, scope_mode, api_scopes FROM mcp_tokens WHERE user_id = ? AND kind = ? ORDER BY created_at DESC',
      userId, kind
    );
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

  createMcpToken(userId: number, rawName: unknown) {
    return this.createToken(userId, rawName, 'mcp');
  }

  /**
   * An integration key, optionally narrowed to a few sections.
   *
   * Omitting `scopes` means the key reads everything — what every key did
   * before this argument existed. Narrowing is opt-in on purpose: shipping the
   * column must not change what an already-running integration can do.
   */
  createApiToken(userId: number, rawName: unknown, scopes?: readonly string[]) {
    return this.createToken(userId, rawName, 'api', scopes);
  }

  private createToken(userId: number, rawName: unknown, kind: TokenKind, scopes?: readonly string[]): { error?: string; status?: number; token?: Record<string, unknown> } {
    const name = rawName as string | undefined;
    if (!name?.trim()) return { error: 'Token name is required', status: 400 };
    if (name.trim().length > 100) return { error: 'Token name must be 100 characters or less', status: 400 };

    const tokenCount = this.db.get<{ count: number }>('SELECT COUNT(*) as count FROM mcp_tokens WHERE user_id = ? AND kind = ?', userId, kind)!.count;
    if (tokenCount >= 10) return { error: 'Maximum of 10 tokens per user reached', status: 400 };

    const rawToken = 'trek_' + randomBytes(24).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const tokenPrefix = rawToken.slice(0, 13);

    // An MCP token never carries read scopes, so it is stored as "everything" —
    // the column default — rather than being handed a list it would ignore.
    const narrowed = kind === 'api' ? sanitizeScopes(scopes) : null;

    const result = this.db.run(
      'INSERT INTO mcp_tokens (user_id, name, token_hash, token_prefix, kind, scope_mode, api_scopes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      userId, name.trim(), tokenHash, tokenPrefix, kind,
      narrowed ? 'limited' : 'all',
      narrowed ? JSON.stringify(narrowed) : null,
    );

    const token = this.db.get(
      'SELECT id, name, token_prefix, created_at, last_used_at FROM mcp_tokens WHERE id = ?',
      result.lastInsertRowid
    );

    const grant = kind === 'api'
      ? { scope_mode: narrowed ? 'limited' : 'all', scopes: narrowed ?? [...PUBLIC_API_SCOPES] }
      : {};
    return { token: { ...(token as object), ...grant, raw_token: rawToken } };
  }

  deleteMcpToken(userId: number, tokenId: string) {
    return this.deleteToken(userId, tokenId, 'mcp');
  }

  deleteApiToken(userId: number, tokenId: string) {
    return this.deleteToken(userId, tokenId, 'api');
  }

  /**
   * Scoped by kind as well as by owner: without it the integrations panel would
   * happily delete a token the MCP panel manages, and the user would find a key
   * missing from a screen they never opened.
   */
  private deleteToken(userId: number, tokenId: string, kind: TokenKind): { error?: string; status?: number; success?: boolean } {
    const token = this.db.get('SELECT id FROM mcp_tokens WHERE id = ? AND user_id = ? AND kind = ?', tokenId, userId, kind);
    if (!token) return { error: 'Token not found', status: 404 };
    this.db.run('DELETE FROM mcp_tokens WHERE id = ?', tokenId);
    // Best-effort, like the changePassword/resetPassword revocations: a session
    // sweep failure must not turn a successful token delete into a 500.
    try { revokeUserSessions?.(userId); } catch { /* best-effort */ }
    return { success: true };
  }

  // -------------------------------------------------------------------------
  // Ephemeral tokens
  // -------------------------------------------------------------------------

  createWsToken(userId: number): { error?: string; status?: number; token?: string } {
    // Bind the ws-token to the user's current password_version so a token minted
    // before a password reset is rejected on connect (defence-in-depth session gate).
    const pv = this.db.get<{ password_version?: number }>('SELECT password_version FROM users WHERE id = ?', userId)?.password_version ?? 0;
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

  listAllMcpTokens() {
    return this.db.all(`
    SELECT t.id, t.name, t.token_prefix, t.created_at, t.last_used_at, t.user_id, u.username
    FROM mcp_tokens t
    JOIN users u ON u.id = t.user_id
    ORDER BY t.created_at DESC
  `);
  }

  adminDeleteMcpToken(id: string) {
    const token = this.db.get<{ id: number; user_id: number }>('SELECT id, user_id FROM mcp_tokens WHERE id = ?', id);
    if (!token) return { error: 'Token not found', status: 404 };
    this.db.run('DELETE FROM mcp_tokens WHERE id = ?', id);
    revokeUserSessions(token.user_id);
    return {};
  }

  // -------------------------------------------------------------------------
  // Verification
  // -------------------------------------------------------------------------

  verifyMcpToken(rawToken: string): User | null {
    return this.verifyToken(rawToken, 'mcp');
  }

  /** Verifies an integration key. An MCP token presented here does not resolve. */
  verifyApiToken(rawToken: string): User | null {
    return this.verifyToken(rawToken, 'api');
  }

  /**
   * The same lookup, plus what the key is allowed to read.
   *
   * A second method rather than a widened `verifyApiToken`: the guard needs
   * both halves, nothing else needs either, and the existing signature is
   * pinned by tests that assert exactly a `User`.
   */
  verifyApiTokenWithGrant(rawToken: string): { user: User; grant: PublicApiGrant } | null {
    const hash = createHash('sha256').update(rawToken).digest('hex');
    const row = this.db.get<User & { scope_mode: string | null; api_scopes: string | null }>(`
    SELECT u.id, u.username, u.email, u.role, mt.scope_mode, mt.api_scopes
    FROM mcp_tokens mt
    JOIN users u ON mt.user_id = u.id
    WHERE mt.token_hash = ? AND mt.kind = 'api'
  `, hash);
    if (!row) return null;
    this.db.run('UPDATE mcp_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE token_hash = ?', hash);
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
  private verifyToken(rawToken: string, kind: TokenKind): User | null {
    const hash = createHash('sha256').update(rawToken).digest('hex');
    const row = this.db.get<User>(`
    SELECT u.id, u.username, u.email, u.role
    FROM mcp_tokens mt
    JOIN users u ON mt.user_id = u.id
    WHERE mt.token_hash = ? AND mt.kind = ?
  `, hash, kind);
    if (row) {
      this.db.run('UPDATE mcp_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE token_hash = ?', hash);
      return row;
    }
    return null;
  }
}

interface TokenRow {
  id: number;
  name: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
  scope_mode: string | null;
  api_scopes: string | null;
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
 */
function resolveGrant(mode: string | null, raw: string | null): PublicApiGrant {
  if (mode !== 'limited') return { mode: 'all', scopes: [...PUBLIC_API_SCOPES] };
  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }
  if (!Array.isArray(parsed)) return { mode: 'limited', scopes: [] };
  const kept = sanitizeScopes(parsed.filter((value): value is string => typeof value === 'string'));
  return { mode: 'limited', scopes: kept ?? [] };
}
