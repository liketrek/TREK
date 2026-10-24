import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { JourneyDayImportService } from './journey-day-import.service';
import { dateParam } from './journey-recordings.controller';
import { JourneyDayImportDto } from './journey-recordings.dto';
import { Body, Controller, Headers, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { journeyDayImportResultSchema, journeyDayStaysSchema } from '@trek/shared';

/**
 * A recorded day taken into a journey with its stays (JRN-02), at
 * `/api/journeys/:id/recordings/:date/stays`. Both need the right to edit the
 * journey and the Dawarich addon, and read the caller's own connection. The
 * review is a POST because it reads Dawarich again and refreshes the stays it
 * shows.
 */
@Controller('api/journeys/:id/recordings')
@UseGuards(AddonGuard, JwtAuthGuard)
@RequireAddon(ADDON_IDS.JOURNEY, 'Journey')
export class JourneyDayImportController {
  constructor(private readonly dayImport: JourneyDayImportService) {}

  @Post(':date/stays/review')
  @HttpCode(200)
  @ResponseContract(journeyDayStaysSchema)
  async review(@CurrentUser() user: User, @Param('id') id: string, @Param('date') date: string) {
    return await this.dayImport.review(user.id, Number(id), dateParam(date));
  }

  @Post(':date/stays/import')
  @HttpCode(200)
  @ResponseContract(journeyDayImportResultSchema)
  async takeOver(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Param('date') date: string,
    @Body() body: JourneyDayImportDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return await this.dayImport.takeOver(user.id, Number(id), dateParam(date), body, socketId);
  }
}
