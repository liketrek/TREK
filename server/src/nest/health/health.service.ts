import { Injectable } from '@nestjs/common';

/**
 * Trivial service used to prove that NestJS dependency injection works under
 * the chosen runtime (SWC dev / tsc build). If DI fails, `info()` is never
 * reached because the controller cannot be constructed.
 */
@Injectable()
export class HealthService {
  info() {
    return { runtime: 'nestjs', diInjected: true };
  }
}
