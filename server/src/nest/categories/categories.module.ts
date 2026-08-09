import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesMcp } from './categories.mcp';
import { CategoriesService } from './categories.service';
import { CategoriesRpc } from './categories.rpc';

/** Categories domain (L4 leaf module). Registered in AppModule. */
@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesMcp, CategoriesRpc],
  // For in-container consumers (CategoriesRpc).
  exports: [CategoriesService],
})
export class CategoriesModule {}
