import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
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
    return this.db.all(
      'SELECT id, name, token_prefix, created_at, last_used_at FROM mcp_tokens WHERE user_id = ? AND kind = ? ORDER BY created_at DESC',
      userId, kind
    );
  }

  createMcpToken(userId: number, rawName: unknown) {
    return this.createToken(userId, rawName, 'mcp');
  }

  createApiToken(userId: number, rawName: unknown) {
    return this.createToken(userId, rawName, 'api');
  }

  private createToken(userId: number, rawName: unknown, kind: TokenKind): { error?: string; status?: number; token?: Record<string, unknown> } {
    const name = rawName as string | undefined;
    if (!name?.trim()) return { error: 'Token name is required', status: 400 };
    if (name.trim().length > 100) return { error: 'Token name must be 100 characters or less', status: 400 };

    const tokenCount = this.db.get<{ count: number }>('SELECT COUNT(*) as count FROM mcp_tokens WHERE user_id = ? AND kind = ?', userId, kind)!.count;
    if (tokenCount >= 10) return { error: 'Maximum of 10 tokens per user reached', status: 400 };

    const rawToken = 'trek_' + randomBytes(24).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const tokenPrefix = rawToken.slice(0, 13);

    const result = this.db.run(
      'INSERT INTO mcp_tokens (user_id, name, token_hash, token_prefix, kind) VALUES (?, ?, ?, ?, ?)',
      userId, name.trim(), tokenHash, tokenPrefix, kind
    );

    const token = this.db.get(
      'SELECT id, name, token_prefix, created_at, last_used_at FROM mcp_tokens WHERE id = ?',
      result.lastInsertRowid
    );

    return { token: { ...(token as object), raw_token: rawToken } };
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
