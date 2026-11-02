import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { ServiceKeyService } from './service-key.service';
import { Injectable, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';

import { randomInt } from 'node:crypto';

/** The first check after startup comes within this window, at a moment picked per start. */
export const FIRST_CHECK_MIN_MS = 60_000;
export const FIRST_CHECK_MAX_MS = 10 * 60_000;

/**
 * The installation key without anyone searching first: one check a few
 * minutes after startup, then once a day at a minute and hour picked per
 * start. Each registers a missing key and renews a due one. Both moments are
 * spread out, so installations that update at the same hour do not all knock
 * on the issuer at once.
 */
@Injectable()
export class ServiceKeyJob implements OnApplicationBootstrap, OnApplicationShutdown {
  private firstCheck: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly keys: ServiceKeyService,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.registrar.register('service-key-renewal', `${randomInt(60)} ${randomInt(24)} * * *`, () => this.keys.settle());
    this.firstCheck = setTimeout(
      () => {
        this.firstCheck = null;
        // A failure is already logged by the key service and retried on its backoff.
        this.keys.settle().catch(() => undefined);
      },
      randomInt(FIRST_CHECK_MIN_MS, FIRST_CHECK_MAX_MS),
    );
    this.firstCheck.unref();
  }

  onApplicationShutdown(): void {
    if (this.firstCheck !== null) clearTimeout(this.firstCheck);
    this.firstCheck = null;
  }
}
