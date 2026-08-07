import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { diskStorage } from 'multer';
import path from 'path';
import fs from 'fs';
import { readEnv } from '../../app-config';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '../../types';
import { CollectionsService } from './collections.service';
import { CollectionsAddonGuard } from './collections-addon.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PLACE_IMAGE_UPLOAD } from '../common/place-image-upload';
import { placeImageUrl } from '../../services/placeImage';
import { isDemoEmail } from '../common/demo';
import {
  CollectionCreateDto,
  CollectionUpdateDto,
  CollectionReorderDto,
  CollectionDeleteManyDto,
  CollectionSavePlaceDto,
  CollectionSaveFromTripDto,
  CollectionSaveFromTripManyDto,
  CollectionPlaceUpdateDto,
  CollectionSetStatusDto,
  CollectionCopyToTripDto,
  CollectionInviteDto,
  CollectionInviteActionDto,
  CollectionInviteCancelDto,
  CollectionRemoveMemberDto,
  CollectionSetMemberRoleDto,
  CollectionLabelCreateDto,
  CollectionLabelUpdateDto,
  CollectionLabelAssignDto,
} from './collections.dto';
import { PlaceRatingDto } from '../places/places.dto';

const MAX_COVER_SIZE = 20 * 1024 * 1024;
const coversDir = path.join(__dirname, '../../../uploads/covers');
const COVER_UPLOAD = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });
      cb(null, coversDir);
    },
    filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: MAX_COVER_SIZE },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: (err: Error | null, accept: boolean) => void) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (file.mimetype.startsWith('image/') && !file.mimetype.includes('svg') && allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only jpg, png, gif, webp images allowed'), false);
  },
};

/**
 * /api/addons/collections — saved-place library (lists, places, fusion sharing).
 *
 * The addon guard (404) runs before JwtAuthGuard so a disabled addon answers 404
 * regardless of auth. Access control lives in the service (assertAccess / isOwner
 * throw 404/403/400). /invite, /invite/cancel and /:id/available-users add an
 * explicit owner check in the controller so they cannot be used to enumerate.
 * The X-Socket-Id header is forwarded to the service so the originating client is
 * excluded from the WS broadcast.
 */
