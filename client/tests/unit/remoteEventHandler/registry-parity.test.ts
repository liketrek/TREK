import { describe, it, expect, beforeEach } from 'vitest';
import { TREK_WS_EVENT_NAMES, TREK_WS_TRIP_EVENT_NAMES } from '@trek/shared';
import { DEXIE_WRITERS, STATE_APPLIERS } from '../../../src/store/slices/remoteEventHandler';
import { HANDLED_OUTSIDE_TRIP_STORE, IGNORED_WS_EVENTS } from '../../../src/api/wsEventPolicy';
import { useTripStore } from '../../../src/store/tripStore';
import { resetAllStores } from '../../helpers/store';
import { buildPackingItem, buildPlace } from '../../helpers/factories';

/**
 * The exhaustiveness ratchet (roadmap: WS event contract registry). Every
 * event in the shared registry must be classified on the client — applied by
 * the tripStore reducer, consumed by a dedicated listener, or explicitly
 * ignored. A server-side event added without a client decision turns this
 * test red instead of vanishing into the old silent `default:` branches.
 */

const handledInStore = new Set<string>([
  ...Object.keys(STATE_APPLIERS),
  ...Object.keys(DEXIE_WRITERS),
]);
const handledElsewhere = new Set<string>(HANDLED_OUTSIDE_TRIP_STORE);
const ignored = new Set<string>(IGNORED_WS_EVENTS);

beforeEach(() => {
  resetAllStores();
});

describe('remoteEventHandler > registry parity', () => {
  it('FE-WSEVT-REGISTRY-001: every registry event is handled or explicitly ignored', () => {
    const unclassified = TREK_WS_EVENT_NAMES.filter(
      name => !handledInStore.has(name) && !handledElsewhere.has(name) && !ignored.has(name),
    );
    expect(
      unclassified,
      `New WS event(s) with no client decision: ${unclassified.join(', ')}. ` +
        'Handle them (remoteEventHandler / a dedicated listener) or add them to ' +
        'IGNORED_WS_EVENTS in src/api/wsEventPolicy.ts as a deliberate choice.',
    ).toEqual([]);
  });

  it('FE-WSEVT-REGISTRY-002: the three buckets are disjoint (exactly one decision per event)', () => {
    const doubleClassified = TREK_WS_EVENT_NAMES.filter(name => {
      const buckets =
        Number(handledInStore.has(name)) + Number(handledElsewhere.has(name)) + Number(ignored.has(name));
      return buckets > 1;
    });
    expect(
      doubleClassified,
      `Event(s) classified in more than one bucket: ${doubleClassified.join(', ')}`,
    ).toEqual([]);
  });

  it('FE-WSEVT-REGISTRY-003: no stale names — every classified event still exists in the registry', () => {
    const registry = new Set<string>(TREK_WS_EVENT_NAMES);
    const stale = [...handledInStore, ...handledElsewhere, ...ignored].filter(
      name => !registry.has(name),
    );
    expect(stale, `Name(s) not in the shared registry (renamed or removed?): ${stale.join(', ')}`).toEqual([]);
  });

  it('FE-WSEVT-REGISTRY-004: the tripStore lookups only handle trip-scoped events', () => {
    const tripScoped = new Set<string>(TREK_WS_TRIP_EVENT_NAMES);
    const misScoped = [...handledInStore].filter(name => !tripScoped.has(name));
    expect(misScoped, `User-scoped event(s) in the tripStore lookups: ${misScoped.join(', ')}`).toEqual([]);
  });

  it('FE-WSEVT-REGISTRY-005: every Dexie write-through event also has a state applier', () => {
    // writeToDexie reads the post-set() Zustand state, so a Dexie writer for an
    // event the reducer ignores would persist stale state.
    const writersWithoutApplier = Object.keys(DEXIE_WRITERS).filter(
      name => !(name in STATE_APPLIERS),
    );
    expect(writersWithoutApplier).toEqual([]);
  });

  it('FE-WSEVT-REGISTRY-006: an explicitly ignored event leaves the store untouched', () => {
    const items = [buildPackingItem({ id: 1 }), buildPackingItem({ id: 2 })];
    useTripStore.setState({ packingItems: items, places: [buildPlace({ id: 5 })] });
    // 'packing:reordered' is on IGNORED_WS_EVENTS — the reducer must swallow it
    // instead of throwing or clearing the slice.
    useTripStore.getState().handleRemoteEvent({ type: 'packing:reordered', orderedIds: [2, 1] });
    const state = useTripStore.getState();
    expect(state.packingItems.map(i => i.id)).toEqual([1, 2]);
    expect(state.places.map(p => p.id)).toEqual([5]);
  });

  it('FE-WSEVT-REGISTRY-007: an unknown event name is a no-op', () => {
    useTripStore.setState({ places: [buildPlace({ id: 5 })] });
    useTripStore.getState().handleRemoteEvent({ type: 'not:a:real:event', payload: 1 });
    expect(useTripStore.getState().places.map(p => p.id)).toEqual([5]);
  });
});
