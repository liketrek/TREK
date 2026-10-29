import { logDebug } from '../audit/audit-log.logger';
import { IssuerClient } from './issuer.client';
import { QuotaTracker } from './quota-tracker';
import { ServiceClock } from './service-clock';
import { ServiceKeyService, type KeySnapshot } from './service-key.service';
import { Injectable } from '@nestjs/common';
import {
  serviceTierSchema,
  type ServiceIdentityStatus,
  type ServiceQuota,
  type ServiceQuotaView,
  type ServiceTier,
} from '@trek/shared';

/** The admin card refreshes every 30 s; one issuer call serves every open card for this long. */
const QUOTA_CACHE_MS = 20_000;

const OFF: ServiceIdentityStatus = { state: 'off', tier: null, keySource: null, quota: null, lastSeenAt: null };

/** What the admin sees of this installation's identity, and the one thing an admin can do with it. */
@Injectable()
export class ServiceIdentityService {
  private cached: { bearer: string | null; at: number; quota: ServiceQuota | null } | null = null;

  constructor(
    private readonly keys: ServiceKeyService,
    private readonly issuer: IssuerClient,
    private readonly tracker: QuotaTracker,
    private readonly clock: ServiceClock,
  ) {}

  async status(): Promise<ServiceIdentityStatus> {
    const key = await this.keys.snapshot();
    if (key.state === 'off') return OFF;
    const fresh = await this.freshQuota(key.bearer);
    const seen = this.tracker.latest();
    return {
      state: key.state,
      tier: fresh?.tier ?? seen?.tier ?? keyTier(key),
      keySource: key.source,
      quota: fresh ? quotaView(fresh) : (seen?.quota ?? null),
      lastSeenAt: seen?.seenAt ?? null,
    };
  }

  async regenerate(): Promise<ServiceIdentityStatus> {
    await this.keys.regenerate();
    this.cached = null;
    return this.status();
  }

  /** GET /v1/quota, which costs no allowance; null when the issuer cannot be asked right now. */
  private async freshQuota(bearer: string | null): Promise<ServiceQuota | null> {
    if (this.cached && this.cached.bearer === bearer && Date.now() - this.cached.at < QUOTA_CACHE_MS) {
      return this.cached.quota;
    }
    let quota: ServiceQuota | null = null;
    try {
      const answer = await this.issuer.quota(bearer);
      this.clock.learn(answer.serverMs);
      quota = answer.body;
    } catch (err) {
      logDebug(`TREK services: quota not available: ${err instanceof Error ? err.message : String(err)}`);
    }
    this.cached = { bearer, at: Date.now(), quota };
    return quota;
  }
}

function keyTier(key: KeySnapshot): ServiceTier | null {
  if (!key.key) return key.state === 'legacy' || key.state === 'registering' ? 'legacy' : null;
  const tier = serviceTierSchema.safeParse(key.key.payload.q);
  return tier.success ? tier.data : null;
}

function quotaView(quota: ServiceQuota): ServiceQuotaView {
  return {
    limit: quota.limit,
    used: quota.used,
    remaining: quota.remaining,
    resetAt: new Date(quota.reset_at * 1000).toISOString(),
  };
}
