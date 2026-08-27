import { Module } from '@nestjs/common';
import { PublicApiController } from './public-api.controller';
import { PublicApiService } from './public-api.service';
import { ApiTokenGuard } from './api-token.guard';
import { TokensModule } from '../tokens/tokens.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { RateLimitModule } from '../common/rate-limit.module';

/**
 * Public API v1 — the versioned read-only surface for third-party integrations.
 *
 * Imports rather than re-implements: token verification comes from TokensModule,
 * trip access from TripMembershipModule and DatabaseService. This module owns the
 * payload shaping and nothing else, so there is no second place where "who may read
 * this trip" is decided.
 */
@Module({
  imports: [TokensModule, TripMembershipModule, RateLimitModule],
  controllers: [PublicApiController],
  providers: [PublicApiService, ApiTokenGuard],
})
export class PublicApiModule {}
