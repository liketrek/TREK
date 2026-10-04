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
import { isDemoWriteBlocked, DEMO_WRITE_ERROR } from '../common/demo-write';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import type { Options } from 'multer';
import path from 'path';
import fs from 'fs';
import type { User } from '../../types';
import { StorageService } from '../storage/storage.service';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { TripAccessGuard } from '../permissions/trip-access.guard';
import type { TripAccess } from '../../db/repositories/Trips.repository';
import { Trip } from '../permissions/trip.decorator';
import { MAX_FILE_SIZE, BLOCKED_EXTENSIONS, isUploadTypeAllowed, isVideoExtension } from './files.constants';
import { FileUploadDto, FileUpdateDto, FileLinkDto } from './files.dto';
import { AllowedFileTypesService } from './allowed-file-types.service';
import { logError } from '../audit/audit-log.logger';

/**
 * Trip-file upload filter, built from the container.
 *
 * A factory rather than a module-scope literal because it reads the operator's
 * allowed-extension list at request time, and that list lives in the database.
 * The rest of the multer options come from the storage upload factory
 * (buildStorageUploadOptions in files.module.ts); this closure is passed
 * through untouched.
 */
export function filesUploadFileFilter(allowedTypes: AllowedFileTypesService): Options['fileFilter'] {
  return (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const reject = () => {
      // i18n key — the client resolves it via t() (see translateApiError).
      const err: Error & { statusCode?: number } = new Error('files.uploadErrorType');
      err.statusCode = 400;
      cb(err);
    };
    if (BLOCKED_EXTENSIONS.includes(ext) || file.mimetype.includes('svg')) return reject();
    // R1.5: multer's fileFilter is a callback API that cannot await, and the
    // allowed-extension list is now an async read. The decision runs in a
    // detached async function that always answers through `cb` — multer holds
    // the file stream until it does (make-middleware.js says as much). A
    // rejection refuses the file, so the filter still fails closed. Only the
    // await is wrapped in try/catch; a throw from cb() itself lands in the
    // trailing .catch, which logs it and answers multer one final time.
    (async () => {
      let allowedList: string;
      try {
        allowedList = await allowedTypes.get();
      } catch {
        return reject();
      }
      // Shared with the MCP upload tool (#1566): blocked/SVG never, video always (#823).
      if (isUploadTypeAllowed(file.originalname, file.mimetype, allowedList)) return cb(null, true);
      reject();
    })().catch((err: unknown) => {
      logError(`files upload fileFilter: ${err instanceof Error ? err.message : String(err)}`);
      // cb() itself is the only thing that can reach here (every await is
      // inside the try above); answer once more so multer never hangs, but a
      // second throw from cb() means multer already answered — swallow it.
      try {
        cb(err instanceof Error ? err : new Error(String(err)));
      } catch {
        /* multer already answered */
      }
    });
  };
}

/**
 * /api/trips/:tripId/files — trip file manager (upload, metadata, starring,
 * trash + restore, reservation links). The authenticated download lives in the
 * separate unguarded FilesDownloadController (it carries its own token auth).
 *
 * Byte-identical to the legacy Express route (server/src/routes/files.ts): trip
 * access (404), the demo-mode upload block (403), the file_upload/file_edit/
 * file_delete permissions (403), create 201 / rest 200, the bespoke bodies and
 * the WebSocket broadcasts with the forwarded X-Socket-Id.
 */
