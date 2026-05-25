import { Controller, Get, UseGuards } from '@nestjs/common';
import type { User } from '../../types';
import { HealthService } from './health.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

/**
 * Foundation smoke endpoints for the co-hosted NestJS app.
 * Proves: Nest boots, routes register, type-based DI, the shared SQLite
 * connection, and the JWT-cookie auth guard.
 *
 * Lives under /api/_nest/* so it never collides with the legacy Express API.
 */
@Controller('api/_nest')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  getHealth() {
    return { ok: true, ...this.healthService.info() };
  }

  /** Guarded: returns the authenticated user, proving JwtAuthGuard + @CurrentUser. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return user;
  }
}
