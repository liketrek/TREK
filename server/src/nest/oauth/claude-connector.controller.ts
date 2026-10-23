import { ADDON_IDS } from '../../addons';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { ClaudeConnectorService } from './claude-connector.service';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { aiClaudeConnectorResponseSchema, type AiClaudeConnectorResponse } from '@trek/shared';

/**
 * /api/integrations/claude-connector — what the settings card needs to add
 * TREK to claude.ai as a custom connector. It follows the MCP addon (the
 * connector is the MCP endpoint), not the in-app assistant's addon.
 */
@Controller('api/integrations/claude-connector')
@UseGuards(AddonGuard, JwtAuthGuard)
@RequireAddon(ADDON_IDS.MCP, 'MCP')
export class ClaudeConnectorController {
  constructor(private readonly connector: ClaudeConnectorService) {}

  @Get()
  @ResponseContract(aiClaudeConnectorResponseSchema)
  async get(): Promise<AiClaudeConnectorResponse> {
    return await this.connector.describe();
  }
}
