import { Module } from '@nestjs/common';
import { AddonsController } from './addons.controller';
import { AddonsService } from './addons.service';

/**
 * GET /api/addons — enabled add-ons + photo providers (was an inline handler in
 * server/src/app.ts). The addon sub-features (atlas, vacay) keep their own
 * modules; this only serves the EXACT /api/addons listing.
 */
@Module({
  controllers: [AddonsController],
  providers: [AddonsService],
})
export class AddonsModule {}
