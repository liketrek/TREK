import { Injectable, type OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { isPluginController } from './metadata';
import { PluginRpcRegistry } from './registry';

/**
 * DI-discovered registry: at boot, scans every PROVIDER marked with
 * `@PluginController()` and records its decorated methods.
 *
 * `getControllers()` is deliberately not scanned. @PluginController implies
 * @Injectable(), which rewrites the scope metadata @Controller() sets, so the
 * decorator belongs on provider classes only and register() rejects the rest.
 */
@Injectable()
export class PluginRpcRegistryService extends PluginRpcRegistry implements OnModuleInit {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
  ) {
    // Flipped to true in the closing PR of the rollout, once the legacy router map
    // in rpc-host.ts is empty and every KNOWN_METHOD has a decorated owner.
    super({ requireTotalCoverage: false });
  }

  onModuleInit(): void {
    // A provider can be wrapped once per module that lists it, so dedupe by instance
    // or every entry is recorded twice and the duplicate check fires spuriously.
    const seen = new Set<object>();
    for (const wrapper of this.discovery.getProviders()) {
      const { instance, metatype } = wrapper;
      if (!instance || typeof instance !== 'object' || seen.has(instance)) continue;
      if (!isPluginController(metatype)) continue;
      seen.add(instance);
      this.register(instance, this.scanner.getAllMethodNames(Object.getPrototypeOf(instance)));
    }
    // Fail app boot on a wrong decorator argument or a double-owned method rather
    // than failing per-plugin at activation time.
    this.validate();
  }
}
