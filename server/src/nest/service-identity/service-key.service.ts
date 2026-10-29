import { runningVersion } from '../../app-config';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { servicesConfig } from '../app-config/tokens';
import { logInfo, logWarn } from '../audit/audit-log.logger';
import { conflict } from '../common/domain-error';
import { withRequestContext } from '../database/request-context';
import { IssuerClient, IssuerError, type IssuerAnswer } from './issuer.client';
import { RefusalStreak } from './refusal-streak';
import { ServiceClock } from './service-clock';
import { SERVICE_ISSUER_ORIGIN } from './service-identity.constants';
import { isAllowlisted, keyFingerprint, sameServiceUrl } from './service-identity.helpers';
import { parseServiceKey, type ServiceKey } from './service-key.format';
import { solvePow } from './service-key.pow';
import { EMPTY_KEY_STATE, ServiceKeyStore, type KeyState, type StoredIdentity } from './service-key.store';
import { MikroORM } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { ServiceIdentityState, ServiceKeyGrant } from '@trek/shared';

import { randomInt } from 'node:crypto';

const DAY_SECONDS = 86_400;
/** A key is renewed from day 60 of its 90, unless the issuer said otherwise. */
const RENEW_AGE_SECONDS = 60 * DAY_SECONDS;
/** An expired key can still be renewed for this long; after that it registers anew. */
const RENEW_GRACE_SECONDS = 30 * DAY_SECONDS;
/** Spreads the new registrations of every installation a broken key hit, instead of all at once. */
const REREGISTER_JITTER_MS = 6 * 3_600_000;
const FIRST_BACKOFF_MS = 5 * 60_000;
const MAX_BACKOFF_MS = 6 * 3_600_000;

export interface KeySnapshot {
  state: ServiceIdentityState;
  key: ServiceKey | null;
  source: 'env' | 'registered' | null;
  /** What a request may carry right now; null while revoked, expired or without a key. */
  bearer: string | null;
}

/**
 * The installation key: loaded lazily, registered in the background on the
 * first call to a liketrek service, renewed from day 60 on the next call or
 * the daily check, given up after repeated refusals and frozen when the
 * services revoke it.
 *
 * Nothing here ever makes a request wait. Until a key is there, requests go
 * out as they always did, and the shared legacy pool answers them.
 */
@Injectable()
export class ServiceKeyService {
  private loaded = false;
  private key: ServiceKey | null = null;
  /** The stored row exists but cannot be used, so a new key overwrites it instead of claiming. */
  private staleRow = false;
  private state: KeyState = EMPTY_KEY_STATE;
  private work: Promise<void> | null = null;
  private registering = false;
  private nextAttemptAt = 0;
  private failures = 0;
  private readonly refusals = new RefusalStreak();

  constructor(
    @Inject(servicesConfig.KEY) private readonly config: ConfigType<typeof servicesConfig>,
    private readonly env: RuntimeEnvService,
    private readonly store: ServiceKeyStore,
    private readonly issuer: IssuerClient,
    private readonly clock: ServiceClock,
    private readonly orm: MikroORM,
  ) {}

  /** Whether the Places service this instance uses is one the key goes to. */
  inUse(): boolean {
    const maps = this.env.env().maps;
    if (this.config.mode === 'off' || !maps.trekPlacesEnabled) return false;
    try {
      return isAllowlisted(new URL(this.placesUrl()), this.config.hosts);
    } catch {
      return false;
    }
  }

  /**
   * The bearer for a request to an allowlisted host. Starts a registration or a
   * due renewal in the background; until it lands, the request goes without a key.
   */
  bearer(): string | null {
    if (!this.inUse()) return null;
    this.settleInBackground();
    const token = this.config.key ?? this.key?.token ?? null;
    return token && !this.isRevoked(token) && !this.isExpired(token) ? token : null;
  }

  /** What the admin card shows. Reads only: a GET must not register. */
  async snapshot(): Promise<KeySnapshot> {
    if (!this.inUse()) return { state: 'off', key: null, source: null, bearer: null };
    await this.load();
    const token = this.config.key ?? this.key?.token ?? null;
    if (!token) return { state: this.registering ? 'registering' : 'legacy', key: null, source: null, bearer: null };
    const source = this.config.key ? 'env' : 'registered';
    const key = parseServiceKey(token);
    if (this.isRevoked(token)) return { state: 'revoked', key, source, bearer: null };
    if (this.isExpired(token)) return { state: source === 'env' ? 'legacy' : 'registering', key, source, bearer: null };
    return { state: 'connected', key, source, bearer: token };
  }

