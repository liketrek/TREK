import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

/** Cross-cutting permissions domain (Wave 2). No controller/MCP surface of its
 *  own — the admin HTTP surface stays with AdminModule. Exports
 *  PermissionsService for the 17 in-container consumers; deliberately NOT
 *  @Global so e2e TestingModules resolve it transitively through each
 *  consumer's explicit import. Registered in AppModule. */
@Module({
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
