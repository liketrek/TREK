import { Module } from '@nestjs/common';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { CollectionsAddonGuard } from './collections-addon.guard';

@Module({
  controllers: [CollectionsController],
  providers: [CollectionsService, CollectionsAddonGuard],
})
export class CollectionsModule {}
