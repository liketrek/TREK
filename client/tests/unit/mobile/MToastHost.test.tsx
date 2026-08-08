import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MToastHost from '../../../src/mobile/components/MToastHost';

// FE-MOB-MTOAST-001 onwards

function push(message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number): void {
  act(() => { window.__addToast?.(message, type, duration); });
}

function pill(message: string): HTMLElement {
  return screen.getByText(message).parentElement as HTMLElement;
}

afterEach(() => {
  vi.useRealTimers();
  delete window.__addToast;
});

describe('MToastHost', () => {
  it('FE-MOB-MTOAST-001: renders nothing until a toast arrives', () => {
    const { container } = render(<MToastHost />);
    expect(container).toBeEmptyDOMElement();

    push('Trip saved');
    expect(screen.getByText('Trip saved')).toBeInTheDocument();
  });

  it('FE-MOB-MTOAST-002: takes over the global bridge and hands it back on unmount', () => {
    const previous = vi.fn(() => 0);
    window.__addToast = previous;

    const { unmount } = render(<MToastHost />);
    expect(window.__addToast).not.toBe(previous);

    unmount();
    expect(window.__addToast).toBe(previous);
  });

  it('FE-MOB-MTOAST-003: stacks several toasts and returns rising ids', () => {
    render(<MToastHost />);
    let first = 0;
    let second = 0;
    act(() => {
      first = window.__addToast?.('First') ?? 0;
      second = window.__addToast?.('Second') ?? 0;
    });

    expect(second).toBe(first + 1);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('FE-MOB-MTOAST-004: auto-dismisses after its duration plus the exit animation', () => {
    vi.useFakeTimers();
    render(<MToastHost />);
    push('Trip saved', 'info', 1000);

    act(() => { vi.advanceTimersByTime(1000); });
    // Still on screen, now playing the exit animation.
    expect(pill('Trip saved').className).toContain('m-toast-out');

    act(() => { vi.advanceTimersByTime(220); });
    expect(screen.queryByText('Trip saved')).not.toBeInTheDocument();
  });

  it('FE-MOB-MTOAST-005: a sticky toast waits for a tap', () => {
    vi.useFakeTimers();
    render(<MToastHost />);
    push('Offline', 'warning', 0);

    act(() => { vi.advanceTimersByTime(10000); });
    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(pill('Offline').className).toContain('pointer-events-auto');

    fireEvent.click(pill('Offline'));
    act(() => { vi.advanceTimersByTime(220); });
    expect(screen.queryByText('Offline')).not.toBeInTheDocument();
  });

  it('FE-MOB-MTOAST-006: only the non-info types get a status dot', () => {
    render(<MToastHost />);
    push('Done', 'success');
    push('Heads up', 'info');

    expect(pill('Done').querySelector('span[aria-hidden]')).toBeInTheDocument();
    expect(pill('Heads up').querySelector('span[aria-hidden]')).toBeNull();
  });

  it('FE-MOB-MTOAST-007: pending timers are cleared when the host unmounts', () => {
    vi.useFakeTimers();
    const { unmount } = render(<MToastHost />);
    push('Trip saved', 'info', 1000);

    unmount();
    // Without the cleanup the pending dismiss would setState on an unmounted host.
    expect(() => act(() => { vi.advanceTimersByTime(2000); })).not.toThrow();
  });
});
