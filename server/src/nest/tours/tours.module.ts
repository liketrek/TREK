import { Places } from '../../db/entities/Places.entity';
import { TourWaypoints } from '../../db/entities/TourWaypoints.entity';
import { Tours } from '../../db/entities/Tours.entity';
import { AddonsModule } from '../addons/addons.module';
import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PlacesModule } from '../places/places.module';
import { ToursImportController } from './tours-import.controller';
import { ToursController } from './tours.controller';
import { ToursService } from './tours.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Tours domain: an isolated bounded context that imports PlacesModule to reuse
 * GPX preparation and persistence through PlacesService. The tour SQL lives in
 * the Tours and TourWaypoints repositories; the owning place's route columns go
 * through PlacesRepository, registered here because forFeature only reaches
 * this module's own providers.
 */
@Module({
  imports: [
    PlacesModule,
    PermissionsModule,
    AuthModule,
    AddonsModule,
    MikroOrmModule.forFeature([Tours, TourWaypoints, Places]),
  ],
  controllers: [ToursController, ToursImportController],
  providers: [ToursService],
})
export class ToursModule {}