@Controller('api/trips/:tripId/files')
// TripAccessGuard carries the trip access check, applied PER HANDLER rather than on
// the class. The per-handler RIGHT stays inline because files use three different ones
// (file_upload, file_edit, file_delete), which one class-level @RequirePermission could
// not express.
//
// `upload` is deliberately left off the guard and keeps its own check. Guards run
// before interceptors, so a class-level guard would answer 404 before multer had read
// the multipart body — and a response sent while the client is still streaming gets the
// socket destroyed, so the caller sees ECONNRESET instead of the 404. Refusing after
// the body has been read costs the bandwidth but keeps the answer readable, which is
// the behaviour every client already handles.
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(
    private readonly files: FilesService,
    private readonly env: RuntimeEnvService,
    private readonly storage: StorageService,
  ) {}


  // A file may only point at reservations/assignments/places/budget_items from its own trip.
  // Reject cross-trip ids before they are stored — the reservation JOIN would
  // otherwise leak the foreign reservation's title back to the caller.
  private async assertLinkTargets(tripId: string, body: { reservation_id?: string | number | null; assignment_id?: string | number | null; place_id?: string | number | null; budget_item_id?: string | number | null }) {
    if (await this.files.findForeignLinkTarget(tripId, body)) {
      throw new HttpException({ error: 'Linked item does not belong to this trip' }, 400);
    }
  }

  @UseGuards(TripAccessGuard)
  @Get()
  async list(@CurrentUser() user: User, @Trip() trip: TripAccess, @Param('tripId') tripId: string, @Query('trash') trash?: string) {
    return { files: await this.files.listFiles(tripId, trash === 'true') };
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: FileUploadDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // multer (diskStorage) has already spooled the upload by the time we get here,
    // so every rejection below must remove the orphaned bytes — otherwise a 404/403
    // leaves up to the 500 MB video cap on disk (#823).
    const cleanup = () => { if (file?.path) { try { fs.unlinkSync(file.path); } catch { /* best-effort */ } } };
    try {
      const trip = await this.files.verifyTripAccess(tripId, user.id);
      if (!trip) {
        throw new HttpException({ error: 'Trip not found' }, 404);
      }
      // Inline rather than DemoWriteGuard: the 404 above has to come first, so a demo
      // user still cannot learn which trips exist.
      if (isDemoWriteBlocked(this.env, user.email)) {
        throw new HttpException(DEMO_WRITE_ERROR, 403);
      }
      if (!(await this.files.can('file_upload', trip, user))) {
        throw new HttpException({ error: 'No permission to upload files' }, 403);
      }
    } catch (err) {
      cleanup();
      throw err;
    }
    if (!file) {
      throw new HttpException({ error: 'No file uploaded' }, 400);
    }
    // The per-type cap is keyed on the EXTENSION, matching how the fileFilter
    // decides acceptance — so a real video labelled application/octet-stream isn't
    // wrongly rejected, and the 500 MB cap only applies to actual video extensions.
    const isVideoUpload = isVideoExtension(path.extname(file.originalname || ''));
    if (!isVideoUpload && file.size > MAX_FILE_SIZE) {
      cleanup();
      throw new HttpException({ error: 'File is too large' }, 400);
    }
    try {
      await this.assertLinkTargets(tripId, { reservation_id: body.reservation_id, place_id: body.place_id, budget_item_id: body.budget_item_id });
    } catch (err) {
      cleanup();
      throw err;
    }
    // Commit the spooled upload to its final storage location (atomic
    // same-volume rename) before anything references the final path.
    try {
      await this.storage.put('files', file.filename, { tmpPath: file.path });
    } catch (err) {
      cleanup();
      throw err;
    }
    const created = await this.files.createFile(tripId, file, user.id, {
      place_id: body.place_id,
      description: body.description,
      reservation_id: body.reservation_id,
      budget_item_id: body.budget_item_id,
    });
    this.files.broadcast(tripId, 'file:created', { file: created }, socketId);
    return { file: created };
  }

  @UseGuards(TripAccessGuard)
  @Put(':id')
  async update(@CurrentUser() user: User, @Trip() trip: TripAccess, @Param('tripId') tripId: string, @Param('id') id: string, @Body() body: FileUpdateDto, @Headers('x-socket-id') socketId?: string) {
    if (!(await this.files.can('file_edit', trip, user))) {
      throw new HttpException({ error: 'No permission to edit files' }, 403);
    }
    const file = await this.files.getFileById(id, tripId);
    if (!file) {
      throw new HttpException({ error: 'File not found' }, 404);
    }
    await this.assertLinkTargets(tripId, { reservation_id: body.reservation_id, place_id: body.place_id, budget_item_id: body.budget_item_id });
    const updated = await this.files.updateFile(id, file, {
      description: body.description,
      place_id: body.place_id,
      reservation_id: body.reservation_id,
      budget_item_id: body.budget_item_id,
    });
    this.files.broadcast(tripId, 'file:updated', { file: updated }, socketId);
    return { file: updated };
  }

  @UseGuards(TripAccessGuard)
  @Patch(':id/star')
  async star(@CurrentUser() user: User, @Trip() trip: TripAccess, @Param('tripId') tripId: string, @Param('id') id: string, @Headers('x-socket-id') socketId?: string) {
    if (!(await this.files.can('file_edit', trip, user))) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
    const file = await this.files.getFileById(id, tripId);
    if (!file) {
      throw new HttpException({ error: 'File not found' }, 404);
    }
    const updated = await this.files.toggleStarred(id, file.starred);
    this.files.broadcast(tripId, 'file:updated', { file: updated }, socketId);
    return { file: updated };
  }

  @UseGuards(TripAccessGuard)
  @Delete('trash/empty')
  async emptyTrash(@CurrentUser() user: User, @Trip() trip: TripAccess, @Param('tripId') tripId: string) {
    if (!(await this.files.can('file_delete', trip, user))) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
    const deleted = await this.files.emptyTrash(tripId);
    return { success: true, deleted };
  }

  @UseGuards(TripAccessGuard)
  @Delete(':id/permanent')
  async permanent(@CurrentUser() user: User, @Trip() trip: TripAccess, @Param('tripId') tripId: string, @Param('id') id: string, @Headers('x-socket-id') socketId?: string) {
    if (!(await this.files.can('file_delete', trip, user))) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
    const file = await this.files.getDeletedFile(id, tripId);
    if (!file) {
      throw new HttpException({ error: 'File not found in trash' }, 404);
    }
    await this.files.permanentDeleteFile(file);
    this.files.broadcast(tripId, 'file:deleted', { fileId: Number(id) }, socketId);
    return { success: true };
  }

  @UseGuards(TripAccessGuard)
  @Delete(':id')
  async remove(@CurrentUser() user: User, @Trip() trip: TripAccess, @Param('tripId') tripId: string, @Param('id') id: string, @Headers('x-socket-id') socketId?: string) {
    if (!(await this.files.can('file_delete', trip, user))) {
      throw new HttpException({ error: 'No permission to delete files' }, 403);
    }
    const file = await this.files.getFileById(id, tripId);
    if (!file) {
      throw new HttpException({ error: 'File not found' }, 404);
    }
    await this.files.softDeleteFile(id);
    this.files.broadcast(tripId, 'file:deleted', { fileId: Number(id) }, socketId);
    return { success: true };
  }

  @UseGuards(TripAccessGuard)
  @Post(':id/restore')
  @HttpCode(200) // Express answers restore with res.json (200), not the POST-default 201.
  async restore(@CurrentUser() user: User, @Trip() trip: TripAccess, @Param('tripId') tripId: string, @Param('id') id: string, @Headers('x-socket-id') socketId?: string) {
    if (!(await this.files.can('file_delete', trip, user))) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
    const file = await this.files.getDeletedFile(id, tripId);
    if (!file) {
      throw new HttpException({ error: 'File not found in trash' }, 404);
    }
    const restored = await this.files.restoreFile(id);
    this.files.broadcast(tripId, 'file:created', { file: restored }, socketId);
    return { file: restored };
  }

  @UseGuards(TripAccessGuard)
  @Post(':id/link')
  @HttpCode(200) // Express answers link with res.json (200).
  async link(@CurrentUser() user: User, @Trip() trip: TripAccess, @Param('tripId') tripId: string, @Param('id') id: string, @Body() body: FileLinkDto) {
    if (!(await this.files.can('file_edit', trip, user))) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
    const file = await this.files.getFileById(id, tripId);
    if (!file) {
      throw new HttpException({ error: 'File not found' }, 404);
    }
    await this.assertLinkTargets(tripId, { reservation_id: body.reservation_id, assignment_id: body.assignment_id, place_id: body.place_id, budget_item_id: body.budget_item_id });
    const links = await this.files.createFileLink(id, { reservation_id: body.reservation_id, assignment_id: body.assignment_id, place_id: body.place_id, budget_item_id: body.budget_item_id });
    return { success: true, links };
  }

  @UseGuards(TripAccessGuard)
  @Delete(':id/link/:linkId')
  async unlink(@CurrentUser() user: User, @Trip() trip: TripAccess, @Param('tripId') tripId: string, @Param('id') id: string, @Param('linkId') linkId: string) {
    if (!(await this.files.can('file_edit', trip, user))) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
    // deleteFileLink scopes by (linkId, fileId) only, so the file itself has to
    // be resolved against :tripId first. Otherwise a member of any trip could
    // drop a link row belonging to a foreign trip's file.
    const file = await this.files.getFileById(id, tripId);
    if (!file) {
      throw new HttpException({ error: 'File not found' }, 404);
    }
    await this.files.deleteFileLink(linkId, id);
    return { success: true };
  }

  @UseGuards(TripAccessGuard)
  @Get(':id/links')
  async links(@CurrentUser() user: User, @Trip() trip: TripAccess, @Param('tripId') tripId: string, @Param('id') id: string) {
    const file = await this.files.getFileById(id, tripId);
    if (!file) {
      throw new HttpException({ error: 'File not found' }, 404);
    }
    return { links: await this.files.getFileLinks(id) };
  }
}
