// FE-MAP-GHOST-GL-001 to 002: the assistant's suggestions on the GL map, as hand-positioned pins.
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AssistantGhost } from './mapViewContract';
import { useAssistantGhostMarkersGL } from './useAssistantGhostMarkersGL';

const GHOSTS: AssistantGhost[] = [
  { id: 'a', lat: 41.9, lng: 12.48, name: 'Pantheon' },
  { id: 'b', lat: 41.89, lng: 12.49, name: '<b>Forum</b>' },
];

function setup(hoveredId: string | null = null) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const map = { getContainer: () => container, on: vi.fn(), off: vi.fn() };
  const attached: { el: HTMLElement; lng: number; lat: number; remove: ReturnType<typeof vi.fn> }[] = [];
  const pinsRef = { current: [] as { remove: () => void }[] };
  const onHover = vi.fn();
  const onClick = vi.fn();
  // Stable across renders, as the map view hands them over: only `hovered` changes.
  const mapRef = { current: map };
  const attachPin = (el: HTMLElement, lng: number, lat: number) => {
    container.appendChild(el);
    const pin = { el, lng, lat, remove: vi.fn(() => el.remove()) };
    attached.push(pin);
    return pin;
  };
  const hook = renderHook(
    ({ hovered }) =>
      useAssistantGhostMarkersGL({
        mapRef,
        mapReady: true,
        pinsRef,
        attachPin,
        ghosts: GHOSTS,
        hoveredId: hovered,
        onHover,
        onClick,
      }),
    { initialProps: { hovered: hoveredId } }
  );
  return { container, attached, pinsRef, onHover, hook };
}

describe('useAssistantGhostMarkersGL', () => {
  it('FE-MAP-GHOST-GL-001: puts each ghost where it belongs, hands the pins to the reposition, and names it as text', () => {
    const { container, attached, pinsRef, onHover } = setup();
    expect(attached.map((p) => [p.lng, p.lat])).toEqual([
      [12.48, 41.9],
      [12.49, 41.89],
    ]);
    expect(pinsRef.current).toHaveLength(2);
    attached[1]?.el.dispatchEvent(new Event('pointerenter'));
    expect(onHover).toHaveBeenCalledWith('b');
    const label = container.querySelector('[data-testid="assistant-ghost-label"]');
    expect(label?.textContent).toBe('<b>Forum</b>');
    expect(label?.querySelector('b')).toBeNull();
  });

  it('FE-MAP-GHOST-GL-002: a hover marks its ghost without rebuilding a pin, and unmounting takes them all off', () => {
    const { attached, pinsRef, hook } = setup();
    act(() => hook.rerender({ hovered: 'a' }));
    expect(attached).toHaveLength(2);
    expect(attached[0]?.el.classList.contains('is-hot')).toBe(true);
    expect(attached[1]?.el.classList.contains('is-hot')).toBe(false);

    hook.unmount();
    expect(attached.every((p) => p.remove.mock.calls.length === 1)).toBe(true);
    expect(pinsRef.current).toEqual([]);
  });
});
