import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { logError } from '../audit/audit-log.logger';
import { AdminService } from './admin.service';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { RuntimeEnvService } from '../app-config/runtime-env.service';

/**
 * Daily version check (moved from src/scheduler.ts — it was the only consumer
 * of the old admin bridge, which died with the move). checkAndNotifyVersion
 * shares the module-scoped 5-minute cache in admin.helpers.ts with
 * GET /api/admin/version-check, so the cron and the route hit GitHub once
 * between them. No boot log — parity with the old starter.
 */
@Injectable()
export class VersionCheckJob implements OnApplicationBootstrap {
  constructor(
    private readonly admin: AdminService,
    private readonly registrar: CronRegistrarService,
    private readonly env: RuntimeEnvService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    // A centrally administered install never registers it. The upgrade schedule
    // is the operator's, so the daily call to github.com would only ever produce
    // a notification telling the admin to do something they cannot do.
    if (this.env.isManaged()) return;
    this.registrar.register('version-check', '0 9 * * *', () => this.tick());
  }

  async tick(): Promise<void> {
    try {
      await this.admin.checkAndNotifyVersion();
    } catch (err: unknown) {
      logError(`Version check: ${err instanceof Error ? err.message : err}`);
    }
  }
}
