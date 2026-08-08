import { Module } from '@nestjs/common';
import { AddonsController } from './addons.controller';
import { AddonsService } from './addons.service';
import { AddonGuard } from './addon.guard';

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
 */
@Module({
  controllers: [AddonsController],
  providers: [AddonsService, AddonGuard],
  exports: [AddonsService, AddonGuard],
})
export class AddonsModule {}
