import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';

/**
 * Root NestJS module for the incremental migration. Domain modules
 * (weather, notifications, ...) get registered here as they are migrated.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
