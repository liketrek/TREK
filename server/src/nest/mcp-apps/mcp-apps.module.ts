import { AddonsModule } from '../addons/addons.module';
import { SettingsModule } from '../settings/settings.module';
import { MCP_APPS_DEFAULT_DIR, MCP_APPS_DIR } from './mcp-apps.constants';
import { McpAppsMcp } from './mcp-apps.mcp';
import { McpAppsService } from './mcp-apps.service';
import { Module } from '@nestjs/common';

/**
 * The interactive MCP views (MCP Apps): their `ui://` resources and the switch
 * they answer to. SettingsModule for the map view's tiles, which follow the
 * user's own tile setting.
 */
@Module({
  imports: [AddonsModule, SettingsModule],
  providers: [McpAppsService, McpAppsMcp, { provide: MCP_APPS_DIR, useValue: MCP_APPS_DEFAULT_DIR }],
  exports: [McpAppsService],
})
export class McpAppsModule {}
