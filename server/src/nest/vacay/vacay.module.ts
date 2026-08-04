import { Module } from '@nestjs/common';
import { VacayController } from './vacay.controller';
import { VacayService } from './vacay.service';
import { VacayMcp } from './vacay.mcp';
import { AuthModule } from '../auth/auth.module';

/**
 * Vacay addon domain (S1 — Phase 2 trip sub-domain). Registered in AppModule.
 * VacayService is exported for the plugin host wiring (PluginHostDepsFactory);
 * VacayMcp carries the DI-discovered MCP tools/resources.
 */
@Module({
  imports: [AuthModule],
  controllers: [VacayController],
  providers: [VacayService, VacayMcp],
  exports: [VacayService],
})
export class VacayModule {}
