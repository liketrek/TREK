import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import type { User } from '../../types';
import { HealthService } from './health.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

// Local demo schema (real domains import their schema from @trek/shared).
const echoSchema = z.object({ name: z.string().min(1) });

/**
 * Foundation smoke endpoints for the co-hosted NestJS app.
 * Proves: boot, routing, type-based DI, the shared SQLite connection, the
 * JWT-cookie auth guard, and the Zod validation pipe + error-envelope parity.
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

  /** Validated: proves the Zod pipe (400 + { error } on failure) and body parsing. */
  @Post('echo')
  @UseGuards(JwtAuthGuard)
  echo(@Body(new ZodValidationPipe(echoSchema)) body: z.infer<typeof echoSchema>) {
    return { youSent: body };
  }
}
