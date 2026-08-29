import { AddonsModule } from '../addons/addons.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { OauthModule } from '../oauth/oauth.module';
import { TokensModule } from '../tokens/tokens.module';
import { McpTransportController } from './mcp-transport.controller';
import { McpTransportService } from './mcp-transport.service';
import { Module } from '@nestjs/common';

/**
 * The /mcp transport endpoint — the OAuth 2.1-authenticated MCP server the
 * assistants speak to. The tools/resources/prompts themselves stay decorator-
 * registered on the domain modules and are attached per session through the
 * (global) McpRegistryService; this module owns only transport concerns:
 * bearer verification, session create/resume, rate limiting, SSE keep-alive.
 */
@Module({
  imports: [AuthModule, TokensModule, OauthModule, AddonsModule, AuditModule],
  controllers: [McpTransportController],
  providers: [McpTransportService],
})
export class McpTransportModule {}
