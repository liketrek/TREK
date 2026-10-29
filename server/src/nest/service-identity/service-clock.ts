import { Injectable } from '@nestjs/common';

/**
 * The liketrek services' clock, as far as this process has seen it. Key times
 * (`iat`, `exp`, `renew_after`, a challenge's `expires_at`) are theirs, so a
 * server whose own clock is off still renews on time.
 */
@Injectable()
export class ServiceClock {
  private offsetMs = 0;

  /** Takes the offset from a Date header the services sent. */
  learn(serverMs: number | null): void {
    if (serverMs !== null) this.offsetMs = serverMs - Date.now();
  }

  nowSeconds(): number {
    return Math.floor((Date.now() + this.offsetMs) / 1000);
  }

  /** A time on the services' clock, read on this one. */
  toLocalMs(serviceSeconds: number): number {
    return serviceSeconds * 1000 - this.offsetMs;
  }
}
