import { Injectable, OnModuleDestroy } from '@nestjs/common';
import crypto from 'crypto';
import { DatabaseService } from '../database/database.service';
import { AuthService } from '../auth/auth.service';

export const NATIVE_HANDOFF_CODE_TTL_MS = 60_000;
const SWEEP_INTERVAL_MS = 5 * 60_000;

interface PendingHandoff {
  userId: number;
  challenge: string;
  created: number;
}

/** Constant-time check that sha256(verifier) is the challenge the code was issued for. */
function verifierMatches(challenge: string, verifier: string): boolean {
  const expected = Buffer.from(challenge, 'hex');
  const actual = crypto.createHash('sha256').update(verifier, 'utf8').digest();
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

/**
 * Carries a session from the system browser into the native app's WebView.
 *
 * Codes live in memory like the OIDC auth codes: they are good for a minute,
 * a restart simply means signing in again, and nothing about them is worth
 * a table.
 */
@Injectable()
export class NativeAuthService implements OnModuleDestroy {
  private readonly pending = new Map<string, PendingHandoff>();
  private readonly sweeper: NodeJS.Timeout;

  constructor(
    private readonly db: DatabaseService,
    private readonly auth: AuthService,
  ) {
    this.sweeper = setInterval(() => {
      const now = Date.now();
      for (const [code, entry] of this.pending) {
        if (now - entry.created > NATIVE_HANDOFF_CODE_TTL_MS) this.pending.delete(code);
      }
    }, SWEEP_INTERVAL_MS);
    this.sweeper.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.sweeper);
  }

  issueCode(userId: number, challenge: string): string {
    const code = crypto.randomBytes(32).toString('base64url');
    this.pending.set(code, { userId, challenge, created: Date.now() });
    return code;
  }

  /**
   * Burns the code on every attempt, right or wrong, so a code that leaked
   * through the URL scheme gets exactly one guess. The session is always the
   * long one: an app that forgets its login whenever iOS unloads it would be
   * useless on the road.
   */
  redeem(code: string, verifier: string): { token: string; userId: number } | null {
    const entry = this.pending.get(code);
    if (!entry) return null;
    this.pending.delete(code);
    if (Date.now() - entry.created > NATIVE_HANDOFF_CODE_TTL_MS) return null;
    if (!verifierMatches(entry.challenge, verifier)) return null;

    const user = this.db.get<{ id: number; password_version: number }>(
      'SELECT id, password_version FROM users WHERE id = ?',
      entry.userId,
    );
    if (!user) return null;
    this.db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = ?', user.id);
    return { token: this.auth.generateToken(user, true), userId: user.id };
  }
}
