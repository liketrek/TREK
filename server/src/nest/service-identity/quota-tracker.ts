import type { QuotaReading } from './service-identity.helpers';
import { Injectable } from '@nestjs/common';

interface QuotaSighting extends QuotaReading {
  /** When this host last answered this process. */
  seenAt: string;
}

/**
 * The allowance as the last answer of each liketrek host stated it. Kept in
 * memory only: it is a fallback for the admin card when a host cannot be asked.
 */
@Injectable()
export class QuotaTracker {
  private readonly byHost = new Map<string, QuotaSighting>();

  record(host: string, reading: QuotaReading | null, at = new Date()): void {
    const last = this.byHost.get(host);
    this.byHost.set(host, {
      tier: reading?.tier ?? last?.tier ?? null,
      quota: reading?.quota ?? last?.quota ?? null,
      seenAt: at.toISOString(),
    });
  }

  latest(host: string): QuotaSighting | null {
    return this.byHost.get(host) ?? null;
  }

  /** The most recent answer of any host. */
  newest(): QuotaSighting | null {
    let newest: QuotaSighting | null = null;
    for (const sighting of this.byHost.values()) {
      if (!newest || sighting.seenAt > newest.seenAt) newest = sighting;
    }
    return newest;
  }
}
