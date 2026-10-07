import { Trips } from '../../db/entities/Trips.entity';
import { Users } from '../../db/entities/Users.entity';
import { PermissionsModule } from '../permissions/permissions.module';
import { McpToolGuardsService } from './mcp-tool-guards.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Shared guards for the @McpController domain classes. Deliberately NOT
 * @Global (the addons/permissions precedent): every consumer imports it
 * explicitly, so e2e TestingModules resolve it transitively and the module
 * graph stays honest. Database/Realtime come from their @Global modules.
 *
 * Trips/Users: Plan 4 Task 1 — `McpToolGuardsService.hasTripPermission`/
 * `isAdminUser`'s own `TripsRepository.getOwnerId`/`UsersRepository.getRole`
 * reads, moved off `DatabaseService`.
 */
@Module({
  imports: [PermissionsModule, MikroOrmModule.forFeature([Trips, Users])],
  providers: [McpToolGuardsService],
  exports: [McpToolGuardsService],
})
export class McpSharedModule {}
