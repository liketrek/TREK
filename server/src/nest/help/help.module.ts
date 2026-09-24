import { Module } from '@nestjs/common';
import { HelpController } from './help.controller';
import { HelpMcp } from './help.mcp';

/**
 * /api/help serves the bundled `wiki/` directory, read via ./wiki. HelpMcp puts the
 * same index and page reads on the MCP surface; it injects nothing, so the
 * module stays a leaf.
 */
@Module({
  controllers: [HelpController],
  providers: [HelpMcp],
})
export class HelpModule {}
