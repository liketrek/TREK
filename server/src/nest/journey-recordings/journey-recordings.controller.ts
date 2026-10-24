import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { JourneyRecordingPreviewDto, JourneyRecordingSaveDto } from './journey-recordings.dto';
import { JourneyRecordingsService } from './journey-recordings.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  journeyRecordedDaysResponseSchema,
  journeyRecordingDateSchema,
  journeyRecordingPrepSchema,
  journeyRecordingPreviewSchema,
  journeyRecordingSaveResultSchema,
  successResponseSchema,
} from '@trek/shared';

/**
 * The days of recorded route a journey keeps (JRN-01), at
 * `/api/journeys/:id/recordings`. Reading them needs only access to the
 * journey; previewing and keeping a day needs the right to edit it and the
 * Dawarich addon, and reads the caller's own connection.
 */
@Controller('api/journeys/:id/recordings')
@UseGuards(AddonGuard, JwtAuthGuard)
@RequireAddon(ADDON_IDS.JOURNEY, 'Journey')
export class JourneyRecordingsController {
  constructor(private readonly recordings: JourneyRecordingsService) {}

  @Get()
  @ResponseContract(journeyRecordedDaysResponseSchema)
  async list(@CurrentUser() user: User, @Param('id') id: string) {
    return { days: await this.recordings.list(user.id, Number(id)) };
  }

  /** JRN-03: whether the journey prepares its recorded days, and how the caller's last runs went. */
  @Get('prep')
  @ResponseContract(journeyRecordingPrepSchema)
  async prep(@CurrentUser() user: User, @Param('id') id: string) {
    return await this.recordings.prepStatus(user.id, Number(id));
  }

  @Post('preview')
  @HttpCode(200)
  @ResponseContract(journeyRecordingPreviewSchema)
  async preview(@CurrentUser() user: User, @Param('id') id: string, @Body() body: JourneyRecordingPreviewDto) {
    return await this.recordings.preview(user.id, Number(id), body);
  }

  @Put(':date')
  @ResponseContract(journeyRecordingSaveResultSchema)
  async save(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Param('date') date: string,
    @Body() body: JourneyRecordingSaveDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return await this.recordings.save(user.id, Number(id), dateParam(date), body, socketId);
  }

  @Delete(':date')
  @HttpCode(200)
  @ResponseContract(successResponseSchema)
  async remove(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Param('date') date: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    await this.recordings.remove(user.id, Number(id), dateParam(date), socketId);
    return { success: true as const };
  }
}

/** A `:date` path segment as a calendar day, 400 otherwise. */
export function dateParam(raw: string): string {
  if (!journeyRecordingDateSchema.safeParse(raw).success) throw new HttpException({ error: 'Invalid date' }, 400);
  return raw;
}
