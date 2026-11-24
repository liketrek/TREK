/**
 * PEVADDON-001..004: the plugin event sink with the trip's addons in front.
 *
 * A trip that has an addon off shows none of its rows, so a subscribed plugin
 * gets none of that family's events either; every other event goes out at once.
 */
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import { tripAddonOfEvent, tripEventSink } from '../../../src/nest/plugins/plugin-event-addons';

import { describe, it, expect, vi } from 'vitest';

/** Lets the sink's pending addon read settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('the plugin event sink per trip', () => {
  it('PEVADDON-001: an event names its trip addon by family; a trip event names none', () => {
    expect(tripAddonOfEvent('budget:created')).toBe('budget');
    expect(tripAddonOfEvent('packing:updated')).toBe('packing');
    expect(tripAddonOfEvent('todo:deleted')).toBe('packing');
    expect(tripAddonOfEvent('file:created')).toBe('documents');
    expect(tripAddonOfEvent('collab:message:created')).toBe('collab');
    expect(tripAddonOfEvent('roadtripVia:created')).toBe('roadtrip');
    expect(tripAddonOfEvent('tours:updated')).toBe('tours');
    expect(tripAddonOfEvent('place:created')).toBeNull();
    expect(tripAddonOfEvent('toString:x')).toBeNull();
  });

  it('PEVADDON-002: an event of no addon goes out at once, without asking', () => {
    const deliver = vi.fn();
    const addons = { isEnabledForTrip: vi.fn() } as unknown as AddonsService;
    tripEventSink(addons, undefined, deliver)(5, 'place:created', undefined);
    expect(deliver).toHaveBeenCalledWith(5, 'place:created', undefined);
    expect(addons.isEnabledForTrip).not.toHaveBeenCalled();
  });

  it('PEVADDON-003: an addon event goes out only for a trip that has the addon on', async () => {
    const deliver = vi.fn();
    const addons = {
      isEnabledForTrip: vi.fn(async (tripId: number, id: string) => !(tripId === 5 && id === 'budget')),
    } as unknown as AddonsService;
    const sink = tripEventSink(addons, undefined, deliver);
    sink(5, 'budget:created', undefined);
    sink(6, 'budget:created', undefined);
    sink(5, 'packing:created', undefined);
    await settle();
    expect(deliver.mock.calls.map(([tripId, event]) => `${tripId} ${event}`)).toEqual([
      '6 budget:created',
      '5 packing:created',
    ]);
  });

  it('PEVADDON-004: an addon that cannot be read sends nothing', async () => {
    const deliver = vi.fn();
    const addons = {
      isEnabledForTrip: vi.fn(async () => Promise.reject(new Error('db gone'))),
    } as unknown as AddonsService;
    tripEventSink(addons, undefined, deliver)(5, 'file:created', undefined);
    await settle();
    expect(deliver).not.toHaveBeenCalled();
  });

  it('PEVADDON-004b: a read that fails while an earlier event of the trip still waits is handled at once', async () => {
    const deliver = vi.fn();
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    try {
      // A plain function, not vi.fn: a spy observes the promises it returns, which would handle the rejection itself.
      const answers: Array<(on: boolean) => void> = [];
      let reads = 0;
      const addons = {
        isEnabledForTrip: () =>
          reads++ === 0
            ? new Promise<boolean>((resolve) => answers.push(resolve))
            : Promise.reject(new Error('db gone')),
      } as unknown as AddonsService;
      const sink = tripEventSink(addons, undefined, deliver);
      sink(5, 'budget:updated', { v: 1 } as never);
      sink(5, 'budget:updated', { v: 2 } as never);
      await settle();
      await settle();
      expect(unhandled).not.toHaveBeenCalled();
      answers[0](true);
      await settle();
      expect(deliver.mock.calls.map(([, , meta]) => meta)).toEqual([{ v: 1 }]);
    } finally {
      process.off('unhandledRejection', unhandled);
    }
  });

  it('PEVADDON-005: a trip keeps its emission order, though a later read answers first', async () => {
    const deliver = vi.fn();
    const answers: Array<(on: boolean) => void> = [];
    const addons = {
      isEnabledForTrip: vi.fn(() => new Promise<boolean>((resolve) => answers.push(resolve))),
    } as unknown as AddonsService;
    const sink = tripEventSink(addons, undefined, deliver);
    sink(5, 'budget:updated', { v: 1 } as never);
    sink(5, 'budget:updated', { v: 2 } as never);
    sink(5, 'trip:deleted', undefined);
    sink(6, 'place:created', undefined);
    expect(deliver.mock.calls.map(([tripId, event]) => `${tripId} ${event}`)).toEqual(['6 place:created']);
    answers[1](true);
    await settle();
    expect(deliver).toHaveBeenCalledTimes(1);
    answers[0](true);
    await settle();
    expect(deliver.mock.calls.map(([tripId, event, meta]) => [tripId, event, meta])).toEqual([
      [6, 'place:created', undefined],
      [5, 'budget:updated', { v: 1 }],
      [5, 'budget:updated', { v: 2 }],
      [5, 'trip:deleted', undefined],
    ]);
    sink(5, 'place:created', undefined);
    expect(deliver).toHaveBeenLastCalledWith(5, 'place:created', undefined);
  });

  it('PEVADDON-006: with Documents off a file event goes out when its file is attached, in order', async () => {
    const deliver = vi.fn();
    const addons = { isEnabledForTrip: vi.fn(async () => false) } as unknown as AddonsService;
    const attached = vi.fn(async (fileId: number) => {
      if (fileId === 12) throw new Error('db gone');
      return fileId === 10;
    });
    const sink = tripEventSink(addons, undefined, deliver, attached);
    sink(5, 'file:created', { entity: 'file', entityId: 10 });
    sink(5, 'file:updated', { entity: 'file', entityId: 11 });
    sink(5, 'file:updated', { entity: 'file', entityId: 12 });
    sink(5, 'file:deleted', undefined);
    sink(5, 'budget:created', { entity: 'budget', entityId: 10 });
    sink(5, 'file:deleted', { entity: 'file', entityId: 10 });
    sink(5, 'place:created', undefined);
    await settle();
    await settle();
    expect(deliver.mock.calls.map(([, event, meta]) => `${event} ${meta?.entityId ?? '-'}`)).toEqual([
      'file:created 10',
      'file:deleted 10',
      'place:created -',
    ]);
    expect(attached).toHaveBeenCalledWith(10, 5);
    expect(attached).not.toHaveBeenCalledWith(undefined, 5);
    expect(attached).toHaveBeenCalledTimes(4);
  });
});
