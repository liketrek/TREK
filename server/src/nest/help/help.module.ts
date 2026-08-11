import { Module } from '@nestjs/common';
import { HelpController } from './help.controller';

/** /api/help — the bundled `wiki/` directory, read via wikiService. */
@Module({
  controllers: [HelpController],
})
export class HelpModule {}
