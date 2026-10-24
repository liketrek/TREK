// FE-MAP-PRESS-001 to FE-MAP-PRESS-008: only a real click on the map places a point, never a drag or a long hold.
import { describe, expect, it } from 'vitest';
import { createPressTracker, isPlacementTap, TAP_MAX_DURATION_MS, TAP_MAX_TRAVEL_PX } from './mapPress';

function pointer(type: string, x: number, y: number, pointerId = 1): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    clientX: { value: x },
    clientY: { value: y },
    pointerId: { value: pointerId },
  });
  return event;
}

/** A tracker on a fresh element, with a clock the test moves. */
function setup() {
  const el = document.createElement('div');
  let clock = 0;
  const tracker = createPressTracker(el, () => clock);
  return {
    el,
    tracker,
    at: (ms: number) => {
      clock = ms;
    },
    send: (type: string, x: number, y: number, id = 1) => el.dispatchEvent(pointer(type, x, y, id)),
  };
}

describe('isPlacementTap', () => {
  it('FE-MAP-PRESS-001: a short press that barely moved places', () => {
    expect(isPlacementTap({ travelPx: 0, durationMs: 80, pointers: 1 })).toBe(true);
    expect(
      isPlacementTap({ travelPx: TAP_MAX_TRAVEL_PX - 0.5, durationMs: TAP_MAX_DURATION_MS - 1, pointers: 1 })
    ).toBe(true);
  });

  it('FE-MAP-PRESS-002: 4 px of travel, 300 ms of hold or a second finger never place', () => {
    expect(isPlacementTap({ travelPx: TAP_MAX_TRAVEL_PX, durationMs: 50, pointers: 1 })).toBe(false);
    expect(isPlacementTap({ travelPx: 0, durationMs: TAP_MAX_DURATION_MS, pointers: 1 })).toBe(false);
    expect(isPlacementTap({ travelPx: 0, durationMs: 50, pointers: 2 })).toBe(false);
  });

  it("FE-MAP-PRESS-003: a click no press was seen for (keyboard, synthetic) is the map's own call", () => {
    expect(isPlacementTap(null)).toBe(true);
  });
});

describe('createPressTracker', () => {
  it('FE-MAP-PRESS-004: hands out the finished press once, with its travel and length', () => {
    const { tracker, at, send } = setup();
    at(1000);
    send('pointerdown', 10, 10);
    at(1100);
    send('pointerup', 12, 11);
    const press = tracker.take();
    expect(press?.durationMs).toBe(100);
    expect(press?.travelPx).toBeCloseTo(Math.hypot(2, 1));
    expect(press?.pointers).toBe(1);
    expect(isPlacementTap(press)).toBe(true);
    expect(tracker.take()).toBeNull();
  });

  it('FE-MAP-PRESS-005: a drag that came back to where it started still counts as a drag', () => {
    const { tracker, at, send } = setup();
    at(0);
    send('pointerdown', 100, 100);
    send('pointermove', 140, 100);
    at(120);
    send('pointerup', 100, 100);
    const press = tracker.take();
    expect(press?.travelPx).toBe(40);
    expect(isPlacementTap(press)).toBe(false);
  });

  it('FE-MAP-PRESS-006: a pinch or a two-finger rotate is no tap, and ends with the last finger', () => {
    const { tracker, at, send } = setup();
    at(0);
    send('pointerdown', 10, 10, 1);
    send('pointerdown', 50, 50, 2);
    at(80);
    send('pointerup', 50, 50, 2);
    expect(tracker.take()).toBeNull();
    send('pointerup', 10, 10, 1);
    const press = tracker.take();
    expect(press?.pointers).toBe(2);
    expect(isPlacementTap(press)).toBe(false);
  });

  it('FE-MAP-PRESS-007: a cancelled press (the browser took it for a gesture) never places', () => {
    const { tracker, at, send } = setup();
    at(0);
    send('pointerdown', 10, 10);
    at(50);
    send('pointercancel', 10, 10);
    expect(isPlacementTap(tracker.take())).toBe(false);
  });

  it('FE-MAP-PRESS-008: a new press drops the one nobody read, and dispose stops listening', () => {
    const { tracker, at, send } = setup();
    at(0);
    send('pointerdown', 0, 0);
    at(500);
    send('pointerup', 0, 0);
    send('pointerdown', 0, 0);
    expect(tracker.take()).toBeNull();
    at(550);
    send('pointerup', 0, 0);
    expect(tracker.take()?.durationMs).toBe(50);

    tracker.dispose();
    send('pointerdown', 0, 0);
    send('pointerup', 0, 0);
    expect(tracker.take()).toBeNull();
  });
});
