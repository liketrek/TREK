import { Controller, Get, HttpCode, HttpException, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { SystemNoticeDto } from '@trek/shared';
import type { User } from '../../types';
import { SystemNoticesService } from './system-notices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

/**
 * `?supports=release` names the layouts the calling bundle can draw, comma separated,
 * and `?ui=4.3.0` the version the bundle was built as. A missing or malformed value
 * means none, which is what every bundle before these parameters sent.
 */
function parseSupports(raw: string | string[] | undefined): Set<string> {
  const values = Array.isArray(raw) ? raw : [raw];
  const names = values.flatMap(v => (typeof v === 'string' ? v.split(',') : []));
  return new Set(names.map(s => s.trim()).filter(Boolean));
}

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
  active(
    @CurrentUser() user: User,
    @Query('supports') supports?: string | string[],
    @Query('ui') ui?: string | string[],
  ): SystemNoticeDto[] {
    return this.notices.getActiveFor(user.id, parseSupports(supports), typeof ui === 'string' ? ui.trim() : undefined);
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
