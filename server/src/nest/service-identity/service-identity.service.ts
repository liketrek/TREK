import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { servicesConfig } from '../app-config/tokens';
import { logDebug } from '../audit/audit-log.logger';
import { SettingsService } from '../settings/settings.service';
import { IssuerClient } from './issuer.client';
import { QuotaTracker } from './quota-tracker';
import { ServiceClock } from './service-clock';
import { SERVICE_ISSUER_ORIGIN } from './service-identity.constants';
import { isAllowlisted } from './service-identity.helpers';
import { ServiceKeyService, type KeySnapshot } from './service-key.service';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import {
  SERVICE_NAMES,
  resolveValhallaProvider,
  serviceTierSchema,
  type ServiceAllowance,
  type ServiceIdentityStatus,
  type ServiceName,
  type ServiceQuota,
  type ServiceQuotaView,
  type ServiceTier,
} from '@trek/shared';

/** The admin card refreshes every 30 s; one call per host serves every open card for this long. */
const QUOTA_CACHE_MS = 20_000;

const OFF: ServiceIdentityStatus = { state: 'off', tier: null, keySource: null, services: [], lastSeenAt: null };

interface CachedQuota {
  bearer: string | null;
  at: number;
  quota: ServiceQuota | null;
}

/** What the admin sees of this installation's identity, and the one thing an admin can do with it. */
@Injectable()
export class ServiceIdentityService {
  private readonly cached = new Map<string, CachedQuota>();

  constructor(
    @Inject(servicesConfig.KEY) private readonly config: ConfigType<typeof servicesConfig>,
    private readonly keys: ServiceKeyService,
    private readonly issuer: IssuerClient,
    private readonly tracker: QuotaTracker,
    private readonly clock: ServiceClock,
    private readonly settings: SettingsService,
    private readonly env: RuntimeEnvService,
  ) {}

  async status(): Promise<ServiceIdentityStatus> {
    const key = await this.keys.snapshot();
    if (key.state === 'off') return OFF;
    const inUse = await this.servicesInUse(key);
    const fresh = await Promise.all(SERVICE_NAMES.map((service) => this.freshQuota(service, key.bearer)));
    const services = SERVICE_NAMES.map((service, index): ServiceAllowance => ({
      service,
      inUse: inUse[service],
      quota: viewOf(fresh[index]) ?? this.tracker.latest(hostOf(this.originOf(service)))?.quota ?? null,
    }));
    return {
      state: key.state,
      tier:
        fresh[SERVICE_NAMES.indexOf('places')]?.tier ??
        this.tracker.latest(hostOf(SERVICE_ISSUER_ORIGIN))?.tier ??
        keyTier(key),
      keySource: key.source,
      services,
      lastSeenAt: this.tracker.newest()?.seenAt ?? null,
    };
  }

  async regenerate(): Promise<ServiceIdentityStatus> {
    await this.keys.regenerate();
    this.cached.clear();
    return this.status();
  }

  private originOf(service: ServiceName): string {
    if (service === 'photon') return this.config.photonUrl;
    return service === 'valhalla' ? this.config.valhallaUrl : SERVICE_ISSUER_ORIGIN;
  }

  /**
   * Whether this instance asks each service right now. Places is in use
   * whenever the identity is; the other two need the key itself, since they
   * have no shared pool. Photon steps aside for an own NOMINATIM_URL, and
   * the TREK Valhalla answers only where the routing choice comes to it.
   */
  private async servicesInUse(key: KeySnapshot): Promise<Record<ServiceName, boolean>> {
    const keyed = (service: ServiceName) => key.bearer !== null && this.mayCarryKey(this.originOf(service));
    const defaults = await this.settings.getAdminUserDefaults();
    const routing = resolveValhallaProvider({
      provider: defaults.routing_valhalla_provider,
      valhallaUrl: defaults.valhalla_base_url,
      routingUrl: defaults.routing_base_url,
      trekAvailable: keyed('valhalla'),
    });
    return {
      places: true,
      photon: keyed('photon') && !this.env.env().integrations.nominatimOwn,
      valhalla: routing === 'trek',
    };
  }

  /**
   * GET /v1/quota of the service's host, which costs no allowance; null when
   * the host cannot or may not be asked right now. Without a key only Places
   * answers, for the shared pool.
   */
  private async freshQuota(service: ServiceName, bearer: string | null): Promise<ServiceQuota | null> {
    const origin = this.originOf(service);
    if (bearer ? !this.mayCarryKey(origin) : service !== 'places') return null;
    const cached = this.cached.get(origin);
    if (cached && cached.bearer === bearer && Date.now() - cached.at < QUOTA_CACHE_MS) return cached.quota;
    let quota: ServiceQuota | null = null;
    try {
      const answer = await this.issuer.quota(origin, bearer);
      this.clock.learn(answer.serverMs);
      quota = answer.body;
    } catch (err) {
      logDebug(`TREK services: ${service} quota not available: ${err instanceof Error ? err.message : String(err)}`);
    }
    this.cached.set(origin, { bearer, at: Date.now(), quota });
    return quota;
  }

  /** A host sees the key only while TREK_SERVICES_HOSTS lists it. */
  private mayCarryKey(origin: string): boolean {
    try {
      return isAllowlisted(new URL(origin), this.config.hosts);
    } catch {
      return false;
    }
  }
}

function hostOf(origin: string): string {
  return new URL(origin).hostname.toLowerCase();
}

function keyTier(key: KeySnapshot): ServiceTier | null {
  if (!key.key) return key.state === 'legacy' || key.state === 'registering' ? 'legacy' : null;
  const tier = serviceTierSchema.safeParse(key.key.payload.q);
  return tier.success ? tier.data : null;
}

function viewOf(quota: ServiceQuota | null): ServiceQuotaView | null {
  if (!quota) return null;
  return {
    limit: quota.limit,
    used: quota.used,
    remaining: quota.remaining,
    resetAt: new Date(quota.reset_at * 1000).toISOString(),
  };
}
