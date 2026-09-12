import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import * as fs from 'fs';

/**
 * Unlink whatever multer spooled when the request dies before the handler.
 *
 * Nest resolves handler parameters, and therefore runs the validation pipe,
 * only after every interceptor has been entered. `FilesInterceptor` has already
 * written the parts to the spool directory by then, so a body the Zod pipe
 * rejects throws with the bytes on disk and the handler's own cleanup never
 * reached. Nothing sweeps that directory, and the request is repeatable, so it
 * is a disk-fill anybody with upload rights can trigger in a loop.
 *
 * Register it AFTER the file interceptor on a route, so `req.files` is
 * populated by the time this one wraps the call. It only cleans up on failure:
 * a handler that succeeds owns the spooled files and moves them itself.
 */
@Injectable()
export class SpoolCleanupInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError(err => {
        const req = context.switchToHttp().getRequest<{ files?: Array<{ path?: string }>; file?: { path?: string } }>();
        const spooled = [...(req.files ?? []), ...(req.file ? [req.file] : [])];
        for (const file of spooled) {
          if (!file?.path) continue;
          try {
            fs.unlinkSync(file.path);
          } catch {
            // Best effort: the handler may already have moved or removed it.
          }
        }
        return throwError(() => err);
      }),
    );
  }
}
