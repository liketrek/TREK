import { PermissionsModule } from '../permissions/permissions.module';
import { McpToolGuardsService } from './mcp-tool-guards.service';
import { Module } from '@nestjs/common';

/**
 * Shared guards for the @McpController domain classes. Deliberately NOT
 * @Global (the addons/permissions precedent): every consumer imports it
 * explicitly, so e2e TestingModules resolve it transitively and the module
 * graph stays honest. Database/Realtime come from their @Global modules.
 */
@Module({
  imports: [PermissionsModule],
  providers: [McpToolGuardsService],
  exports: [McpToolGuardsService],
})
export class McpSharedModule {}
