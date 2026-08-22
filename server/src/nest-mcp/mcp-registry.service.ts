import { isMcpController } from './metadata';
import { McpRegistry } from './registry';
import { MCP_MODULE_OPTIONS, type McpModuleOptions } from './types';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';

/**
 * DI-discovered registry: at boot, scans every provider marked with
 * `@McpController()` and records its decorated methods. Attach it to a
 * per-session `McpServer` with `attach(server, ctx)`.
 */
@Injectable()
export class McpRegistryService extends McpRegistry implements OnModuleInit {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
    @Inject(MCP_MODULE_OPTIONS) options: McpModuleOptions,
  ) {
    super(options);
  }

  onModuleInit(): void {
    // A provider can be wrapped once per module that lists it — dedupe by
    // instance so an entry is never recorded (and later registered) twice.
    const seen = new Set<object>();
    for (const wrapper of this.discovery.getProviders()) {
      const { instance, metatype } = wrapper;
      if (!instance || typeof instance !== 'object' || seen.has(instance)) continue;
      if (!isMcpController(metatype)) continue;
      seen.add(instance);
      this.register(instance, this.scanner.getAllMethodNames(Object.getPrototypeOf(instance)));
    }
    // Fail app boot on duplicate names / policy-less declarative access
    // instead of failing per-session at attach().
    this.validate();
  }
}
