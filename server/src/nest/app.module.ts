import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { WeatherModule } from './weather/weather.module';
import { AirportsModule } from './airports/airports.module';
import { ConfigModule } from './config/config.module';
import { SystemNoticesModule } from './system-notices/system-notices.module';
import { MapsModule } from './maps/maps.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AtlasModule } from './atlas/atlas.module';
import { VacayModule } from './vacay/vacay.module';
import { PackingModule } from './packing/packing.module';
import { BudgetModule } from './budget/budget.module';
import { ReservationsModule } from './reservations/reservations.module';
import { DaysModule } from './days/days.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { PlacesModule } from './places/places.module';
import { TripsModule } from './trips/trips.module';
import { TodoModule } from './todo/todo.module';
import { CollabModule } from './collab/collab.module';
import { FilesModule } from './files/files.module';
import { PhotosModule } from './photos/photos.module';
import { MemoriesModule } from './memories/memories.module';
import { AirtrailModule } from './integrations/airtrail.module';
import { JourneyModule } from './journey/journey.module';
import { ShareModule } from './share/share.module';
import { SettingsModule } from './settings/settings.module';
import { BackupModule } from './backup/backup.module';
import { BookingImportModule } from './booking-import/booking-import.module';
import { AuthModule } from './auth/auth.module';
import { OidcModule } from './oidc/oidc.module';
import { OauthModule } from './oauth/oauth.module';
import { AdminModule } from './admin/admin.module';
import { AddonsModule } from './addons/addons.module';
import { TrekExceptionFilter } from './common/trek-exception.filter';
import { SpaFallbackFilter } from './platform/spa-fallback.filter';
import { IdempotencyInterceptor } from './common/idempotency.interceptor';

/**
 * Root NestJS module for the incremental migration. Domain modules
 * (weather, notifications, integrations, ...) get registered here as they are
 * migrated.
 */
@Module({
  imports: [DatabaseModule, WeatherModule, AirportsModule, ConfigModule, SystemNoticesModule, MapsModule, CategoriesModule, TagsModule, NotificationsModule, AtlasModule, VacayModule, PackingModule, TodoModule, BudgetModule, ReservationsModule, DaysModule, AssignmentsModule, PlacesModule, TripsModule, CollabModule, FilesModule, PhotosModule, MemoriesModule, AirtrailModule, JourneyModule, ShareModule, SettingsModule, BackupModule, AuthModule, OidcModule, OauthModule, AdminModule, AddonsModule, BookingImportModule],
  controllers: [HealthController],
  providers: [
    HealthService,
    // Global error-envelope normaliser (DI-registered so it also catches
    // framework-level exceptions like the not-found handler).
    { provide: APP_FILTER, useClass: TrekExceptionFilter },
    // SPA fallback: serves index.html for unmatched GETs in production (the Nest
    // equivalent of the legacy Express app.get('*') catch-all). @Catch(NotFoundException)
    // is more specific than TrekExceptionFilter, so Nest routes 404s here.
    { provide: APP_FILTER, useClass: SpaFallbackFilter },
    // Replays the X-Idempotency-Key the client sends on every write, matching
    // the legacy applyIdempotency middleware so retried mutations don't double-apply.
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
  ],
})
export class AppModule {}
