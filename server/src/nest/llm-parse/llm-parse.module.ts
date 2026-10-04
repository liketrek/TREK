import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { LlmParseService } from './llm-parse.service';
import { LlmLocalService } from './llm-local.service';
import { LlmLocalController } from './llm-local.controller';
import { LlmCapabilitiesController } from './llm-capabilities.controller';
import { LlmConfigResolver } from './llm-config.resolver';
import { SettingsModule } from '../settings/settings.module';
import { AddonsModule } from '../addons/addons.module';
import { AppConfigModule } from '../app-config/app-config.module';
import { Addons } from '../../db/entities/Addons.entity';

/**
 * Provides the LLM booking-import fallback; imported by BookingImportModule.
 * Exports LlmConfigResolver for the plugin host surface (HostSurfaceRpc).
 *
 * MikroOrmModule.forFeature([Addons]): Plan 4 Task 1 —
 * `LlmConfigResolver.readInstanceConfig`'s own `AddonsRepository`
 * `@InjectRepository` param. `AddonsModule` already registers `Addons` for
 * its own `AddonsService`, but does not export `MikroOrmModule` from its own
 * `exports` list, so this module needs its own `forFeature` registration —
 * the same leaf-module pattern `public-api.module.ts` documents.
 */
@Module({
  imports: [AppConfigModule, SettingsModule, AddonsModule, MikroOrmModule.forFeature([Addons])],
  controllers: [LlmLocalController, LlmCapabilitiesController],
  providers: [LlmParseService, LlmLocalService, LlmConfigResolver],
  exports: [LlmParseService, LlmConfigResolver],
})
export class LlmParseModule {}
