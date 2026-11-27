import { readEnv } from '../../app-config';
import { Users } from '../../db/entities/Users.entity';
import type { UsersRepository } from '../../db/repositories/Users.repository';
import { logInfo, logWarn } from '../audit/audit-log.logger';
import { AuditService } from '../audit/audit.service';
import { DomainError } from '../common/domain-error';
import { SessionsService } from '../sessions/sessions.service';
import { OidcLogoutReplayStore } from './oidc-logout-replay.store';
import { expectedOidcIssuer, OidcService, type OidcConfig, type OidcDiscoveryDoc } from './oidc.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

/** The `events` member a logout token must carry (section 2.4). */
export const BACKCHANNEL_LOGOUT_EVENT = 'http://schemas.openid.net/event/backchannel-logout';

/**
 * How old a logout token's `iat` may be. A provider sends the token the moment
 * the user signs out there, so a few seconds is normal; five minutes leaves
 * room for a provider that retries a delivery, and keeps the window in which a
 * captured token could be replayed, and the replay store has to remember it,
 * short.
 */
export const LOGOUT_TOKEN_MAX_AGE_SEC = 300;

/**
 * The difference between the provider's clock and this one that is forgiven:
 * an `iat` up to this far in the future, and `exp` and `nbf` by this much.
 */
export const LOGOUT_TOKEN_CLOCK_SKEW_SEC = 60;

/**
 * The header `typ` values a logout token may carry. Section 2.4 asks for
 * `logout+jwt`; many providers send the generic `JWT` or nothing at all, which
 * is accepted for compatibility (the `events` and `nonce` checks are what keep
 * an id_token out). Any other explicit type, an access token's `at+jwt` for
 * one, names a token of another kind and is refused.
 */
const ACCEPTED_TYP = new Set(['logout+jwt', 'application/logout+jwt', 'jwt']);

/** What a logout token said, once every check of section 2.6 passed. */
interface LogoutTokenClaims {
  iss: string;
  jti: string;
  sub?: string;
  sid?: string;
  /** Epoch milliseconds after which the token would be refused anyway; the replay entry lives until then. */
  acceptedUntil: number;
}

/** The outcome of the checks: the claims, or the reason the token was refused (logged, never sent). */
type LogoutTokenCheck = { valid: true; claims: LogoutTokenClaims } | { valid: false; reason: string };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const nonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

/**
 * OpenID Connect Back-Channel Logout 1.0: the identity provider tells TREK
 * that a user signed out there, and TREK ends the sessions that sign-in made.
 *
 * The token is checked as section 2.6 asks, through the same verifier the
 * login uses for the id_token (`OidcService.verifyProviderJwt`: the provider's
 * discovery document and JWKS, an asymmetric algorithm the header names, the
 * client id in `aud`, the issuer the login accepts, custom discovery URL
 * included), then for what makes it a logout token: a recent `iat`, a `jti`
 * not seen before, the back-channel logout event, a `sub` or a `sid`, and no
 * `nonce`.
 *
 * What ends: with a `sid`, the sessions the login stored that `sid` on (of the
 * account the `sub` names, when the token names one too); with only a `sub`,
 * every session of that account, as a password change does. An account or
 * session that does not exist is not an error: the provider gets the same 200
 * either way, so the route never tells which subjects have an account here.
 *
 * The websockets of an ended session are closed with it, on both paths (by
 * `SessionsService.revokeByOidcSid` and `revokeAll`), so a signed-out tab stops
 * hearing its rooms at once; its next request is refused by the session check.
 *
 * Unlike the login, this works while SSO login is switched off: sessions made
 * before the switch still came from the provider, and it may still end them.
 */
@Injectable()
export class OidcBackchannelService {
  constructor(
    private readonly oidc: OidcService,
    private readonly sessions: SessionsService,
    private readonly audit: AuditService,
    private readonly replays: OidcLogoutReplayStore,
    @InjectRepository(Users) private readonly usersRepo: UsersRepository,
  ) {}

  /**
   * Validate the token and end the sessions it names. Throws a 400
   * `invalid_request` DomainError for every token that fails a check (and when
   * OIDC is not set up), so the route never answers 500 for a bad token.
   */
  async logout(logoutToken: string, ip: string | null): Promise<void> {
    const config = await this.oidc.getOidcConfig();
    if (!config) throw refusal('not_configured', 'OpenID Connect is not configured.');
    const check = await this.validateLogoutToken(logoutToken, config);
    // `in` rather than `!check.valid`: the server compiles without
    // strictNullChecks, where the boolean discriminant does not narrow.
    if ('reason' in check) {
      logWarn(`[OIDC] Back-channel logout token refused: ${check.reason}`);
      throw refusal(check.reason);
    }
    const { claims } = check;
    // Recorded only once every other check passed, so a token that fails one
    // cannot use up the jti of a real one.
    const key = `${claims.iss}\n${claims.jti}`;
    if (!(await this.replays.claim(key, claims.acceptedUntil, Date.now()))) {
      logWarn('[OIDC] Back-channel logout token refused: replayed_jti');
      throw refusal('replayed_jti');
    }
    try {
      await this.endSessions(claims, config, ip);
    } catch (err) {
      // The sessions did not end, so the provider's retry of this token must
      // be acted on rather than refused as a replay.
      await this.replays.release(key);
      throw err;
    }
  }

