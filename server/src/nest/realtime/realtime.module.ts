import { Global, Module } from '@nestjs/common';
import { RealtimeService } from './realtime.service';

/**
 * Global so every migrated module can inject RealtimeService without
 * re-importing (same rationale as DatabaseModule). The service is
 * stateless and dependency-free — the ws server itself is still wired
 * in index.ts via setupWebSocket(); this module only provides the
 * injectable broadcast seam.
 */
@Global()
@Module({
  providers: [RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
