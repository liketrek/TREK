import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { ServiceKeyService } from './service-key.service';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

import { randomInt } from 'node:crypto';

/**
 * Once a day, at a minute and hour picked per start, renews the installation
 * key when it is due. Spread out so the installations of the world do not all
 * knock on the issuer at the same moment.
 */
@Injectable()
export class ServiceKeyJob implements OnApplicationBootstrap {
  constructor(
    private readonly keys: ServiceKeyService,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.registrar.register('service-key-renewal', `${randomInt(60)} ${randomInt(24)} * * *`, () =>
      this.keys.renewIfDue(),
    );
  }
}
