import { Controller, Get, HttpCode, HttpException, Param, Post, UseGuards } from '@nestjs/common';
import type { SystemNoticeDto } from '@trek/shared';
import type { User } from '../../types';
import { SystemNoticesService } from './system-notices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

/**
 * /api/system-notices — active announcements for the current user + dismissal.
 *
 * Byte-identical to the legacy Express route (server/src/routes/systemNotices.ts):
 * both endpoints require auth, `/active` returns the evaluated DTO list, and
 * dismiss is idempotent — an unknown id 404s with `{ error: 'NOTICE_NOT_FOUND' }`
 * and a successful dismiss returns 204 with no body.
 */
@Controller('api/system-notices')
@UseGuards(JwtAuthGuard)
export class SystemNoticesController {
  constructor(private readonly notices: SystemNoticesService) {}

  @Get('active')
  active(@CurrentUser() user: User): SystemNoticeDto[] {
    return this.notices.getActiveFor(user.id);
  }

  @Post(':id/dismiss')
  @HttpCode(204)
  dismiss(@CurrentUser() user: User, @Param('id') id: string): void {
    const dismissed = this.notices.dismiss(user.id, id);
    if (!dismissed) {
      throw new HttpException({ error: 'NOTICE_NOT_FOUND' }, 404);
    }
  }
}
