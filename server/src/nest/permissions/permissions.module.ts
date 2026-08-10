import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { TripAccessGuard } from './trip-access.guard';
import { TripOwnerGuard } from './trip-owner.guard';

/** Cross-cutting permissions domain (Wave 2). No controller/MCP surface of its
 *  own — the admin HTTP surface stays with AdminModule. Exports
 *  PermissionsService for the 17 in-container consumers and TripAccessGuard/TripOwnerGuard
 *  for every trip-scoped controller; deliberately NOT @Global so e2e TestingModules
 *  resolve it transitively through each consumer's explicit import. Registered in
 *  AppModule. */
@Module({
  providers: [PermissionsService, TripAccessGuard, TripOwnerGuard],
  exports: [PermissionsService, TripAccessGuard, TripOwnerGuard],
})
export class PermissionsModule {}
