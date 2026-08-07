import { Module } from '@nestjs/common';
import { QueryHelpersService } from './query-helpers.service';

/** Shared batch loaders for the list endpoints. No controller or MCP surface of
 *  its own — assignments, days, places and share import it for the loaders.
 *  Deliberately NOT @Global so e2e TestingModules resolve it transitively
 *  through each consumer's explicit import, same as PermissionsModule. */
@Module({
  providers: [QueryHelpersService],
  exports: [QueryHelpersService],
})
export class QueryHelpersModule {}
