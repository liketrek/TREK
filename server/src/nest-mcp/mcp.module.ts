import { McpRegistryService } from './mcp-registry.service';
import { MCP_MODULE_OPTIONS, MCP_TOOL_GATE, type McpModuleOptions } from './types';
import { Module, type DynamicModule } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

@Module({})
export class McpModule {
  /**
   * Registers the discovery-backed `McpRegistryService` globally. The
   * `accessPolicy` resolves every declarative `access: { group, mode }`
   * marker — the package itself defines no scope semantics. `toolGate` is
   * built from the container, so the gate can inject what it needs.
   */
  static forRoot(options: McpModuleOptions = {}): DynamicModule {
    const gate = options.toolGate;
    return {
      module: McpModule,
      global: true,
      imports: [DiscoveryModule, ...(gate?.imports ?? [])],
      providers: [
        { provide: MCP_MODULE_OPTIONS, useValue: options },
        gate
          ? { provide: MCP_TOOL_GATE, useFactory: gate.useFactory, inject: gate.inject ?? [] }
          : { provide: MCP_TOOL_GATE, useValue: null },
        McpRegistryService,
      ],
      exports: [McpRegistryService],
    };
  }
}
