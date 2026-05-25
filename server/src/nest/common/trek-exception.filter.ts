import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Response } from 'express';

/**
 * Normalises every Nest exception to TREK's legacy error envelope so migrated
 * routes are byte-identical for the client:
 *   - 4xx -> { error: <message> }   (5xx -> { error: 'Internal server error' })
 *   - exceptions already throwing { error, code? } (e.g. the auth guards) pass through
 * This replaces Nest's default { statusCode, message, error } body, which the
 * TREK client does not expect.
 */
@Catch()
export class TrekExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      // Already in TREK shape (e.g. guards throw { error, code }): pass through.
      if (body && typeof body === 'object' && 'error' in (body as Record<string, unknown>)) {
        res.status(status).json(body);
        return;
      }

      const raw = typeof body === 'string' ? body : (body as { message?: unknown })?.message;
      const message =
        status < 500
          ? Array.isArray(raw)
            ? raw.join(', ')
            : String(raw ?? 'Error')
          : 'Internal server error';
      res.status(status).json({ error: message });
      return;
    }

    // Unknown/unhandled error — mirror the legacy 500 behaviour.
    console.error('Unhandled error:', exception);
    res.status(500).json({ error: 'Internal server error' });
  }
}
