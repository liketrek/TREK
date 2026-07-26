import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsMcp } from './tags.mcp';
import { TagsService } from './tags.service';

/** Tags domain (L5 leaf module). Registered in AppModule. */
@Module({
  controllers: [TagsController],
  providers: [TagsService, TagsMcp],
})
export class TagsModule {}