  /**
   * Every check of section 2.6 on one token, in the order the spec lists them.
   * Public for the tests, which name a reason for each refusal.
   */
  async validateLogoutToken(token: string, config: OidcConfig): Promise<LogoutTokenCheck> {
    if (config.issuer && !config.issuer.startsWith('https://') && readEnv().app.isProduction) {
      return { valid: false, reason: 'issuer_not_https' };
    }
    let doc: OidcDiscoveryDoc;
    try {
      doc = await this.oidc.discover(config.issuer, config.discoveryUrl);
    } catch (err) {
      return { valid: false, reason: `discovery_failed: ${err instanceof Error ? err.message : String(err)}` };
    }
    const issuer = expectedOidcIssuer(doc, config);
    const verified = await this.oidc.verifyProviderJwt(
      token,
      doc,
      config.clientId,
      issuer,
      LOGOUT_TOKEN_CLOCK_SKEW_SEC,
    );
    if ('error' in verified) return { valid: false, reason: verified.error };
    const { claims, header } = verified;

    if (header.typ !== undefined && (typeof header.typ !== 'string' || !ACCEPTED_TYP.has(header.typ.toLowerCase()))) {
      return { valid: false, reason: 'wrong_typ' };
    }

    const nowSec = Date.now() / 1000;
    const iat = claims.iat;
    if (typeof iat !== 'number' || !Number.isFinite(iat)) return { valid: false, reason: 'missing_iat' };
    if (iat > nowSec + LOGOUT_TOKEN_CLOCK_SKEW_SEC) return { valid: false, reason: 'iat_in_future' };
    if (nowSec - iat > LOGOUT_TOKEN_MAX_AGE_SEC + LOGOUT_TOKEN_CLOCK_SKEW_SEC) {
      return { valid: false, reason: 'stale_iat' };
    }

    const jti = claims.jti;
    if (!nonEmptyString(jti)) return { valid: false, reason: 'missing_jti' };

    const events = claims.events;
    if (!isRecord(events) || !isRecord(events[BACKCHANNEL_LOGOUT_EVENT])) {
      return { valid: false, reason: 'missing_logout_event' };
    }

    if ('nonce' in claims) return { valid: false, reason: 'nonce_present' };

    if (claims.sub !== undefined && !nonEmptyString(claims.sub)) return { valid: false, reason: 'bad_sub' };
    if (claims.sid !== undefined && !nonEmptyString(claims.sid)) return { valid: false, reason: 'bad_sid' };
    const sub = nonEmptyString(claims.sub) ? claims.sub : undefined;
    const sid = nonEmptyString(claims.sid) ? claims.sid : undefined;
    if (sub === undefined && sid === undefined) return { valid: false, reason: 'no_sub_or_sid' };

    const exp = typeof claims.exp === 'number' ? claims.exp : Number.POSITIVE_INFINITY;
    const acceptedUntilSec = Math.min(exp, iat + LOGOUT_TOKEN_MAX_AGE_SEC) + LOGOUT_TOKEN_CLOCK_SKEW_SEC;
    return {
      valid: true,
      claims: {
        iss: issuer,
        jti,
        ...(sub !== undefined ? { sub } : {}),
        ...(sid !== undefined ? { sid } : {}),
        acceptedUntil: Math.ceil(acceptedUntilSec * 1000),
      },
    };
  }

  /**
   * End what the token names. A `sub` is looked up the way the login links an
   * account, by subject and the configured issuer; a `sid` matches the
   * sessions the login stored it on.
   */
  private async endSessions(claims: LogoutTokenClaims, config: OidcConfig, ip: string | null): Promise<void> {
    const revokedByUser = new Map<number, number>();
    let scope: 'session' | 'all';
    if (claims.sub !== undefined) {
      const user = await this.usersRepo.findByOidcIdentity(claims.sub, config.issuer);
      if (!user) {
        logInfo('[OIDC] Back-channel logout for a subject without an account here; nothing to end.');
        return;
      }
      if (claims.sid !== undefined) {
        scope = 'session';
        const owners = await this.sessions.revokeByOidcSid(claims.sid, config.issuer, user.id);
        revokedByUser.set(user.id, owners.length);
      } else {
        scope = 'all';
        revokedByUser.set(user.id, await this.sessions.revokeAll(user.id));
      }
    } else if (claims.sid !== undefined) {
      scope = 'session';
      for (const owner of await this.sessions.revokeByOidcSid(claims.sid, config.issuer)) {
        revokedByUser.set(owner, (revokedByUser.get(owner) ?? 0) + 1);
      }
    } else {
      // validateLogoutToken never lets a token through without either.
      return;
    }
    // writeAudit stands on its own and never throws, so the rows are written side by side.
    await Promise.all(
      [...revokedByUser].map(([userId, revoked]) =>
        this.audit.writeAudit({ userId, action: 'oidc.backchannel_logout', ip, details: { scope, revoked } }),
      ),
    );
    logInfo(`[OIDC] Back-channel logout ended ${sum(revokedByUser)} session(s) (${scope}).`);
  }
}

function sum(counts: Map<number, number>): number {
  let total = 0;
  for (const n of counts.values()) total += n;
  return total;
}

/**
 * The 400 of section 2.8. The reason goes into the code and the log, never
 * into the body: the caller may be anyone, and the provider only needs to
 * know that the token was refused.
 */
function refusal(reason: string, description = 'The logout token is missing or invalid.'): DomainError {
  return new DomainError(400, 'invalid_request', {
    code: reason,
    details: { error_description: description },
  });
}
