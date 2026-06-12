import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

/** Tags domain (L5 leaf module). Registered in AppModule. */
@Module({
  controllers: [TagsController],
  providers: [TagsService],
})
export class TagsModule {}
