/**
 * The coverage ledger: the anchor for the whole decorator rollout.
 *
 * Every wire method is owned exactly once, either by the legacy router blocks in
 * rpc-host.ts or by a decorated *.rpc.ts class in the registry. Both sets are derived
 * by construction, so no list is maintained by hand and the test cannot drift.
 *
 * It fails the moment a migration PR moves a method and forgets to delete the legacy
 * registration, deletes one without adding it, or forgets to list a new *.rpc.ts class
 * in allRpcControllers().
 */
import { describe, it, expect } from 'vitest';
import { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import { createTestPluginRegistry } from '../../../src/nest/plugins/host/rpc-kit/testing';
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
  const legacy = new Set([...all].filter((m) => !fromRegistry.has(m)));

  it('RPCLEDGER-001 no method is owned by both the registry and the legacy router', () => {
    expect([...fromRegistry].filter((m) => legacy.has(m))).toEqual([]);
  });

  it('RPCLEDGER-002 every registered method is one the wire protocol knows', () => {
    const vocabulary = new Set<string>([...KNOWN_METHODS, ...UNCONDITIONAL_METHODS]);
    expect([...all].filter((m) => !vocabulary.has(m))).toEqual([]);
  });

  it('RPCLEDGER-003 no method in the vocabulary is orphaned', () => {
    const vocabulary = new Set<string>([...KNOWN_METHODS, ...UNCONDITIONAL_METHODS]);
    expect([...vocabulary].filter((m) => !all.has(m))).toEqual([]);
  });

  it('RPCLEDGER-004 the two owner sets partition the vocabulary exactly', () => {
    expect(all).toEqual(new Set<string>([...KNOWN_METHODS, ...UNCONDITIONAL_METHODS]));
    expect(fromRegistry.size + legacy.size).toBe(all.size);
  });

  it('RPCLEDGER-005 the migration ledger reads as expected for this PR', () => {
    // Update these two numbers in every rollout PR. They make the diff state the size
    // of the move out loud, which is the number a reviewer wants to see.
    const total = KNOWN_METHODS.length + UNCONDITIONAL_METHODS.length;
    expect(fromRegistry.size).toBe(30);
    expect(legacy.size).toBe(total - 30);
  });

  it('RPCLEDGER-006 the migrated methods are exactly the ones this PR claims', () => {
    expect([...fromRegistry].sort()).toEqual([
      'categories.list',
      'daynotes.create',
      'daynotes.delete',
      'daynotes.list',
      'daynotes.update',
      'files.create',
      'files.createLink',
      'files.getContent',
      'files.list',
      'files.softDelete',
      'files.update',
      'packing.create',
      'packing.createBag',
      'packing.delete',
      'packing.deleteBag',
      'packing.list',
      'packing.listBags',
      'packing.setBagMembers',
      'packing.update',
      'packing.updateBag',
      'rates.get',
      'tags.create',
      'tags.delete',
      'tags.list',
      'tags.update',
      'todos.create',
      'todos.delete',
      'todos.list',
      'todos.update',
      'weather.get',
    ]);
  });
});
