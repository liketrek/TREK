import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Mirrors the legacy `adminOnly` middleware: requires an authenticated admin.
 * Use together with JwtAuthGuard (which populates req.user):
 * `@UseGuards(JwtAuthGuard, AdminGuard)`.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (!req.user || req.user.role !== 'admin') {
      throw new HttpException({ error: 'Admin access required' }, 403);
    }
    return true;
  }
}
