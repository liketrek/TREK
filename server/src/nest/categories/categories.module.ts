import { Categories } from '../../db/entities/Categories.entity';
import { AppConfigModule } from '../app-config/app-config.module';
import { DemoModule } from '../common/demo.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { CategoriesController } from './categories.controller';
import { CategoriesMcp } from './categories.mcp';
import { CategoriesRpc } from './categories.rpc';
import { CategoriesService } from './categories.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/** Categories domain (L4 leaf module). Registered in AppModule. */
@Module({
  // AuthModule is deliberately absent: CategoriesMcp's demo guard reads
  // RuntimeEnvService and the users table rather than AuthService, which keeps
  // the partial e2e TestingModule for this domain down to two tables.
  // McpSharedModule is not @Global, and AppConfigModule is imported explicitly
  // for the same reason budget/ does it. MikroOrmModule.forFeature registers
  // CategoriesRepository for @InjectRepository(Categories) in the service —
  // the forFeature + @InjectRepository wiring pattern every domain copies
  // (settings.module.ts's precedent comment). DemoModule is imported for the
  // same reason: CategoriesMcp injects DemoService, and @Global only reaches a
  // hand-built e2e TestingModule that actually imports it (Plan 3i Task 4 fix wave).
  imports: [McpSharedModule, AppConfigModule, DemoModule, MikroOrmModule.forFeature([Categories])],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesMcp, CategoriesRpc],
  // For in-container consumers (CategoriesRpc).
  exports: [CategoriesService],
})
export class CategoriesModule {}
