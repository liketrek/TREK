import { Module } from '@nestjs/common';
import { TransitController } from './transit.controller';
import { RateLimitService } from '../auth/rate-limit.service';

@Module({
  controllers: [TransitController],
  providers: [RateLimitService],
})
export class TransitModule {}
