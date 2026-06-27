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
import { diskStorage } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '../../types';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { MAX_FILE_SIZE, BLOCKED_EXTENSIONS, filesDir, getAllowedExtensions } from '../../services/fileService';
import { isDemoEmail } from '../../services/demo';

const UPLOAD = {
  storage: diskStorage({
    destination: (_req, _file, cb) => { if (!fs.existsSync(filesDir)) fs.mkdirSync(filesDir, { recursive: true }); cb(null, filesDir); },
    filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: MAX_FILE_SIZE },
  defParamCharset: 'utf8', // parity with legacy routes/files.ts — preserve non-ASCII original filenames
  fileFilter: (_req: unknown, file: Express.Multer.File, cb: (err: Error | null, accept: boolean) => void) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const reject = () => {
      const err: Error & { statusCode?: number } = new Error('File type not allowed');
      err.statusCode = 400;
      cb(err, false);
    };
    if (BLOCKED_EXTENSIONS.includes(ext) || file.mimetype.includes('svg')) return reject();
    const allowed = getAllowedExtensions().split(',').map((e) => e.trim().toLowerCase());
    const fileExt = ext.replace('.', '');
    if (allowed.includes(fileExt) || (allowed.includes('*') && !BLOCKED_EXTENSIONS.includes(ext))) return cb(null, true);
    reject();
  },
};

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
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly files: FilesService) {}

  private requireTrip(tripId: string, user: User) {
    const trip = this.files.verifyTripAccess(tripId, user.id);
    if (!trip) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    return trip;
  }

  // A file may only point at reservations/assignments/places from its own trip.
  // Reject cross-trip ids before they are stored — the reservation JOIN would
  // otherwise leak the foreign reservation's title back to the caller.
  private assertLinkTargets(tripId: string, body: { reservation_id?: string | null; assignment_id?: string | null; place_id?: string | null }) {
    if (this.files.findForeignLinkTarget(tripId, body)) {
      throw new HttpException({ error: 'Linked item does not belong to this trip' }, 400);
    }
  }

  @Get()
  list(@CurrentUser() user: User, @Param('tripId') tripId: string, @Query('trash') trash?: string) {
    this.requireTrip(tripId, user);
    return { files: this.files.listFiles(tripId, trash === 'true') };
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', UPLOAD))
  upload(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { place_id?: string; description?: string; reservation_id?: string },
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    if (process.env.DEMO_MODE?.toLowerCase() === 'true' && isDemoEmail(user.email)) {
      throw new HttpException({ error: 'Uploads are disabled in demo mode. Self-host TREK for full functionality.' }, 403);
    }
    if (!this.files.can('file_upload', trip, user)) {
      throw new HttpException({ error: 'No permission to upload files' }, 403);
    }
    if (!file) {
      throw new HttpException({ error: 'No file uploaded' }, 400);
    }
    this.assertLinkTargets(tripId, { reservation_id: body.reservation_id, place_id: body.place_id });
    const created = this.files.createFile(tripId, file, user.id, {
      place_id: body.place_id,
      description: body.description,
      reservation_id: body.reservation_id,
    });
    this.files.broadcast(tripId, 'file:created', { file: created }, socketId);
    return { file: created };
  }

  @Put(':id')
  update(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string, @Body() body: { description?: string; place_id?: string | null; reservation_id?: string | null }, @Headers('x-socket-id') socketId?: string) {
    const trip = this.requireTrip(tripId, user);
    if (!this.files.can('file_edit', trip, user)) {
      throw new HttpException({ error: 'No permission to edit files' }, 403);
    }
    const file = this.files.getFileById(id, tripId);
    if (!file) {
      throw new HttpException({ error: 'File not found' }, 404);
    }
    this.assertLinkTargets(tripId, { reservation_id: body.reservation_id, place_id: body.place_id });
    const updated = this.files.updateFile(id, file, { description: body.description, place_id: body.place_id, reservation_id: body.reservation_id });
    this.files.broadcast(tripId, 'file:updated', { file: updated }, socketId);
    return { file: updated };
  }

  @Patch(':id/star')
  star(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string, @Headers('x-socket-id') socketId?: string) {
    const trip = this.requireTrip(tripId, user);
    if (!this.files.can('file_edit', trip, user)) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
    const file = this.files.getFileById(id, tripId);
    if (!file) {
      throw new HttpException({ error: 'File not found' }, 404);
    }
    const updated = this.files.toggleStarred(id, file.starred);
    this.files.broadcast(tripId, 'file:updated', { file: updated }, socketId);
    return { file: updated };
  }

  @Delete('trash/empty')
  async emptyTrash(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    const trip = this.requireTrip(tripId, user);
    if (!this.files.can('file_delete', trip, user)) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
    const deleted = await this.files.emptyTrash(tripId);
    return { success: true, deleted };
  }

  @Delete(':id/permanent')
  async permanent(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string, @Headers('x-socket-id') socketId?: string) {
    const trip = this.requireTrip(tripId, user);
    if (!this.files.can('file_delete', trip, user)) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
    const file = this.files.getDeletedFile(id, tripId);
    if (!file) {
      throw new HttpException({ error: 'File not found in trash' }, 404);
    }
    await this.files.permanentDeleteFile(file);
    this.files.broadcast(tripId, 'file:deleted', { fileId: Number(id) }, socketId);
    return { success: true };
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string, @Headers('x-socket-id') socketId?: string) {
    const trip = this.requireTrip(tripId, user);
    if (!this.files.can('file_delete', trip, user)) {
      throw new HttpException({ error: 'No permission to delete files' }, 403);
    }
    const file = this.files.getFileById(id, tripId);
    if (!file) {
      throw new HttpException({ error: 'File not found' }, 404);
    }
    this.files.softDeleteFile(id);
    this.files.broadcast(tripId, 'file:deleted', { fileId: Number(id) }, socketId);
    return { success: true };
  }

  @Post(':id/restore')
  @HttpCode(200) // Express answers restore with res.json (200), not the POST-default 201.
  restore(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string, @Headers('x-socket-id') socketId?: string) {
    const trip = this.requireTrip(tripId, user);
    if (!this.files.can('file_delete', trip, user)) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
    const file = this.files.getDeletedFile(id, tripId);
    if (!file) {
      throw new HttpException({ error: 'File not found in trash' }, 404);
    }
    const restored = this.files.restoreFile(id);
    this.files.broadcast(tripId, 'file:created', { file: restored }, socketId);
    return { file: restored };
  }

  @Post(':id/link')
  @HttpCode(200) // Express answers link with res.json (200).
  link(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string, @Body() body: { reservation_id?: string | null; assignment_id?: string | null; place_id?: string | null }) {
    const trip = this.requireTrip(tripId, user);
    if (!this.files.can('file_edit', trip, user)) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
    const file = this.files.getFileById(id, tripId);
    if (!file) {
      throw new HttpException({ error: 'File not found' }, 404);
    }
    this.assertLinkTargets(tripId, { reservation_id: body.reservation_id, assignment_id: body.assignment_id, place_id: body.place_id });
    const links = this.files.createFileLink(id, { reservation_id: body.reservation_id, assignment_id: body.assignment_id, place_id: body.place_id });
    return { success: true, links };
  }

  @Delete(':id/link/:linkId')
  unlink(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string, @Param('linkId') linkId: string) {
    const trip = this.requireTrip(tripId, user);
    if (!this.files.can('file_edit', trip, user)) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
    this.files.deleteFileLink(linkId, id);
    return { success: true };
  }

  @Get(':id/links')
  links(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string) {
    this.requireTrip(tripId, user);
    return { links: this.files.getFileLinks(id) };
  }
}
