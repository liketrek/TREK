import { Module } from '@nestjs/common';
import { CollabController } from './collab.controller';
import { CollabService } from './collab.service';

@Module({
  controllers: [CollabController],
  providers: [CollabService],
})
export class CollabModule {}
