/**
 * The coverage ledger: the anchor for the whole decorator rollout.
 *
 * Every wire method is owned by exactly one decorated *.rpc.ts class in the registry.
 * Both sets are derived by construction, so no list is maintained by hand and the test
 * cannot drift.
 *
 * The rollout is finished, so the legacy set is empty and the ledger's job flips from
 * "how far along is the move" to "nothing fell out of it": a method deleted without a
 * replacement, or a new *.rpc.ts class that no one listed in allRpcControllers().
 */
import { describe, it, expect } from 'vitest';
import { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import { createTestPluginRegistry } from '../../../src/nest/plugins/host/rpc-kit/testing';
import { PluginRpcRegistryService } from '../../../src/nest/plugins/host/rpc-kit/registry.service';
import {
  KNOWN_METHODS,
  KNOWN_PERMISSIONS,
  UNCONDITIONAL_METHODS,
} from '../../../src/nest/plugins/protocol/envelope';
import { allRpcControllers, makeDeps } from '../../helpers/rpc-host-deps';

/** Reads the router's private dispatch map. That map IS the thing under test. */
const boundMethods = (host: PluginRpcHost): Set<string> =>
  new Set((host as unknown as { methods: Map<string, unknown> }).methods.keys());

describe('plugin RPC coverage ledger', () => {
  const registry = createTestPluginRegistry(allRpcControllers());
  // Every permission granted, so the router registers everything it can.
  const host = new PluginRpcHost('probe', new Set<string>(KNOWN_PERMISSIONS), makeDeps(), registry);
  const all = boundMethods(host);
  const fromRegistry = registry.methodNames();
  const vocabulary = new Set<string>([...KNOWN_METHODS, ...UNCONDITIONAL_METHODS]);

  it('RPCLEDGER-001 every bound method comes from the registry, none from anywhere else', () => {
    expect([...all].filter((m) => !fromRegistry.has(m))).toEqual([]);
  });

  it('RPCLEDGER-002 every registered method is one the wire protocol knows', () => {
    expect([...all].filter((m) => !vocabulary.has(m))).toEqual([]);
  });

  it('RPCLEDGER-003 no method in the vocabulary is orphaned', () => {
    expect([...vocabulary].filter((m) => !all.has(m))).toEqual([]);
  });

  it('RPCLEDGER-004 the registry covers the vocabulary exactly', () => {
    expect(all).toEqual(vocabulary);
    expect(fromRegistry.size).toBe(KNOWN_METHODS.length + UNCONDITIONAL_METHODS.length);
  });

  it('RPCLEDGER-005 the surface is the 114 methods the protocol declares', () => {
    // Pinned rather than derived: a method DELETED from KNOWN_METHODS together with
    // its handler would keep every test above green, and this is the line that makes
    // that show up in the diff.
    expect(KNOWN_METHODS.length).toBe(111);
    expect(UNCONDITIONAL_METHODS.length).toBe(3);
    expect(fromRegistry.size).toBe(114);
  });

  it('RPCLEDGER-006 boot-time total coverage is armed in production', () => {
    // The rollout's closing move: the registry service now FAILS APP BOOT when a
    // KNOWN_METHOD has no decorated owner, instead of letting it surface as a runtime
    // PERMISSION_DENIED nobody can explain.
    const options = (new PluginRpcRegistryService({} as never, {} as never) as unknown as {
      options: { requireTotalCoverage?: boolean };
    }).options;
    expect(options.requireTotalCoverage).toBe(true);
  });

  it('RPCLEDGER-007 a registry missing a method fails validate() rather than booting', () => {
    // Drops TagsRpc, a method owner. Dropping the last entry would drop PluginHooks
    // instead, and the failure would be about hooks rather than methods.
    const short = allRpcControllers().slice(1);
    expect(() => createTestPluginRegistry(short, { requireTotalCoverage: true })).toThrow(/has no handler/);
  });
});
