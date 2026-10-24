import { BudgetItems } from '../../db/entities/BudgetItems.entity';
import { Categories } from '../../db/entities/Categories.entity';
import { CollabMessages } from '../../db/entities/CollabMessages.entity';
import { DayAssignments } from '../../db/entities/DayAssignments.entity';
import { DayNotes } from '../../db/entities/DayNotes.entity';
import { Days } from '../../db/entities/Days.entity';
import { PackingItems } from '../../db/entities/PackingItems.entity';
import { Places } from '../../db/entities/Places.entity';
import { Reservations } from '../../db/entities/Reservations.entity';
import { ShareTokens } from '../../db/entities/ShareTokens.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PlacePhotosModule } from '../place-photos/place-photos.module';
import { QueryHelpersModule } from '../query-helpers/query-helpers.module';
import { SettingsModule } from '../settings/settings.module';
import { StorageModule } from '../storage/storage.module';
import { TripShareController, SharedController } from './share.controller';
import { ShareMcp } from './share.mcp';
import { ShareService } from './share.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

// `MikroOrmModule.forFeature([Reservations, ...])` registers every repository
// `ShareService`'s `@InjectRepository` constructor params need (Plan 3d Task 4
// already registered `Reservations`; Plan 3h Task 6 adds `ShareTokens` — this
// file's own table — plus the nine cross-domain tables its public-share reads
// (SH7-9,11-16) touch, without importing each owning module: this file stays a
// leaf the way `PublicApiModule`'s own `Trips`-only `forFeature` already does
// for the same reason).
@Module({
  imports: [
    McpSharedModule,
    SettingsModule,
    PermissionsModule,
    QueryHelpersModule,
    PlacePhotosModule,
    StorageModule,
    MikroOrmModule.forFeature([
      Reservations,
      ShareTokens,
      Trips,
      Days,
      DayAssignments,
      DayNotes,
      Places,
      PackingItems,
      BudgetItems,
      Categories,
      CollabMessages,
    ]),
  ],
  controllers: [TripShareController, SharedController],
  providers: [ShareService, ShareMcp],
})
export class ShareModule {}
