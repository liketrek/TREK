import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

/**
 * Foundation smoke endpoint for the co-hosted NestJS app.
 * Proves: (1) Nest boots inside the Express process, (2) routes register,
 * (3) type-based DI resolves HealthService.
 *
 * Lives under /api/_nest/* so it never collides with the legacy Express API.
 */
@Controller('api/_nest')
export class HealthController {
  // Type-based injection — only resolves when the runtime emits decorator metadata.
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  getHealth() {
    return { ok: true, ...this.healthService.info() };
  }
}
