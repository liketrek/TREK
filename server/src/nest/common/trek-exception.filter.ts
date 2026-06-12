import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Response } from 'express';
import { MulterError } from 'multer';

/**
 * Normalises every Nest exception to TREK's legacy error envelope so migrated
 * routes are byte-identical for the client. This mirrors the legacy global
 * Express error handler (server/src/app.ts) exactly:
 *   - multer errors            -> 413 (LIMIT_FILE_SIZE) / 400, body { error: <multer message> }
 *   - { error, code? } bodies  -> passed through unchanged (auth guards, ZodValidationPipe)
 *   - other HttpExceptions     -> { error: <message> } at the same status
 *   - plain errors w/ statusCode/status -> that status, { error: <message> } for 4xx
 *   - everything else          -> 500 { error: 'Internal server error' }
 *
 * Without the multer + statusCode handling, file-upload rejections (multer's
 * LIMIT_FILE_SIZE and the fileFilter errors that carry `statusCode = 400`) would
 * collapse to Nest's `{ statusCode, message, error }` 413 body or a 500, diverging
 * from the legacy `{ error: 'File too large' }` (413) and `{ error: '<reason>' }` (400).
 */
@Catch()
export class TrekExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    // 1. Raw multer errors that slipped past @nestjs/platform-express's
    //    transformException (it leaves codes it does not recognise untouched).
    //    Legacy: LIMIT_FILE_SIZE -> 413, everything else -> 400, body { error: message }.
    if (exception instanceof MulterError) {
      const status = exception.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      res.status(status).json({ error: exception.message });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      if (body && typeof body === 'object') {
        const obj = body as Record<string, unknown>;
        // TREK-native shape ({ error } / { error, code } from guards + the Zod
        // pipe): pass through verbatim. Nest's own exceptions instead carry the
        // { statusCode, message, error } trio (incl. transformException's
        // PayloadTooLargeException for LIMIT_FILE_SIZE) and must be normalised.
        if ('error' in obj && !('statusCode' in obj) && !('message' in obj)) {
          res.status(status).json(obj);
          return;
        }
        const raw = obj.message ?? obj.error;
        const message =
          status < 500 ? (Array.isArray(raw) ? raw.join(', ') : String(raw ?? 'Error')) : 'Internal server error';
        res.status(status).json({ error: message });
        return;
      }

      const message = status < 500 ? String(body ?? 'Error') : 'Internal server error';
      res.status(status).json({ error: message });
      return;
    }

    // 2. Plain errors carrying an explicit status (the fileFilter rejections set
    //    `statusCode = 400`; transformException returns them unchanged). Legacy:
    //    status = err.statusCode || err.status || 500; 4xx exposes err.message.
    const err = exception as { statusCode?: number; status?: number; message?: unknown } | null;
    const status = (err && (err.statusCode || err.status)) || 500;
    if (status >= 500) console.error('Unhandled error:', exception);
    const message = status < 500 ? String(err?.message ?? 'Error') : 'Internal server error';
    res.status(status).json({ error: message });
  }
}
