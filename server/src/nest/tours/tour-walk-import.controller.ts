import { ADDON_IDS } from '../../addons';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { WalkImportPreviewDto } from './dto/tour-walk-import.dto';
import { TourWalkImportService } from './tour-walk-import.service';
import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { walkImportPreviewResponseSchema } from '@trek/shared';

/**
 * CW-07 POST /api/trips/:tripId/tours/import/google-maps/preview: a Google
 * Maps walking route read into its stops; nothing is stored. Like the GPX
 * preview, the addon off or a trip out of reach answers 404, and a member who
 * may not edit places 403, since what comes next creates a tour.
 */
@Controller('api/trips/:tripId/tours')
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.TOURS, 'Tours')
export class TourWalkImportController {
  constructor(private readonly walkImport: TourWalkImportService) {}

  @RequirePermission('place_edit')
  @Post('import/google-maps/preview')
  @HttpCode(200)
  @ResponseContract(walkImportPreviewResponseSchema)
  async preview(@Body() body: WalkImportPreviewDto) {
    return await this.walkImport.preview(body.url);
  }
}
