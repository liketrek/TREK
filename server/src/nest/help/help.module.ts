import { HelpController } from './help.controller';
import { HelpMcp } from './help.mcp';
import { Module } from '@nestjs/common';

/**
 * /api/help serves the bundled `wiki/` directory, read via ./wiki. HelpMcp puts the
 * same index and page reads on the MCP surface, plus the reference of every tool
 * that moved it out of tools/list, read from the global McpRegistryService.
 */
@Module({
  controllers: [HelpController],
  providers: [HelpMcp],
})
export class HelpModule {}
