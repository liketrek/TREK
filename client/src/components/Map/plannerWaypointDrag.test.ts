import { describe, expect, it, vi } from 'vitest';
import { wirePlannerWaypointDrag } from './plannerWaypointDrag';

function pointer(type: string, x: number, y: number, pointerId = 1, pointerType: 'mouse' | 'touch' = 'mouse'): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    button: { value: 0 },
    clientX: { value: x },
    clientY: { value: y },
    pointerId: { value: pointerId },
    pointerType: { value: pointerType },
  });
  return event;
}

describe('Tour waypoint marker drag lifecycle', () => {
  it('previews during a drag and commits once on pointer up, swallowing only the generated click', () => {
    const element = document.createElement('button');
    const initial = { lat: 48, lng: 11 };
    const preview = vi.fn();
    const onCommit = vi.fn(() => true);
    const cleanup = wirePlannerWaypointDrag({
      element,
      initial,
      coordinateAt: (clientX, clientY) => ({ lat: clientY / 100, lng: clientX / 100 }),
      setPosition: preview,
      onCommit,
    });

    element.dispatchEvent(pointer('pointerdown', 10, 10));
    element.dispatchEvent(pointer('pointermove', 11, 11));
    expect(preview).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();

    element.dispatchEvent(pointer('pointermove', 20, 30));
    expect(preview).toHaveBeenLastCalledWith({ lat: 0.3, lng: 0.2 });
    expect(onCommit).not.toHaveBeenCalled();
    element.dispatchEvent(pointer('pointerup', 30, 40));
    expect(preview).toHaveBeenLastCalledWith({ lat: 0.4, lng: 0.3 });
    expect(onCommit).toHaveBeenCalledOnce();
    expect(onCommit).toHaveBeenCalledWith({ lat: 0.4, lng: 0.3 });

    const generatedClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    element.dispatchEvent(generatedClick);
    expect(generatedClick.defaultPrevented).toBe(true);
    const nextClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    element.dispatchEvent(nextClick);
    expect(nextClick.defaultPrevented).toBe(false);
    cleanup();
  });

  it('restores the starting coordinate on pointer cancellation and does not commit', () => {
    const element = document.createElement('button');
    const initial = { lat: 48, lng: 11 };
    const preview = vi.fn();
    const onCommit = vi.fn();
    const cleanup = wirePlannerWaypointDrag({
      element,
      initial,
      coordinateAt: (clientX, clientY) => ({ lat: clientY, lng: clientX }),
      setPosition: preview,
      onCommit,
    });

    element.dispatchEvent(pointer('pointerdown', 10, 10));
    element.dispatchEvent(pointer('pointermove', 20, 30));
    element.dispatchEvent(pointer('pointercancel', 20, 30));
    expect(preview).toHaveBeenLastCalledWith(initial);
    expect(onCommit).not.toHaveBeenCalled();
    cleanup();
  });

  it('restores the preview when the canonical commit is rejected', () => {
    const element = document.createElement('button');
    const initial = { lat: 48, lng: 11 };
    const preview = vi.fn();
    const cleanup = wirePlannerWaypointDrag({
      element,
      initial,
      coordinateAt: (clientX, clientY) => ({ lat: clientY, lng: clientX }),
      setPosition: preview,
      onCommit: () => false,
    });

    element.dispatchEvent(pointer('pointerdown', 10, 10));
    element.dispatchEvent(pointer('pointermove', 20, 30));
    element.dispatchEvent(pointer('pointerup', 20, 30));
    expect(preview).toHaveBeenLastCalledWith(initial);
    cleanup();
  });

  it('keeps pointer, mouse, and touch starts from bubbling into map pan handlers', () => {
    const mapSurface = document.createElement('div');
    const element = document.createElement('button');
    mapSurface.append(element);
    const mapPan = vi.fn();
    mapSurface.addEventListener('pointerdown', mapPan);
    mapSurface.addEventListener('mousedown', mapPan);
    mapSurface.addEventListener('touchstart', mapPan);
    const cleanup = wirePlannerWaypointDrag({
      element,
      initial: { lat: 48, lng: 11 },
      coordinateAt: () => ({ lat: 48, lng: 11 }),
      setPosition: vi.fn(),
      onCommit: vi.fn(),
    });

    element.dispatchEvent(pointer('pointerdown', 10, 10));
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
    element.dispatchEvent(new Event('touchstart', { bubbles: true, cancelable: true }));
    expect(mapPan).not.toHaveBeenCalled();
    cleanup();
  });

  it('commits a touch-pointer drag once at release', () => {
    const element = document.createElement('button');
    const onCommit = vi.fn(() => true);
    const cleanup = wirePlannerWaypointDrag({
      element,
      initial: { lat: 48, lng: 11 },
      coordinateAt: (clientX, clientY) => ({ lat: clientY / 10, lng: clientX / 10 }),
      setPosition: vi.fn(),
      onCommit,
    });

    element.dispatchEvent(pointer('pointerdown', 5, 5, 9, 'touch'));
    element.dispatchEvent(pointer('pointermove', 25, 35, 9, 'touch'));
    expect(onCommit).not.toHaveBeenCalled();
    element.dispatchEvent(pointer('pointerup', 25, 35, 9, 'touch'));
    expect(onCommit).toHaveBeenCalledOnce();
    expect(onCommit).toHaveBeenCalledWith({ lat: 3.5, lng: 2.5 });
    cleanup();
  });

  it('restores existing touch and selection styles when editing drag wiring is removed', () => {
    const element = document.createElement('button');
    element.style.touchAction = 'pan-x';
    element.style.userSelect = 'text';
    const cleanup = wirePlannerWaypointDrag({
      element,
      initial: { lat: 48, lng: 11 },
      coordinateAt: () => ({ lat: 48, lng: 11 }),
      setPosition: vi.fn(),
      onCommit: vi.fn(),
    });
    expect(element.style.touchAction).toBe('none');
    expect(element.style.userSelect).toBe('none');
    cleanup();
    expect(element.style.touchAction).toBe('pan-x');
    expect(element.style.userSelect).toBe('text');
  });
});