@Controller('api/addons/collections')
@UseGuards(CollectionsAddonGuard, JwtAuthGuard)
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  // ── Lists ─────────────────────────────────────────────────────────────────
  @Get()
  list(@CurrentUser() user: User) {
    return this.collections.listCollections(user.id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() body: CollectionCreateDto) {
    return this.collections.createCollection(user.id, body);
  }

  @Post('reorder')
  @HttpCode(200)
  reorder(@CurrentUser() user: User, @Body() body: CollectionReorderDto) {
    this.collections.reorderCollections(user.id, body.orderedIds);
    return { success: true };
  }

  // ── Places (static prefixes before /:id) ────────────────────────────────────
  @Post('places')
  @HttpCode(200)
  savePlace(@CurrentUser() user: User, @Body() body: CollectionSavePlaceDto, @Headers('x-socket-id') socketId?: string) {
    return this.collections.savePlace(user.id, body, socketId);
  }

  @Post('places/from-trip')
  @HttpCode(200)
  saveFromTrip(@CurrentUser() user: User, @Body() body: CollectionSaveFromTripDto, @Headers('x-socket-id') socketId?: string) {
    return this.collections.saveFromTripPlace(user.id, body.collection_id, body.source_trip_id, body.source_place_id, body.force, socketId);
  }

  @Post('places/from-trip-many')
  @HttpCode(200)
  saveFromTripMany(@CurrentUser() user: User, @Body() body: CollectionSaveFromTripManyDto, @Headers('x-socket-id') socketId?: string) {
    return this.collections.saveFromTripPlaces(user.id, body.collection_id, body.source_trip_id, body.source_place_ids, body.force, socketId);
  }

  @Post('places/delete-many')
  @HttpCode(200)
  deleteMany(@CurrentUser() user: User, @Body() body: CollectionDeleteManyDto, @Headers('x-socket-id') socketId?: string) {
    return { deleted: this.collections.deletePlacesMany(user.id, body.ids, socketId) };
  }

  @Patch('places/:pid')
  updatePlace(
    @CurrentUser() user: User,
    @Param('pid') pid: string,
    @Body() body: CollectionPlaceUpdateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return this.collections.updatePlace(user.id, Number(pid), body, socketId);
  }

  @Post('places/:pid/status')
  @HttpCode(200)
  setStatus(
    @CurrentUser() user: User,
    @Param('pid') pid: string,
    @Body() body: CollectionSetStatusDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return this.collections.setStatus(user.id, Number(pid), body.status, socketId);
  }

  @Put('places/:pid/rating')
  setRating(
    @CurrentUser() user: User,
    @Param('pid') pid: string,
    @Body() body: PlaceRatingDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return this.collections.setRating(user.id, Number(pid), body.rating, socketId);
  }

  @Delete('places/:pid/rating')
  clearRating(@CurrentUser() user: User, @Param('pid') pid: string, @Headers('x-socket-id') socketId?: string) {
    return this.collections.setRating(user.id, Number(pid), null, socketId);
  }

  @Post('places/:pid/image')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('image', PLACE_IMAGE_UPLOAD))
  uploadPlaceImage(
    @CurrentUser() user: User,
    @Param('pid') pid: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (readEnv().demo.enabled && isDemoEmail(user.email)) {
      throw new HttpException({ error: 'Uploads are disabled in demo mode. Self-host TREK for full functionality.' }, 403);
    }
    if (!file) throw new HttpException({ error: 'No image uploaded' }, 400);
    return this.collections.setPlaceImage(user.id, Number(pid), placeImageUrl(file.filename), socketId);
  }

  @Delete('places/:pid')
  deletePlace(@CurrentUser() user: User, @Param('pid') pid: string, @Headers('x-socket-id') socketId?: string) {
    this.collections.deletePlace(user.id, Number(pid), socketId);
    return { success: true };
  }

  // ── Copy to trip ────────────────────────────────────────────────────────────
  @Post('copy-to-trip')
  @HttpCode(200)
  copyToTrip(@CurrentUser() user: User, @Body() body: CollectionCopyToTripDto) {
    return this.collections.copyToTrip(user.id, body);
  }

  // ── Labels (per-collection custom labels; static prefixes before /:id) ───────
  @Post('labels')
  @HttpCode(200)
  createLabel(
    @CurrentUser() user: User,
    @Body() body: CollectionLabelCreateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return this.collections.createLabel(user.id, body.collection_id, body.name, body.color, socketId);
  }

  @Patch('labels/:lid')
  updateLabel(
    @CurrentUser() user: User,
    @Param('lid') lid: string,
    @Body() body: CollectionLabelUpdateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return this.collections.updateLabel(user.id, Number(lid), body, socketId);
  }

  @Delete('labels/:lid')
  deleteLabel(@CurrentUser() user: User, @Param('lid') lid: string, @Headers('x-socket-id') socketId?: string) {
    this.collections.deleteLabel(user.id, Number(lid), socketId);
    return { success: true };
  }

  @Post('labels/assign')
  @HttpCode(200)
  assignLabels(
    @CurrentUser() user: User,
    @Body() body: CollectionLabelAssignDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return this.collections.assignLabels(user.id, body.label_ids, body.place_ids, false, socketId);
  }

  @Post('labels/unassign')
  @HttpCode(200)
  unassignLabels(
    @CurrentUser() user: User,
    @Body() body: CollectionLabelAssignDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return this.collections.assignLabels(user.id, body.label_ids, body.place_ids, true, socketId);
  }

  // ── Library-wide membership lookup ──────────────────────────────────────────
  @Get('membership')
  membership(
    @CurrentUser() user: User,
    @Query('google_place_id') googlePlaceId?: string,
    @Query('google_ftid') googleFtid?: string,
    @Query('name') name?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    return this.collections.findMembership(user.id, {
      google_place_id: googlePlaceId,
      google_ftid: googleFtid,
      name,
      lat: lat != null && lat !== '' ? Number(lat) : undefined,
      lng: lng != null && lng !== '' ? Number(lng) : undefined,
    });
  }

  // ── Fusion invitations ──────────────────────────────────────────────────────
  @Post('invite')
  @HttpCode(200)
  invite(@CurrentUser() user: User, @Body() body: CollectionInviteDto) {
    this.collections.assertAccess(user.id, body.collection_id); // 404 if not visible (no enumeration)
    if (!this.collections.isOwner(user.id, body.collection_id)) {
      throw new HttpException({ error: 'Only the owner can invite' }, 403);
    }
    const result = this.collections.sendInvite(body.collection_id, user.id, user.username, user.email, body.user_id, body.role);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return { success: true };
  }

  @Post('invite/accept')
  @HttpCode(200)
  acceptInvite(@CurrentUser() user: User, @Body() body: CollectionInviteActionDto, @Headers('x-socket-id') socketId?: string) {
    const result = this.collections.acceptInvite(user.id, body.collection_id, socketId);
    if (result.error) {
      throw new HttpException({ error: result.error }, result.status!);
    }
    return { success: true };
  }

  @Post('invite/decline')
  @HttpCode(200)
  declineInvite(@CurrentUser() user: User, @Body() body: CollectionInviteActionDto, @Headers('x-socket-id') socketId?: string) {
    this.collections.declineInvite(user.id, body.collection_id, socketId);
    return { success: true };
  }

  @Post('invite/cancel')
  @HttpCode(200)
  cancelInvite(@CurrentUser() user: User, @Body() body: CollectionInviteCancelDto) {
    this.collections.assertAccess(user.id, body.collection_id); // 404 if not visible
    if (!this.collections.isOwner(user.id, body.collection_id)) {
      throw new HttpException({ error: 'Only the owner can cancel invites' }, 403);
    }
    this.collections.cancelInvite(body.collection_id, user.id, body.user_id);
    return { success: true };
  }

  @Post('leave')
  @HttpCode(200)
  leave(@CurrentUser() user: User, @Body() body: CollectionInviteActionDto, @Headers('x-socket-id') socketId?: string) {
    this.collections.leaveCollection(user.id, body.collection_id, socketId);
    return { success: true };
  }

  @Post('members/remove')
  @HttpCode(200)
  removeMember(@CurrentUser() user: User, @Body() body: CollectionRemoveMemberDto) {
    this.collections.assertAccess(user.id, body.collection_id); // 404 if not visible
    if (!this.collections.isOwner(user.id, body.collection_id)) {
      throw new HttpException({ error: 'Only the owner can remove members' }, 403);
    }
    this.collections.removeMember(user.id, body.collection_id, body.user_id);
    return { success: true };
  }

  @Post('members/role')
  @HttpCode(200)
  setMemberRole(@CurrentUser() user: User, @Body() body: CollectionSetMemberRoleDto) {
    this.collections.assertAccess(user.id, body.collection_id); // 404 if not visible
    if (!this.collections.isOwner(user.id, body.collection_id)) {
      throw new HttpException({ error: 'Only the owner can change member roles' }, 403);
    }
    this.collections.setMemberRole(user.id, body.collection_id, body.user_id, body.role);
    return { success: true };
  }

  // ── /:id (declared last so static prefixes win) ─────────────────────────────
  @Get(':id/available-users')
  availableUsers(@CurrentUser() user: User, @Param('id') id: string) {
    this.collections.assertAccess(user.id, Number(id)); // 404 if not visible (no enumeration)
    if (!this.collections.isOwner(user.id, Number(id))) {
      throw new HttpException({ error: 'Only the owner can manage members' }, 403);
    }
    return { users: this.collections.availableUsers(user.id, Number(id)) };
  }

  @Post(':id/cover')
  @UseInterceptors(FileInterceptor('cover', COVER_UPLOAD))
  uploadCover(@CurrentUser() user: User, @Param('id') id: string, @UploadedFile() file: Express.Multer.File | undefined, @Headers('x-socket-id') socketId?: string) {
    if (readEnv().demo.enabled && isDemoEmail(user.email)) {
      throw new HttpException({ error: 'Uploads are disabled in demo mode. Self-host TREK for full functionality.' }, 403);
    }
    if (!file) throw new HttpException({ error: 'No image uploaded' }, 400);
    const coverUrl = `/uploads/covers/${file.filename}`;
    return this.collections.setCollectionCover(user.id, Number(id), coverUrl, socketId);
  }

  @Get(':id')
  get(@CurrentUser() user: User, @Param('id') id: string) {
    return this.collections.getCollection(user.id, Number(id));
  }

  @Patch(':id')
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() body: CollectionUpdateDto, @Headers('x-socket-id') socketId?: string) {
    return this.collections.updateCollection(user.id, Number(id), body, socketId);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    this.collections.deleteCollection(user.id, Number(id));
    return { success: true };
  }
}
