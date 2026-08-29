import { Injectable } from '@nestjs/common';
import type { NestMiddleware } from '@nestjs/common';

import type { Request, Response, NextFunction } from 'express';

/**
 * Helmet's COOP: same-origin isolates the consent popup from its cross-origin
 * opener (ChatGPT etc.), making window.opener null and breaking the OAuth flow —
 * so /oauth/consent relaxes it. Runs after helmet (Nest middleware registers
 * during init, helmet is pre-init) and simply overwrites the header, exactly
 * like the pre-init override it replaces.
 */
@Injectable()
export class ConsentCoopMiddleware implements NestMiddleware {
  use(_req: Request, res: Response, next: NextFunction): void {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    next();
  }
}
