import { McpRegistryService } from './mcp-registry.service';
import { MCP_MODULE_OPTIONS, type McpModuleOptions } from './types';
import { Module, type DynamicModule } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

@Module({})
export class McpModule {
  /**
   * Registers the discovery-backed `McpRegistryService` globally. The
   * `accessPolicy` resolves every declarative `access: { group, mode }`
   * marker — the package itself defines no scope semantics.
   */
  static forRoot(options: McpModuleOptions = {}): DynamicModule {
    return {
      module: McpModule,
      global: true,
      imports: [DiscoveryModule],
      providers: [{ provide: MCP_MODULE_OPTIONS, useValue: options }, McpRegistryService],
      exports: [McpRegistryService],
    };
  }
}
