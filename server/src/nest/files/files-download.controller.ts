import { Controller, Get, HttpException, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import path from 'path';
import { FilesService } from './files.service';
import { Public } from '../auth/public.decorator';
import { StorageService } from '../storage/storage.service';

/**
 * GET /api/trips/:tripId/files/:id/download — authenticated file download.
 *
 * Deliberately NOT behind the JwtAuthGuard: it accepts a cookie, a Bearer header
 * OR a one-shot `?token=` query param (so links can be opened directly), all via
 * the legacy authenticateDownload helper. Byte-identical to the legacy route:
 * 401 token, 404 trip/file, .pkpass served inline for Wallet. Bytes come from
 * storage.sendToResponse, whose local branch is the root-relative res.sendFile
 * form this route needs under the ExpressAdapter.
 */
@Public('authenticates itself: the download link carries a short-lived ?token the client mints')
@Controller('api/trips/:tripId/files')
export class FilesDownloadController {
  constructor(
    private readonly files: FilesService,
    private readonly storage: StorageService,
  ) {}

  @Get(':id/download')
  async download(
    @Req() req: Request,
    @Res() res: Response,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
  ): Promise<void> {
    const auth = this.files.authenticateDownload(req);
    if ('error' in auth) {
      throw new HttpException({ error: auth.error }, auth.status);
    }

    const trip = this.files.verifyTripAccess(tripId, auth.userId);
    if (!trip) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }

    const file = this.files.getFileById(id, tripId);
    if (!file) {
      throw new HttpException({ error: 'File not found' }, 404);
    }

    // basename() tolerates a stray prefixed row (legacy rows sometimes stored
    // a relative path); the storage layer's key validation refuses the rest.
    const name = path.basename(file.filename);
    if (!(await this.storage.exists('files', name).catch(() => false))) {
      throw new HttpException({ error: 'File not found' }, 404);
    }

    // Serve Apple Wallet passes inline with the canonical MIME type so Safari
    // (iOS/macOS) hands them to Wallet instead of downloading as a blob. A
    // `.pkpasses` bundle (a ZIP of multiple passes) is a distinct type with its
    // own plural MIME type — without it Wallet won't offer to add the passes.
    const ext = path.extname(name).toLowerCase();
    const walletMime =
      ext === '.pkpass'
        ? 'application/vnd.apple.pkpass'
        : ext === '.pkpasses'
          ? 'application/vnd.apple.pkpasses'
          : null;
    await this.storage.sendToResponse(
      'files',
      name,
      res,
      walletMime
        ? { contentType: walletMime, disposition: `inline; filename="${path.basename(file.original_name || name)}"` }
        : undefined,
    );
  }
}
