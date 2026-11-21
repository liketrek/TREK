import { Addons } from '../../db/entities/Addons.entity';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import { PhotoProviderFields } from '../../db/entities/PhotoProviderFields.entity';
import { PhotoProviders } from '../../db/entities/PhotoProviders.entity';
import { TripAddonOverrides } from '../../db/entities/TripAddonOverrides.entity';
import { Users } from '../../db/entities/Users.entity';
import { PermissionsModule } from '../permissions/permissions.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { AddonGuard } from './addon.guard';
import { AddonsController } from './addons.controller';
import { AddonsMcp } from './addons.mcp';
import { AddonsService } from './addons.service';
import { TripAddonGuard } from './trip-addon.guard';
import { TripAddonsController } from './trip-addons.controller';
import { TripAddonsMcp } from './trip-addons.mcp';
import { TripAddonsService } from './trip-addons.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * GET /api/addons — enabled add-ons + photo providers (was an inline handler in
 * server/src/app.ts). The addon sub-features (atlas, vacay) keep their own
 * modules; this only serves the EXACT /api/addons listing.
 *
 * Exports AddonsService — the owner of addon/feature-flag enablement reads
 * (isAddonEnabled + bag-tracking/collab-features flags, extracted from
 * adminService per finding `admin-1`) — for the in-container consumers.
 * Deliberately NOT @Global (permissions precedent): e2e TestingModules resolve
 * it transitively through each consumer's explicit import.
 *
 * AddonsMcp puts the same listing on the MCP surface, so a model can read which
 * add-ons this instance has switched on instead of guessing from the tools it
 * was handed.
 *
 * MikroOrmModule.forFeature registers AddonsRepository/PhotoProvidersRepository/
 * PhotoProviderFieldsRepository/AppSettingsRepository for AddonsService's
 * @InjectRepository constructor (Plan 3a Task 4) — the forFeature +
 * @InjectRepository wiring pattern Task 0 set up on SettingsModule. `Users` was
 * added by Task 5: `googleKeySource` passes `UsersRepository` explicitly to
 * `instance-api-keys.ts`'s resolveApiKey now, instead of that file resolving
 * one off the ambient request context.
 *
 * TripAddonsService answers whether a trip addon applies to one trip (the
 * owner's override, else the instance switch) and owns the per-trip overrides
 * behind GET/PUT /api/trips/:tripId/addons and their MCP tools. It asks
 * TripMembershipModule, a leaf, whether the caller may see the trip; its
 * routes take TripAccessGuard and TripOwnerGuard from PermissionsModule, and
 * RealtimeModule is named so a hand-built test module that imports this one
 * resolves the broadcast without listing it.
 *
 * TripAddonGuard is the trip-scoped twin of AddonGuard: it answers @RequireAddon
 * with AddonsService.isEnabledForTrip after TripAccessGuard parked the trip.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([Addons, PhotoProviders, PhotoProviderFields, AppSettings, Users, TripAddonOverrides]),
    PermissionsModule,
    RealtimeModule,
    TripMembershipModule,
  ],
  controllers: [AddonsController, TripAddonsController],
  providers: [AddonsService, AddonGuard, TripAddonGuard, AddonsMcp, TripAddonsService, TripAddonsMcp],
  exports: [AddonsService, AddonGuard, TripAddonGuard, TripAddonsService],
})
export class AddonsModule {}
