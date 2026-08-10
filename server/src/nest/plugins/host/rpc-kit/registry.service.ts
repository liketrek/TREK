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
    // The rollout is done: the legacy router map is gone, every KNOWN_METHOD has a
    // decorated owner and every hook has a host-side consumer. Boot now FAILS on a
    // gap rather than letting it surface as a runtime PERMISSION_DENIED, or as a
    // hook:* grant on the consent screen that nothing behind it ever calls.
    super({ requireTotalCoverage: true });
  }

  onModuleInit(): void {
    this.scanProviders();
    // Fail app boot on a wrong decorator argument, a double-owned method or a gap in
    // the surface, rather than failing per-plugin at activation time.
    this.validate();
  }

  /**
   * Records every `@PluginController()` provider the container knows about.
   *
   * Separate from validate() because the two answer different questions: this one is
   * about discovery (which providers were found, and once each), validate() is about
   * the surface being complete and correctly declared. Keeping them apart lets the
   * discovery behaviour be tested without assembling all 113 methods first.
   */
  scanProviders(): void {
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
  }
}
