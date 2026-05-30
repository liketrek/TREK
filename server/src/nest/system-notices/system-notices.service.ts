import { Injectable } from '@nestjs/common';
import type { SystemNoticeDto } from '@trek/shared';
import { getActiveNoticesFor, dismissNotice } from '../../systemNotices/service';

/**
 * Thin Nest wrapper around the existing system-notices service. The condition
 * evaluation, version gating, sorting and dismissal persistence all stay in the
 * upstream service — this only adapts it for DI, so behaviour is unchanged.
 */
@Injectable()
export class SystemNoticesService {
  getActiveFor(userId: number): SystemNoticeDto[] {
    return getActiveNoticesFor(userId) as SystemNoticeDto[];
  }

  dismiss(userId: number, noticeId: string): boolean {
    return dismissNotice(userId, noticeId);
  }
}
