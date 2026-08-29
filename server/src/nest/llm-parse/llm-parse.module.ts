import { AddonsModule } from '../addons/addons.module';
import { AppConfigModule } from '../app-config/app-config.module';
import { SettingsModule } from '../settings/settings.module';
import { LlmConfigResolver } from './llm-config.resolver';
import { LlmLocalController } from './llm-local.controller';
import { LlmLocalService } from './llm-local.service';
import { LlmParseService } from './llm-parse.service';
import { Module } from '@nestjs/common';

/**
 * Provides the LLM booking-import fallback; imported by BookingImportModule.
 * Exports LlmConfigResolver for the plugin host surface (HostSurfaceRpc).
 */
@Module({
  imports: [AppConfigModule, SettingsModule, AddonsModule],
  controllers: [LlmLocalController],
  providers: [LlmParseService, LlmLocalService, LlmConfigResolver],
  exports: [LlmParseService, LlmConfigResolver],
})
export class LlmParseModule {}
