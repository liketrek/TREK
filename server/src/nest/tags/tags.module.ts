import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsMcp } from './tags.mcp';
import { TagsService } from './tags.service';
import { AuthModule } from '../auth/auth.module';

/** Tags domain (L5 leaf module). Registered in AppModule. */
@Module({
  imports: [AuthModule],
  controllers: [TagsController],
  providers: [TagsService, TagsMcp],
  // For in-container consumers (PluginHostDepsFactory).
  exports: [TagsService],
})
export class TagsModule {}
