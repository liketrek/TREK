import type { QuotaReading } from './service-identity.helpers';
import { Injectable } from '@nestjs/common';

interface QuotaSighting extends QuotaReading {
  /** When a liketrek service last answered this process. */
  seenAt: string;
}

/**
 * The allowance as the last liketrek answer stated it. Kept in memory only:
 * it is a fallback for the admin card when the issuer cannot be asked.
 */
@Injectable()
export class QuotaTracker {
  private last: QuotaSighting | null = null;

  record(reading: QuotaReading | null, at = new Date()): void {
    this.last = {
      tier: reading?.tier ?? this.last?.tier ?? null,
      quota: reading?.quota ?? this.last?.quota ?? null,
      seenAt: at.toISOString(),
    };
  }

  latest(): QuotaSighting | null {
    return this.last;
  }
}
