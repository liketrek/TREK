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
    return this.db.all(
      'SELECT id, name, token_prefix, created_at, last_used_at FROM mcp_tokens WHERE user_id = ? ORDER BY created_at DESC',
      userId
    );
  }

  createMcpToken(userId: number, rawName: unknown): { error?: string; status?: number; token?: Record<string, unknown> } {
    const name = rawName as string | undefined;
    if (!name?.trim()) return { error: 'Token name is required', status: 400 };
    if (name.trim().length > 100) return { error: 'Token name must be 100 characters or less', status: 400 };

    const tokenCount = this.db.get<{ count: number }>('SELECT COUNT(*) as count FROM mcp_tokens WHERE user_id = ?', userId)!.count;
    if (tokenCount >= 10) return { error: 'Maximum of 10 tokens per user reached', status: 400 };

    const rawToken = 'trek_' + randomBytes(24).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const tokenPrefix = rawToken.slice(0, 13);

    const result = this.db.run(
      'INSERT INTO mcp_tokens (user_id, name, token_hash, token_prefix) VALUES (?, ?, ?, ?)',
      userId, name.trim(), tokenHash, tokenPrefix
    );

    const token = this.db.get(
      'SELECT id, name, token_prefix, created_at, last_used_at FROM mcp_tokens WHERE id = ?',
      result.lastInsertRowid
    );

    return { token: { ...(token as object), raw_token: rawToken } };
  }

  deleteMcpToken(userId: number, tokenId: string): { error?: string; status?: number; success?: boolean } {
    const token = this.db.get('SELECT id FROM mcp_tokens WHERE id = ? AND user_id = ?', tokenId, userId);
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
    const hash = createHash('sha256').update(rawToken).digest('hex');
    const row = this.db.get<User>(`
    SELECT u.id, u.username, u.email, u.role
    FROM mcp_tokens mt
    JOIN users u ON mt.user_id = u.id
    WHERE mt.token_hash = ?
  `, hash);
    if (row) {
      this.db.run('UPDATE mcp_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE token_hash = ?', hash);
      return row;
    }
    return null;
  }
}
