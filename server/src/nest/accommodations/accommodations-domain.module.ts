import { Module } from '@nestjs/common';
import { AccommodationsService } from './accommodations.service';
import { AssignmentsDomainModule } from '../assignments/assignments-domain.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { RealtimeModule } from '../realtime/realtime.module';

/**
 * The accommodations SERVICE, split from the controller/MCP/RPC surfaces (the
 * assignments-domain precedent). AccommodationsService itself never touches
 * PlacesService -- only AccommodationsMcp does, for the one tool that writes a
 * place and a stay together -- so the service can live in a module that stays
 * off the AccommodationsModule -> PlacesModule edge.
 *
 * That is what lets PlacesModule import this: deleting a place has to take the
 * nights booked at it with it, and the cascade behind a stay (its partner
 * booking, that booking's expense, the day stop it wrote) belongs in one place
 * rather than copied into the delete path.
 */
@Module({
  imports: [PermissionsModule, RealtimeModule, AssignmentsDomainModule],
  providers: [AccommodationsService],
  exports: [AccommodationsService],
})
export class AccommodationsDomainModule {}
