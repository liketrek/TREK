import { Tags } from '../../db/entities/Tags.entity';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { TagWritesService } from './tag-writes.service';
import { TagsController } from './tags.controller';
import { TagsMcp } from './tags.mcp';
import { TagsRpc } from './tags.rpc';
import { TagsService } from './tags.service';
import { TripTagsController } from './trip-tags.controller';
import { TripTagsMcp } from './trip-tags.mcp';
import { TripTagsService } from './trip-tags.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Tags domain (L5 leaf module). Registered in AppModule.
 *
 * MikroOrmModule.forFeature registers TagsRepository for
 * @InjectRepository(Tags) in the service — the forFeature +
 * @InjectRepository wiring pattern every domain copies (settings.module.ts's
 * precedent comment).
 *
 * Two surfaces over the one table: a user's personal tags (TagsController,
 * TagsMcp, TagsRpc) and the tags a trip owns (TripTagsController, TripTagsMcp),
 * which take the trip's access and `place_edit` instead of an owner.
 */
@Module({
  // RealtimeModule for the two write services, which tell the other tabs that the tags changed;
  // TripMembershipModule and PermissionsModule for the trip gate, McpSharedModule for the tools' writer.
  imports: [
    RealtimeModule,
    TripMembershipModule,
    PermissionsModule,
    McpSharedModule,
    MikroOrmModule.forFeature([Tags]),
  ],
  controllers: [TagsController, TripTagsController],
  // TagsRpc must stay in providers: the plugin RPC registry discovers marked
  // PROVIDERS only, and a missing entry here would leave tags.* answering
  // PERMISSION_DENIED with no other symptom.
  providers: [TagsService, TagWritesService, TripTagsService, TagsMcp, TripTagsMcp, TagsRpc],
  // For in-container consumers (TagsRpc).
  exports: [TagsService],
})
export class TagsModule {}
