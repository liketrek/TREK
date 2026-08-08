import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesMcp } from './categories.mcp';
import { CategoriesService } from './categories.service';

/** Categories domain (L4 leaf module). Registered in AppModule. */
@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesMcp],
  // For in-container consumers (PluginHostDepsFactory).
  exports: [CategoriesService],
})
export class CategoriesModule {}
