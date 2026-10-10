import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import {
  createEphemeralToken,
  consumeEphemeralToken,
  consumeEphemeralTokenWithMeta,
  startTokenCleanup,
  stopTokenCleanup,
  type EphemeralTokenMeta,
} from './ephemeral-tokens';

/**
 * The injectable face of the ephemeral-token store, and the owner of its
 * cleanup timer.
 *
 * The store itself stays module state next door, and that is still
 * load-bearing — though no longer for the reason this comment used to give.
 * The ws handshake did consume tokens from outside the container until the
 * transport became a gateway; it injects this service now. What keeps the store
 * module-scoped today is the four bridges that build
 * `new EphemeralTokenService()` by hand (auth, admin, trips, and TokenService's
 * own construction inside auth.bridge). Per-instance state would give each of
 * them an empty Map, so a download token minted through a bridge would never
 * validate. Same reasoning as the geo throttle cursor and the permissions
 * cache.
 *
 * The MAX_STORE_SIZE back-pressure is the other reason: `createEphemeralToken`
 * returns null at 10,000 live tokens and TokenService turns that into a 503.
 * A second store would raise the real ceiling without anyone noticing.
 *
 * The lifecycle moved off AuthService, which owned it only because it was the
 * domain that mints tokens. Issuing them and sweeping them are different jobs,
 * and FilesService and TokenService mint or consume them too.
 */
@Injectable()
export class EphemeralTokenService implements OnModuleInit, OnModuleDestroy {
  onModuleInit(): void {
    startTokenCleanup();
  }

  onModuleDestroy(): void {
    stopTokenCleanup();
  }

  /** Returns null when the store is at capacity; callers answer 503. */
  create(userId: number, purpose: string, meta?: EphemeralTokenMeta): string | null {
    return createEphemeralToken(userId, purpose, meta);
  }

  /** Single-use: the token is deleted whether or not it validates. */
  consume(token: string, purpose: string): number | null {
    return consumeEphemeralToken(token, purpose);
  }

  /**
   * The same, plus the password_version the token was minted with. Only the ws
   * handshake needs it, for the session gate that rejects a token minted before
   * a password change.
   */
  consumeWithMeta(token: string, purpose: string): { userId: number; pv?: number } | null {
    return consumeEphemeralTokenWithMeta(token, purpose);
  }
}
