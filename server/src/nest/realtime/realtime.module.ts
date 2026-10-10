import { RealtimeService } from './realtime.service';
import { Global, Module } from '@nestjs/common';

/**
 * Global so every migrated module can inject RealtimeService without
 * re-importing (same rationale as DatabaseModule). The service stays
 * stateless and dependency-free so the no-Nest test harnesses can build it
 * with a bare `new`.
 *
 * The transport itself lives in RealtimeGatewayModule, which AppModule imports
 * directly. It cannot live here: this module is @Global, so a gateway would
 * follow into every hand-assembled TestingModule and make Nest look for a
 * websocket adapter none of them set.
 */
@Global()
@Module({
  providers: [RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
