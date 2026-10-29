import { LoginSessionService } from '../auth/login-session.service';
import { DomainError } from '../common/domain-error';
import type { SessionClient } from '../sessions/sessions.service';
import { NATIVE_HANDOFF_CODE_TTL_MS, NativeHandoffStore } from './native-handoff.store';
import { Injectable } from '@nestjs/common';

import { createHash, randomBytes, timingSafeEqual } from 'crypto';

const INVALID_CODE = 'Invalid or expired code';

/** Constant-time check that sha256(verifier) is the challenge the code was issued for. */
function verifierMatches(challenge: string, verifier: string): boolean {
  const expected = Buffer.from(challenge, 'hex');
  const actual = createHash('sha256').update(verifier, 'utf8').digest();
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/**
 * Carries a session from the system browser into the native app's WebView.
 *
 * The browser, signed in, trades the challenge the app sent along for a
 * one-time code; the app redeems that code together with the verifier it kept.
 * The session itself comes from the auth domain (LoginSessionService), the
 * same way every other sign-in gets one.
 */
@Injectable()
export class NativeAuthService {
  constructor(
    private readonly logins: LoginSessionService,
    private readonly handoffs: NativeHandoffStore,
  ) {}

  async issueCode(userId: number, challenge: string): Promise<string> {
    const code = randomBytes(32).toString('base64url');
    const stored = await this.handoffs.put(code, {
      userId,
      challenge,
      expiresAt: Date.now() + NATIVE_HANDOFF_CODE_TTL_MS,
    });
    if (!stored) throw new DomainError(503, 'Too many sign-ins in progress. Please try again in a minute.');
    return code;
  }

  /**
   * Burns the code on every attempt, right or wrong, so a code that leaked
   * through the URL scheme gets exactly one guess. The session is always the
   * long one: an app that forgets its login whenever the system unloads it
   * would be useless on the road.
   */
  async redeem(code: string, verifier: string, client: SessionClient): Promise<{ token: string; userId: number }> {
    const entry = await this.handoffs.take(code);
    if (!entry || !verifierMatches(entry.challenge, verifier)) throw new DomainError(400, INVALID_CODE);
    const token = await this.logins.signIn(entry.userId, true, client);
    if (!token) throw new DomainError(400, INVALID_CODE);
    return { token, userId: entry.userId };
  }
}
