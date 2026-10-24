import { Tags } from '../../db/entities/Tags.entity';
import { RealtimeModule } from '../realtime/realtime.module';
import { TagWritesService } from './tag-writes.service';
import { TagsController } from './tags.controller';
import { TagsMcp } from './tags.mcp';
import { TagsRpc } from './tags.rpc';
import { TagsService } from './tags.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Tags domain (L5 leaf module). Registered in AppModule.
 *
 * MikroOrmModule.forFeature registers TagsRepository for
 * @InjectRepository(Tags) in the service — the forFeature +
 * @InjectRepository wiring pattern every domain copies (settings.module.ts's
 * precedent comment).
 */
@Module({
  // RealtimeModule for TagWritesService, which tells a user's other tabs that their tags changed.
  imports: [RealtimeModule, MikroOrmModule.forFeature([Tags])],
  controllers: [TagsController],
  // TagsRpc must stay in providers: the plugin RPC registry discovers marked
  // PROVIDERS only, and a missing entry here would leave tags.* answering
  // PERMISSION_DENIED with no other symptom.
  providers: [TagsService, TagWritesService, TagsMcp, TagsRpc],
  // For in-container consumers (TagsRpc).
  exports: [TagsService],
})
export class TagsModule {}
