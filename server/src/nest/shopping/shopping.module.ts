import { Module } from '@nestjs/common';
import { ShoppingController } from './shopping.controller';
import { ShoppingMcp } from './shopping.mcp';
import { ShoppingService } from './shopping.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';
import { AddonsModule } from '../addons/addons.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';

@Module({
  imports: [McpSharedModule, PermissionsModule, AuthModule, RealtimeModule, AddonsModule],
  controllers: [ShoppingController],
  providers: [ShoppingService, ShoppingMcp],
  exports: [ShoppingService],
})
export class ShoppingModule {}
