import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { CategoriesController } from './categories.controller';
import { CategoriesMcp } from './categories.mcp';
import { CategoriesService } from './categories.service';
import { CategoriesRpc } from './categories.rpc';

/** Categories domain (L4 leaf module). Registered in AppModule. */
@Module({
  // CategoriesMcp gates its three admin tools on AuthService, and McpSharedModule
  // is deliberately not @Global, so both are imported rather than inherited.
  imports: [AuthModule, McpSharedModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesMcp, CategoriesRpc],
  // For in-container consumers (CategoriesRpc).
  exports: [CategoriesService],
})
export class CategoriesModule {}