  /** A liketrek service accepted the key. */
  noteAccepted(): void {
    this.refusals.clear();
  }

  /** A liketrek service answered 401 to the key; the third time, at moments apart, gives it up. */
  noteInvalid(): void {
    if (!this.config.key && !this.key) return;
    if (!this.refusals.hit()) return;
    if (this.config.key) {
      logWarn(
        'TREK services: the key in TREK_SERVICES_KEY is refused. Place search continues through the shared pool.',
      );
      return;
    }
    void this.inBackground(() => this.dropKey());
  }

  /** A liketrek service answered that the key is revoked. */
  noteRevoked(): void {
    const token = this.config.key ?? this.key?.token;
    if (!token || this.isRevoked(token)) return;
    void this.inBackground(() => this.markRevoked(token));
  }

  /** The daily check: renews the key once it is due. A key past its grace period is already gone on load. */
  async renewIfDue(): Promise<void> {
    if (!this.inUse()) return;
    await this.inBackground(async () => {
      await this.load();
      const key = this.dueForRenewal();
      if (key) await this.renew(key);
    });
  }

  /** The admin's way out of a revoked or cloned identity: forget the key and ask for a new one. */
  async regenerate(): Promise<void> {
    if (this.config.key) throw conflict('The key is set by TREK_SERVICES_KEY and is changed there');
    if (!this.inUse()) throw conflict('TREK services are not in use on this instance');
    await this.store.clear();
    this.adopt({ key: null, unreadable: false, state: EMPTY_KEY_STATE });
    this.nextAttemptAt = 0;
    this.failures = 0;
    this.refusals.clear();
    logInfo('TREK services: an admin asked for a new identity for this installation.');
    this.settleInBackground();
  }

  /** Test seam: resolves once the background work queued so far has run. */
  async whenIdle(): Promise<void> {
    const work = this.work;
    if (!work) return;
    await work;
    await this.whenIdle();
  }

  private placesUrl(): string {
    return this.env.env().maps.trekPlacesUrl?.trim() || SERVICE_ISSUER_ORIGIN;
  }

  private mayRegister(): boolean {
    return !this.config.key && !this.env.isTest() && sameServiceUrl(this.placesUrl(), SERVICE_ISSUER_ORIGIN);
  }

  private wantsRegistration(): boolean {
    const now = Date.now();
    return (
      this.mayRegister() &&
      this.key === null &&
      this.state.revoked === null &&
      now >= this.nextAttemptAt &&
      now >= (this.state.reregisterAt ?? 0)
    );
  }

  /** A request starts a due renewal, but after a failed one only once the backoff has passed. */
  private keyToRenewNow(): ServiceKey | null {
    return Date.now() >= this.nextAttemptAt ? this.dueForRenewal() : null;
  }

  private dueForRenewal(): ServiceKey | null {
    const key = this.key;
    if (this.config.key || !key || this.isRevoked(key.token)) return null;
    const dueAt = this.state.renewAfter ?? key.payload.iat + RENEW_AGE_SECONDS;
    return this.clock.nowSeconds() >= dueAt ? key : null;
  }

  private isRevoked(token: string): boolean {
    return this.state.revoked !== null && this.state.revoked === keyFingerprint(token);
  }

  /** Read on the issuer's clock: the gate refuses an expired key instead of counting it in the shared pool. */
  private isExpired(token: string): boolean {
    const key = this.key?.token === token ? this.key : parseServiceKey(token);
    return key !== null && this.clock.nowSeconds() >= key.payload.exp;
  }

  private settleInBackground(): void {
    if (this.work || (this.loaded && !this.wantsRegistration() && !this.keyToRenewNow())) return;
    void this.inBackground(async () => {
      await this.load();
      if (this.wantsRegistration()) {
        await this.register();
        return;
      }
      const due = this.keyToRenewNow();
      if (due) await this.renew(due);
    });
  }

  /**
   * Runs work outside the request that triggered it, one piece at a time. A
   * failure is logged and never reaches a request; only a caller that awaits
   * the returned promise sees it.
   */
  private inBackground(task: () => Promise<void>): Promise<void> {
    const previous = this.work ?? Promise.resolve();
    const run = previous.then(() => withRequestContext(this.orm, task));
    const next = run
      .catch((err: unknown) => logWarn(`TREK services: ${err instanceof Error ? err.message : String(err)}`))
      .finally(() => {
        if (this.work === next) this.work = null;
      });
    this.work = next;
    return run;
  }

