import { HelpController } from './help.controller';
import { Module } from '@nestjs/common';

/** /api/help — the bundled `wiki/` directory, read via ./wiki. */
@Module({
  controllers: [HelpController],
})
export class HelpModule {}
