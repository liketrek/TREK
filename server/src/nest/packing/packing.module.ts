import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PackingController } from './packing.controller';
import { AdminPackingTemplatesController } from './admin-packing-templates.controller';
import { PackingMcp } from './packing.mcp';
import { PackingService } from './packing.service';
import { PackingRpc } from './packing.rpc';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuditModule } from '../audit/audit.module';
import { AddonsModule } from '../addons/addons.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PackingItems } from '../../db/entities/PackingItems.entity';
import { PackingItemContributors } from '../../db/entities/PackingItemContributors.entity';
import { PackingBags } from '../../db/entities/PackingBags.entity';
import { PackingCategoryAssignees } from '../../db/entities/PackingCategoryAssignees.entity';
import { PackingTemplates } from '../../db/entities/PackingTemplates.entity';
import { PackingTemplateCategories } from '../../db/entities/PackingTemplateCategories.entity';
import { PackingTemplateItems } from '../../db/entities/PackingTemplateItems.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { TripMembers } from '../../db/entities/TripMembers.entity';

/** Packing domain (S2 — Phase 2 trip sub-domain). Registered in AppModule.
 *  Exports PackingService for in-container consumers (TripsService bundle,
 *  PackingRpc). */
@Module({
  imports: [
    // The nine packing-owned tables (Plan 3e Task 3) plus `Trips` (additive —
    // `PackingService.notifyTagged`'s PK91 `getTitle` read only, the same
    // "registered here only for one read, never the owning module" shape
    // `CollabModule`'s own forFeature list documents).
    MikroOrmModule.forFeature([PackingItems, PackingItemContributors, PackingBags, PackingCategoryAssignees, PackingTemplates, PackingTemplateCategories, PackingTemplateItems, Trips, TripMembers]),
    McpSharedModule, NotificationsModule, PermissionsModule, RealtimeModule, PluginGuardsModule, AddonsModule, AuditModule],
  controllers: [PackingController, AdminPackingTemplatesController],
  providers: [PackingService, PackingMcp, PackingRpc],
  exports: [PackingService],
})
export class PackingModule {}
