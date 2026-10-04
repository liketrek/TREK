import { ArgumentsHost, Catch, ExceptionFilter, NotFoundException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { readEnv } from '../../app-config';
import { answerUnmatchedGet } from './platform.routes';

/**
 * Serves the built SPA (index.html) for any request the NestJS router did not
 * match — the production single-page-app fallback. This replaces the legacy
 * Express `app.get('*')` catch-all, which cannot run on the Nest instance: Nest's
 * router terminates an unmatched request by throwing NotFoundException (it never
 * falls through to a post-init Express route), so the SPA fallback has to live
 * inside the Nest pipeline as a NotFound filter instead.
 *
 * Behaviour matches the legacy catch-all exactly: in production, an unmatched GET
 * returns index.html; everything else (non-GET, or dev where there is no built
 * client) keeps the standard TREK `{ error }` 404 envelope. The `@Catch(NotFoundException)`
 * is more specific than the global TrekExceptionFilter, so Nest routes 404s here
 * while every other error still flows through TrekExceptionFilter.
 *
 * A GET for a build file that is not on disk (a chunk of the previous release,
 * say) is not a page and gets the 404 envelope too, never index.html (#2524).
 */
@Catch(NotFoundException)
export class SpaFallbackFilter implements ExceptionFilter {
  catch(exception: NotFoundException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    // Case-sensitive on purpose (legacy parity).
    if (readEnv().app.nodeEnv === 'production' && req.method === 'GET') {
      answerUnmatchedGet(req, res, exception.message || 'Not Found');
      return;
    }

    // Non-production, or a non-GET miss: keep the standard TREK 404 envelope
    // (identical to what TrekExceptionFilter produces for a NotFoundException).
    res.status(404).json({ error: exception.message || 'Not Found' });
  }
}
