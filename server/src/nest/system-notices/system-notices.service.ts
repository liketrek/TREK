import { Injectable } from '@nestjs/common';
import type { SystemNoticeDto } from '@trek/shared';
import { getActiveNoticesFor, dismissNotice } from '../../systemNotices/service';
import { AddonsService } from '../addons/addons.service';
import { RuntimeEnvService } from '../app-config/runtime-env.service';

/**
 * Thin Nest wrapper around the existing system-notices service. The condition
 * evaluation, version gating, sorting and dismissal persistence all stay in the
 * upstream service — this only adapts it for DI (and threads the injected
 * addon-enablement check into the condition context, so the plain modules
 * underneath carry no bridge import), so behaviour is unchanged.
 */
@Injectable()
export class SystemNoticesService {
  constructor(
    private readonly addons: AddonsService,
    private readonly env: RuntimeEnvService,
  ) {}

  getActiveFor(userId: number): SystemNoticeDto[] {
    return getActiveNoticesFor(
      userId,
      (addonId) => this.addons.isAddonEnabled(addonId),
      this.env.isManaged(),
    ) as SystemNoticeDto[];
  }

  dismiss(userId: number, noticeId: string): boolean {
    return dismissNotice(userId, noticeId);
  }
}
