import { AiConnections } from '../../db/entities/AiConnections.entity';
import { AssistantUsage } from '../../db/entities/AssistantUsage.entity';
import { AddonsModule } from '../addons/addons.module';
import { AuditModule } from '../audit/audit.module';
import { RateLimitModule } from '../common/rate-limit.module';
import { LlmParseModule } from '../llm-parse/llm-parse.module';
import { SHARED_AI_CONNECTION } from '../llm-parse/shared-ai-connection.interface';
import { OidcModule } from '../oidc/oidc.module';
import { SettingsModule } from '../settings/settings.module';
import { AiAdminController } from './ai-admin.controller';
import { AiAuthFlowStore, InMemoryAiAuthFlowStore } from './ai-auth-flow.store';
import { AiChatClientService } from './ai-chat-client.service';
import { AiConnectionsController } from './ai-connections.controller';
import { AiConnectionsService } from './ai-connections.service';
import { AiRefreshLock, InMemoryAiRefreshLock } from './ai-refresh-lock';
import { AiSettingsService } from './ai-settings.service';
import { AiUsageService } from './ai-usage.service';
import { ChatgptAuthService } from './chatgpt-auth.service';
import { ModelCatalogService } from './model-catalog.service';
import { OpenrouterAuthService } from './openrouter-auth.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * The AI assistant's connections to a language model: the instance's and each
 * user's, the ChatGPT and OpenRouter sign-ins, the model lists, the usage
 * the daily limit counts, and the streaming chat clients the assistant talks
 * through. The assistant module imports it for AiConnectionsService,
 * AiChatClientService and AiUsageService.
 */
@Module({
  imports: [
    AddonsModule,
    AuditModule,
    LlmParseModule,
    OidcModule,
    RateLimitModule,
    SettingsModule,
    MikroOrmModule.forFeature([AiConnections, AssistantUsage]),
  ],
  controllers: [AiConnectionsController, AiAdminController],
  // The sign-ins in progress and the refresh lock stay in this process's
  // memory; stores shared between processes would be provided here instead.
  providers: [
    AiConnectionsService,
    AiSettingsService,
    AiUsageService,
    AiChatClientService,
    ChatgptAuthService,
    OpenrouterAuthService,
    ModelCatalogService,
    { provide: AiAuthFlowStore, useClass: InMemoryAiAuthFlowStore },
    // AI parsing reads with the same connection; see shared-ai-connection.interface.ts.
    { provide: SHARED_AI_CONNECTION, useExisting: AiConnectionsService },
    { provide: AiRefreshLock, useClass: InMemoryAiRefreshLock },
  ],
  exports: [AiConnectionsService, AiChatClientService, AiUsageService],
})
export class AiConnectionsModule {}