  private async load(): Promise<void> {
    if (this.loaded) return;
    this.adopt(await this.store.read());
  }

  private adopt(stored: StoredIdentity): void {
    const expired = stored.key !== null && this.clock.nowSeconds() > stored.key.payload.exp + RENEW_GRACE_SECONDS;
    this.key = expired ? null : stored.key;
    this.staleRow = stored.unreadable || expired;
    this.state = stored.state;
    this.loaded = true;
  }

  private async register(): Promise<void> {
    this.registering = true;
    try {
      const grant = await this.requestKey();
      this.clock.learn(grant.serverMs);
      const key = this.readGrant(grant.body);
      const state: KeyState = { ...EMPTY_KEY_STATE, renewAfter: grant.body.renew_after };
      if (this.staleRow) {
        await this.store.replace(key, state);
        this.adopt({ key, unreadable: false, state });
      } else {
        this.adopt(await this.store.claim(key, state));
      }
      this.failures = 0;
      logInfo('TREK services: this installation is registered.');
    } catch (err) {
      this.backOff(err);
      throw err;
    } finally {
      this.registering = false;
    }
  }

  /**
   * A challenge is bound to the network that fetched it, and the registration
   * may leave over the other address family. A refused challenge is therefore
   * fetched once more at once instead of waiting out the backoff.
   */
  private async requestKey(): Promise<IssuerAnswer<ServiceKeyGrant>> {
    try {
      return await this.solveChallenge();
    } catch (err) {
      if (!(err instanceof IssuerError) || err.status !== 400) throw err;
      return this.solveChallenge();
    }
  }

  private async solveChallenge(): Promise<IssuerAnswer<ServiceKeyGrant>> {
    const challenge = await this.issuer.challenge();
    this.clock.learn(challenge.serverMs);
    const nonce = await solvePow(challenge.body, this.clock.toLocalMs(challenge.body.expires_at));
    return this.issuer.register({ c: challenge.body.c, nonce, v: runningVersion() });
  }

  /** Same installation, new expiry; the old key is the proof, so no proof of work. */
  private async renew(key: ServiceKey): Promise<void> {
    const renewal = await this.issuer.renew(key.token).then(
      (grant) => ({ grant, error: null }),
      (error: unknown) => ({ grant: null, error }),
    );
    if (!renewal.grant) {
      this.backOff(renewal.error);
      await this.refused(renewal.error, key.token);
      return;
    }
    this.clock.learn(renewal.grant.serverMs);
    const renewed = this.readGrant(renewal.grant.body);
    this.state = { ...this.state, renewAfter: renewal.grant.body.renew_after };
    await this.store.replace(renewed, this.state);
    this.key = renewed;
    this.failures = 0;
    this.refusals.clear();
    logInfo('TREK services: renewed the key of this installation.');
  }

  private readGrant(grant: ServiceKeyGrant): ServiceKey {
    const key = parseServiceKey(grant.key);
    if (!key) throw new Error('the issuer handed out a key TREK cannot read');
    return key;
  }

  private backOff(err: unknown): void {
    this.failures += 1;
    const asked = err instanceof IssuerError ? err.retryAfterMs : null;
    const backoff = Math.min(MAX_BACKOFF_MS, FIRST_BACKOFF_MS * 2 ** (this.failures - 1));
    this.nextAttemptAt = Date.now() + (asked ?? backoff);
  }

  /** A refused renewal counts like a refused search; anything else is rethrown for the caller to log. */
  private async refused(err: unknown, token: string): Promise<void> {
    if (!(err instanceof IssuerError) || (err.status !== 401 && err.status !== 403)) throw err;
    if (err.status === 403) await this.markRevoked(token);
    else if (this.refusals.hit()) await this.dropKey();
  }

  private async dropKey(): Promise<void> {
    this.key = null;
    this.state = { ...this.state, renewAfter: null, reregisterAt: Date.now() + randomInt(REREGISTER_JITTER_MS) };
    await this.store.dropKey(this.state);
    logWarn('TREK services: the key of this installation is no longer accepted; a new one is requested later.');
  }

  private async markRevoked(token: string): Promise<void> {
    await this.load();
    this.state = { ...this.state, revoked: keyFingerprint(token) };
    await this.store.writeState(this.state);
    logWarn(
      'TREK services: the key of this installation was revoked. Place search continues through the shared pool; ' +
        'an admin can create a new identity under Admin, Settings, API Keys.',
    );
  }
}
