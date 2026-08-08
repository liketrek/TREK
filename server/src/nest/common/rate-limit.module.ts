import { Module } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';

/**
 * One module owning the limiter, imported by every consumer.
 *
 * It matters because the counters live in memory on the instance: declaring the
 * service in each consuming module's `providers` hands every one of them its own
 * map, so the same bucket name used from two modules would silently allow twice
 * the configured attempts. The buckets in use today happen not to overlap, which
 * is why nothing is broken — but it is one copy-pasted name away from being wrong.
 *
 * Deliberately not `@Global()`: the e2e suites build a container around a single
 * domain module, where a global that AppModule never pulled in simply isn't there.
 * An explicit import also states the dependency where it is actually used.
 */
@Module({
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class RateLimitModule {}
