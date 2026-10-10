import { Global, Module } from '@nestjs/common';
import { JOURNEY_ACCESS } from '../realtime/journey-access.types';
import { JourneyDomainModule } from './journey-domain.module';
import { JourneyDomainService } from './journey-domain.service';

/**
 * Binds the realtime gateway's JOURNEY_ACCESS port to JourneyDomainService.
 * Global so RealtimeGatewayModule resolves it without importing the journey
 * domain; AppModule imports it next to the gateway module.
 */
@Global()
@Module({
  imports: [JourneyDomainModule],
  providers: [{ provide: JOURNEY_ACCESS, useExisting: JourneyDomainService }],
  exports: [JOURNEY_ACCESS],
})
export class JourneyAccessModule {}
