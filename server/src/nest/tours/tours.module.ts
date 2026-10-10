import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Places } from '../../db/entities/Places.entity';
import { Tours } from '../../db/entities/Tours.entity';
import { TourTypes } from '../../db/entities/TourTypes.entity';
import { TourWaypoints } from '../../db/entities/TourWaypoints.entity';
import { ToursController } from './tours.controller';
import { ToursImportController } from './tours-import.controller';
import { ToursService } from './tours.service';
import { PlacesModule } from '../places/places.module';
import { PlaceImportModule } from '../place-import/place-import.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AddonsModule } from '../addons/addons.module';

/**
 * Tours domain: an isolated bounded context that reads GPX through PlaceImportModule and
 * persists the places through PlacesService (PlacesModule). The tour SQL lives in
 * the Tours and TourWaypoints repositories; the owning place's route columns go
 * through PlacesRepository, registered here because forFeature only reaches
 * this module's own providers.
 */
@Module({
  imports: [
    PlacesModule,
    PlaceImportModule,
    PermissionsModule,
    
    AddonsModule,
    MikroOrmModule.forFeature([Tours, TourTypes, TourWaypoints, Places]),
  ],
  controllers: [ToursController, ToursImportController],
  providers: [ToursService],
})
export class ToursModule {}
