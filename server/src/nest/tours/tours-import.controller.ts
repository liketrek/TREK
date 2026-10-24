import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonsService } from '../addons/addons.service';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { PlacesService } from '../places/places.service';
import { TourGpxImportFieldsDto } from './dto/tour-gpx-import.dto';
import { noTrackFound } from './tour-file-import.helpers';
import { ToursService } from './tours.service';
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpException,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { tourGpxPreviewResponseSchema, tourImportGpxResponseSchema } from '@trek/shared';

import { memoryStorage } from 'multer';

const UPLOAD = { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } };

/**
 * POST /api/trips/:tripId/tours/import/gpx: the tours-mode file import, and
 * POST .../import/gpx/preview: the same file read and shown, nothing stored.
 * Both read a GPX file, or by its extension a KML or KMZ file (IO-02); the
 * paths keep the name they were published under.
 *
 * A controller of its own because it must not sit behind ToursController's
 * AddonGuard and TripAccessGuard: a guard answers before multer has read the
 * multipart body, and the client then sees ECONNRESET instead of the 404 or
 * 403. The handlers run the same checks in the same order once the upload is
 * drained, with the guards' own bodies: addon off 404, no trip access 404,
 * no 'place_edit' 403. PlacesController.importGpx is the sibling.
 */
@Controller('api/trips/:tripId/tours')
@UseGuards(JwtAuthGuard)
export class ToursImportController {
  constructor(
    private readonly tours: ToursService,
    private readonly places: PlacesService,
    private readonly addons: AddonsService,
  ) {}

  /** The guards' checks, after the body is in, and the file they all need. */
  private async checkedFile(user: User, tripId: string, file: Express.Multer.File | undefined): Promise<Buffer> {
    if (!(await this.addons.isAddonEnabled(ADDON_IDS.TOURS))) {
      throw new HttpException({ error: 'Tours addon is not enabled' }, 404);
    }
    const trip = await this.places.verifyTripAccess(tripId, user.id);
    if (!trip) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    if (!(await this.places.canEdit(trip, user))) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
    if (!file) {
      throw new HttpException({ error: 'No file uploaded' }, 400);
    }
    return file.buffer;
  }

  // Declared before `import/gpx` reads clearer; the paths do not overlap either way.
  @Post('import/gpx/preview')
  @HttpCode(200)
  @ResponseContract(tourGpxPreviewResponseSchema)
  @UseInterceptors(FileInterceptor('file', UPLOAD))
  async previewGpx(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    const buffer = await this.checkedFile(user, tripId, file);
    const preview = await this.tours.previewGpx(tripId, buffer, file?.originalname);
    if (!preview) {
      throw noTrackFound(file?.originalname);
    }
    return preview;
  }

  @Post('import/gpx')
  @ResponseContract(tourImportGpxResponseSchema)
  @UseInterceptors(FileInterceptor('file', UPLOAD))
  async importGpx(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Headers('x-socket-id') socketId?: string,
    // None is a hike, as every import was before the type could be chosen.
    @Body() fields: TourGpxImportFieldsDto = { tour_type: 'hike' },
  ) {
    const buffer = await this.checkedFile(user, tripId, file);
    const result = await this.tours.importGpxAsTour(tripId, buffer, file?.originalname, socketId, fields);
    if (!result) {
      throw noTrackFound(file?.originalname);
    }
    return result;
  }
}
