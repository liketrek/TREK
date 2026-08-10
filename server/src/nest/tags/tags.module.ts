import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsMcp } from './tags.mcp';
import { TagsRpc } from './tags.rpc';
import { TagsService } from './tags.service';
import { AuthModule } from '../auth/auth.module';

/** Tags domain (L5 leaf module). Registered in AppModule. */
@Module({
  imports: [AuthModule],
  controllers: [TagsController],
  // TagsRpc must stay in providers: the plugin RPC registry discovers marked
  // PROVIDERS only, and a missing entry here would leave tags.* answering
  // PERMISSION_DENIED with no other symptom.
  providers: [TagsService, TagsMcp, TagsRpc],
  // For in-container consumers (TagsRpc).
  exports: [TagsService],
})
export class TagsModule {}
