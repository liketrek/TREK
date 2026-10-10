import { Controller, Headers, HttpException, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { User } from '../../types';
import { ADDON_IDS } from '../../addons';
import { AddonsService } from '../addons/addons.service';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { PlacesService } from '../places/places.service';
import { ToursService } from './tours.service';

const UPLOAD = { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } };

/**
 * POST /api/trips/:tripId/tours/import/gpx: the tours-mode GPX import.
 *
 * A controller of its own because it must not sit behind ToursController's
 * AddonGuard and TripAccessGuard: a guard answers before multer has read the
 * multipart body, and the client then sees ECONNRESET instead of the 404 or
 * 403. The handler runs the same checks in the same order once the upload is
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

  @Post('import/gpx')
  @UseInterceptors(FileInterceptor('file', UPLOAD))
  async importGpx(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Headers('x-socket-id') socketId?: string,
  ) {
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
    const result = await this.tours.importGpxAsTour(tripId, file.buffer, file.originalname, socketId);
    if (!result) {
      throw new HttpException({ error: 'No track or route found in GPX file' }, 400);
    }
    return result;
  }
}
