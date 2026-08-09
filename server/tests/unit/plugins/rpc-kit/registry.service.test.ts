/**
 * The DI-discovered registry. It scans providers only, dedupes by instance, and
 * validates at boot so a wrong decorator argument fails the app start rather than a
 * single plugin activation.
 */
import { describe, it, expect, vi } from 'vitest';
import type { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { PluginRpcRegistryService } from '../../../../src/nest/plugins/host/rpc-kit/registry.service';
import { PluginController, PluginMethod } from '../../../../src/nest/plugins/host/rpc-kit/decorators';

@PluginController()
class TagsRpc {
  @PluginMethod('tags.list', { permission: 'db:read:tags' })
  list() {
    return [];
  }
}

@PluginController()
class BadRpc {
  @PluginMethod('tags.create', { permission: 'db:read:tags' as 'db:write:tags' })
  create() {
    return {};
  }
}

class PlainProvider {
  helper() {
    return 1;
  }
}

/** Mimics Nest's provider wrappers, including the same instance listed twice. */
function serviceFor(instances: object[]): PluginRpcRegistryService {
  const discovery = {
    getProviders: () => instances.map((instance) => ({ instance, metatype: instance.constructor })),
  } as unknown as DiscoveryService;
  const scanner = {
    getAllMethodNames: (proto: object) =>
      Object.getOwnPropertyNames(proto).filter((n) => n !== 'constructor'),
  } as unknown as MetadataScanner;
  return new PluginRpcRegistryService(discovery, scanner);
}

describe('PluginRpcRegistryService', () => {
  it('RPCKIT-SVC-001 registers the marked providers at boot', () => {
    const service = serviceFor([new TagsRpc(), new PlainProvider()]);
    service.scanProviders();
    expect(service.methodNames()).toEqual(new Set(['tags.list']));
  });

  it('RPCKIT-SVC-002 the same instance wrapped twice is registered once', () => {
    const instance = new TagsRpc();
    const service = serviceFor([instance, instance]);
    service.scanProviders();
    // Without the dedupe this would be two entries and validate() would report
    // tags.list as double-owned.
    expect(service.list()).toHaveLength(1);
  });

  it('RPCKIT-SVC-003 unmarked providers are skipped rather than rejected', () => {
    const service = serviceFor([new PlainProvider()]);
    expect(() => service.scanProviders()).not.toThrow();
    expect(service.list()).toEqual([]);
  });

  it('RPCKIT-SVC-004 a null instance is skipped', () => {
    const discovery = {
      getProviders: () => [{ instance: null, metatype: TagsRpc }, { instance: undefined, metatype: TagsRpc }],
    } as unknown as DiscoveryService;
    const scanner = { getAllMethodNames: () => [] } as unknown as MetadataScanner;
    const service = new PluginRpcRegistryService(discovery, scanner);
    expect(() => service.scanProviders()).not.toThrow();
    expect(service.list()).toEqual([]);
  });

  it('RPCKIT-SVC-005 a wrong decorator argument fails the boot, not the first plugin call', () => {
    const service = serviceFor([new BadRpc()]);
    expect(() => service.onModuleInit()).toThrow(
      /method "tags.create" \(BadRpc.create\) declares "db:read:tags" but METHOD_PERMISSION says "db:write:tags"/,
    );
  });

  it('RPCKIT-SVC-006 boot fails when the surface is incomplete', () => {
    // The rollout is finished, so a decorated class that no module registers is no
    // longer a silent PERMISSION_DENIED at runtime: the app refuses to start, and the
    // message names the method that lost its owner.
    const service = serviceFor([new TagsRpc()]);
    expect(() => service.onModuleInit()).toThrow(/has no handler/);
  });

  it('RPCKIT-SVC-008 a hook nobody consumes fails boot too, so no grant is dead', () => {
    // A hook:* permission on the consent screen with nothing behind it looks exactly
    // like a live one to the user granting it.
    const service = serviceFor([new TagsRpc()]);
    expect(() => service.onModuleInit()).toThrow(/has no host-side consumer/);
  });

  it('RPCKIT-SVC-007 only providers are scanned, never controllers', () => {
    const getControllers = vi.fn(() => []);
    const discovery = {
      getProviders: () => [],
      getControllers,
    } as unknown as DiscoveryService;
    const scanner = { getAllMethodNames: () => [] } as unknown as MetadataScanner;
    new PluginRpcRegistryService(discovery, scanner).scanProviders();
    expect(getControllers).not.toHaveBeenCalled();
  });
});
