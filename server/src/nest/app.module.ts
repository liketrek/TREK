import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { WeatherModule } from './weather/weather.module';
import { TrekExceptionFilter } from './common/trek-exception.filter';

/**
 * Root NestJS module for the incremental migration. Domain modules
 * (weather, notifications, ...) get registered here as they are migrated.
 */
@Module({
  imports: [DatabaseModule, WeatherModule],
  controllers: [HealthController],
  providers: [
    HealthService,
    // Global error-envelope normaliser (DI-registered so it also catches
    // framework-level exceptions like the not-found handler).
    { provide: APP_FILTER, useClass: TrekExceptionFilter },
  ],
})
export class AppModule {}
