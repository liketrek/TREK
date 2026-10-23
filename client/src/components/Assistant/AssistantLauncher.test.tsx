/**
 * FE-AI-LAUNCH-001 to FE-AI-LAUNCH-007
 *
 * The way in: hidden until the assistant can run, a button that opens and
 * closes the window, a dot for warnings in the plan not seen yet, a floating
 * button that breathes while a trip's answer is written in a closed window,
 * and ⌘K / Ctrl+K, which leaves a dialog alone.
 */
import { renderHook } from '@testing-library/react';
import type { AiStatusResponse } from '@trek/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildAssignment, buildDay, buildPlace, buildTrip } from '../../../tests/helpers/factories';
import { act, fireEvent, render, screen } from '../../../tests/helpers/render';
import { resetAllStores } from '../../../tests/helpers/store';
import { assistantChatKey } from '../../store/assistantChatKey';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useTripStore } from '../../store/tripStore';
import AssistantLauncher from './AssistantLauncher';
import { isAssistantHotkey, useAssistantHotkey } from './useAssistantHotkey';

const INITIAL = useAssistantStore.getState();

const STATUS = { available: true } as AiStatusResponse;

function press(init: KeyboardEventInit): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  window.dispatchEvent(event);
  return event;
}

afterEach(() => useAssistantStore.setState(INITIAL, true));

describe('AssistantLauncher', () => {
  it('FE-AI-LAUNCH-001: shows nothing until the assistant has a connection to use', () => {
    useAssistantStore.setState({ status: { ...STATUS, available: false } });
    const { container } = render(<AssistantLauncher variant="navbar" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-AI-LAUNCH-002: the navbar button and the floating one open and close the window', () => {
    useAssistantStore.setState({ status: STATUS });
    const { unmount } = render(<AssistantLauncher variant="navbar" />);
    const button = screen.getByRole('button', { name: 'Assistant' });
    fireEvent.click(button);
    expect(useAssistantStore.getState().window).toEqual({ open: true, minimized: false });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button);
    expect(useAssistantStore.getState().window.open).toBe(false);
    unmount();

    render(<AssistantLauncher variant="floating" />);
    fireEvent.click(screen.getByRole('button', { name: 'Assistant' }));
    expect(useAssistantStore.getState().window.open).toBe(true);
  });

  it('FE-AI-LAUNCH-006: the floating button carries a dot for a warning not seen yet, until the chat is opened', () => {
    window.localStorage.clear();
    resetAllStores();
    const places = [
      buildPlace({ id: 50, place_time: '10:00', end_time: '12:00' }),
      buildPlace({ id: 51, place_time: '11:00', end_time: '12:30' }),
    ];
    const stops = places.map((place, i) =>
      buildAssignment({ id: 60 + i, day_id: 1, place_id: place.id, order_index: i, place })
    );
    useTripStore.setState({
      trip: buildTrip({ id: 3, start_date: '2099-06-01', end_date: '2099-06-01' }),
      days: [buildDay({ id: 1, trip_id: 3, date: '2099-06-01' })],
      places,
      assignments: { '1': stops },
      reservations: [],
      dayNotes: {},
    });
    useAssistantStore.setState({ status: STATUS });

    const { unmount } = render(<AssistantLauncher variant="navbar" />);
    expect(screen.getByRole('button', { name: 'Assistant' })).toBeInTheDocument();
    unmount();

    render(<AssistantLauncher variant="floating" tripId={3} />);
    const button = screen.getByRole('button', { name: 'Assistant, 1 hint' });
    // The dot stands out from the accent button it sits on.
    expect(button.querySelector('.bg-warning')).not.toBeNull();
    fireEvent.click(button);
    expect(useAssistantStore.getState().window.open).toBe(true);
    expect(screen.getByRole('button', { name: 'Assistant' }).querySelector('.bg-warning')).toBeNull();
  });

  it('FE-AI-LAUNCH-007: the floating button breathes for a trip answer being written, not for one still running in the Studio', () => {
    const studio = assistantChatKey({ kind: 'journey', journeyId: 3 });
    const chat = (key: number, isRunning: boolean) => ({ ...chatOf(useAssistantStore.getState(), key), isRunning });
    useAssistantStore.setState({ status: STATUS, byTrip: { [studio]: chat(studio, true), [5]: chat(5, false) } });
    render(<AssistantLauncher variant="floating" />);
    const button = screen.getByRole('button', { name: 'Assistant' });
    expect(button).not.toHaveAttribute('aria-busy');

    act(() => useAssistantStore.setState((s) => ({ byTrip: { ...s.byTrip, [4]: chat(4, true) } })));
    expect(button).toHaveAttribute('aria-busy', 'true');
    // An open window shows the answer itself.
    act(() => useAssistantStore.getState().open());
    expect(button).not.toHaveAttribute('aria-busy');
  });
});

describe('the shortcut', () => {
  it('FE-AI-LAUNCH-003: is ⌘K or Ctrl+K, without Alt or Shift', () => {
    const key = (init: KeyboardEventInit) => isAssistantHotkey(new KeyboardEvent('keydown', init));
    expect(key({ key: 'k', metaKey: true })).toBe(true);
    expect(key({ key: 'K', ctrlKey: true })).toBe(true);
    expect(key({ key: 'k' })).toBe(false);
    expect(key({ key: 'k', ctrlKey: true, altKey: true })).toBe(false);
    expect(key({ key: 'k', metaKey: true, shiftKey: true })).toBe(false);
    expect(key({ key: 'j', metaKey: true })).toBe(false);
  });

  it('FE-AI-LAUNCH-004: toggles and takes the key, only while enabled', () => {
    const onToggle = vi.fn();
    const { rerender } = renderHook(({ enabled }) => useAssistantHotkey(enabled, onToggle), {
      initialProps: { enabled: false },
    });
    expect(press({ key: 'k', ctrlKey: true }).defaultPrevented).toBe(false);
    expect(onToggle).not.toHaveBeenCalled();

    rerender({ enabled: true });
    expect(press({ key: 'k', ctrlKey: true }).defaultPrevented).toBe(true);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('FE-AI-LAUNCH-005: leaves the key alone while a dialog is open or something else took it', () => {
    const onToggle = vi.fn();
    renderHook(() => useAssistantHotkey(true, onToggle));
    const backdrop = document.createElement('div');
    backdrop.className = 'trek-modal-backdrop';
    document.body.appendChild(backdrop);
    press({ key: 'k', metaKey: true });
    backdrop.remove();

    const taken = new KeyboardEvent('keydown', { key: 'k', metaKey: true, cancelable: true });
    taken.preventDefault();
    window.dispatchEvent(taken);

    expect(onToggle).not.toHaveBeenCalled();
  });
});
