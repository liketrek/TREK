import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MSheet from '../../../src/mobile/components/MSheet';

// FE-MOB-SHEET-001 onwards

describe('MSheet', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.style.overflow = '';
  });

  it('FE-MOB-SHEET-001: renders its children in a dialog when open', () => {
    render(
      <MSheet open onClose={() => {}} ariaLabel="Test sheet">
        <span>Sheet content</span>
      </MSheet>,
    );
    expect(screen.getByRole('dialog', { name: 'Test sheet' })).toBeInTheDocument();
    expect(screen.getByText('Sheet content')).toBeInTheDocument();
  });

  it('FE-MOB-SHEET-002: renders nothing while closed', () => {
    render(
      <MSheet open={false} onClose={() => {}}>
        <span>Sheet content</span>
      </MSheet>,
    );
    expect(screen.queryByText('Sheet content')).not.toBeInTheDocument();
  });

  it('FE-MOB-SHEET-003: backdrop click closes, clicks inside the panel do not', () => {
    const onClose = vi.fn();
    render(
      <MSheet open onClose={onClose} ariaLabel="Test sheet">
        <span>Sheet content</span>
      </MSheet>,
    );

    fireEvent.click(screen.getByText('Sheet content'));
    expect(onClose).not.toHaveBeenCalled();

    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.parentElement!.parentElement!;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-SHEET-004: Escape closes the sheet', () => {
    const onClose = vi.fn();
    render(
      <MSheet open onClose={onClose}>
        <span>Sheet content</span>
      </MSheet>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-SHEET-005: stays mounted for the exit animation, then unmounts', () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <MSheet open onClose={() => {}}>
        <span>Sheet content</span>
      </MSheet>,
    );
    rerender(
      <MSheet open={false} onClose={() => {}}>
        <span>Sheet content</span>
      </MSheet>,
    );
    // Still visible right after closing (exit animation running).
    expect(screen.getByText('Sheet content')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByText('Sheet content')).not.toBeInTheDocument();
  });

  it('FE-MOB-SHEET-007: Tab wraps around inside the dialog', () => {
    render(
      <MSheet open onClose={() => {}} ariaLabel="Trap">
        <button type="button">first</button>
        <button type="button">last</button>
      </MSheet>,
    );
    const dialog = screen.getByRole('dialog');
    const first = screen.getByText('first');
    const last = screen.getByText('last');

    last.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('FE-MOB-SHEET-008: shift+Tab from the panel itself jumps to the last control', () => {
    render(
      <MSheet open onClose={() => {}} ariaLabel="Trap">
        <button type="button">first</button>
        <button type="button">last</button>
      </MSheet>,
    );
    const dialog = screen.getByRole('dialog');
    dialog.focus();

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(screen.getByText('last'));
  });

  it('FE-MOB-SHEET-009: keys other than Tab pass through', () => {
    render(
      <MSheet open onClose={() => {}} ariaLabel="Trap">
        <button type="button">first</button>
      </MSheet>,
    );
    const dialog = screen.getByRole('dialog');
    const first = screen.getByText('first');
    first.focus();

    fireEvent.keyDown(dialog, { key: 'a' });

    expect(document.activeElement).toBe(first);
  });

  it('FE-MOB-SHEET-010: a sheet without focusable content swallows Tab', () => {
    render(
      <MSheet open onClose={() => {}} ariaLabel="Empty">
        <span>nothing to focus</span>
      </MSheet>,
    );
    const dialog = screen.getByRole('dialog');

    const handled = fireEvent.keyDown(dialog, { key: 'Tab' });

    // fireEvent returns false once a listener called preventDefault.
    expect(handled).toBe(false);
  });

  it('FE-MOB-SHEET-011: the entrance animation class is dropped once it has played', () => {
    render(
      <MSheet open onClose={() => {}} ariaLabel="Anim">
        <span>Sheet content</span>
      </MSheet>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('m-sheet-in');

    // jsdom has no AnimationEvent, so React binds the vendor-prefixed name.
    act(() => {
      dialog.dispatchEvent(new Event('animationend', { bubbles: true }));
      dialog.dispatchEvent(new Event('webkitAnimationEnd', { bubbles: true }));
    });

    expect(dialog.className).not.toContain('m-sheet-in');
  });

  it('FE-MOB-SHEET-012: dragging the bottom sheet far enough dismisses it', () => {
    HTMLElement.prototype.setPointerCapture = vi.fn();
    const onClose = vi.fn();
    render(
      <MSheet open onClose={onClose} variant="bottom" ariaLabel="Bottom">
        <span>Sheet content</span>
      </MSheet>,
    );
    const dialog = screen.getByRole('dialog');
    Object.defineProperty(dialog, 'offsetHeight', { configurable: true, value: 400 });
    const strip = dialog.querySelector('.cursor-grab') as HTMLElement;

    fireEvent.pointerDown(strip, { pointerId: 1, clientY: 100 });
    fireEvent.pointerMove(strip, { pointerId: 1, clientY: 260 });
    expect(dialog.getAttribute('style')).toContain('translateY(160px)');
    // A slow last move keeps the velocity low, so only the 30% travel rule can close it.
    fireEvent.pointerMove(strip, { pointerId: 1, clientY: 260.3 });

    fireEvent.pointerUp(strip, { pointerId: 1, clientY: 260.3 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-SHEET-015: a quick flick dismisses even without much travel', () => {
    HTMLElement.prototype.setPointerCapture = vi.fn();
    const onClose = vi.fn();
    render(
      <MSheet open onClose={onClose} variant="bottom" ariaLabel="Bottom">
        <span>Sheet content</span>
      </MSheet>,
    );
    const strip = screen.getByRole('dialog').querySelector('.cursor-grab') as HTMLElement;

    fireEvent.pointerDown(strip, { pointerId: 1, clientY: 100 });
    fireEvent.pointerMove(strip, { pointerId: 1, clientY: 130 });
    fireEvent.pointerUp(strip, { pointerId: 1, clientY: 130 });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-SHEET-013: a short drag snaps back instead of closing', () => {
    HTMLElement.prototype.setPointerCapture = vi.fn();
    const onClose = vi.fn();
    render(
      <MSheet open onClose={onClose} variant="bottom" ariaLabel="Bottom">
        <span>Sheet content</span>
      </MSheet>,
    );
    const dialog = screen.getByRole('dialog');
    Object.defineProperty(dialog, 'offsetHeight', { configurable: true, value: 400 });
    const strip = dialog.querySelector('.cursor-grab') as HTMLElement;

    fireEvent.pointerDown(strip, { pointerId: 1, clientY: 100 });
    fireEvent.pointerMove(strip, { pointerId: 1, clientY: 100.4 });
    fireEvent.pointerCancel(strip, { pointerId: 1, clientY: 100.4 });

    expect(onClose).not.toHaveBeenCalled();
    expect(dialog.getAttribute('style')).toContain('transform 280ms');
  });

  it('FE-MOB-SHEET-014: pointer moves without a drag in progress are ignored', () => {
    const onClose = vi.fn();
    render(
      <MSheet open onClose={onClose} variant="bottom" ariaLabel="Bottom">
        <span>Sheet content</span>
      </MSheet>,
    );
    const strip = screen.getByRole('dialog').querySelector('.cursor-grab') as HTMLElement;

    fireEvent.pointerMove(strip, { pointerId: 1, clientY: 400 });
    fireEvent.pointerUp(strip, { pointerId: 1, clientY: 400 });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('FE-MOB-SHEET-006: locks body scroll while open and releases it on close', () => {
    const { rerender } = render(
      <MSheet open onClose={() => {}}>
        <span>Sheet content</span>
      </MSheet>,
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <MSheet open={false} onClose={() => {}}>
        <span>Sheet content</span>
      </MSheet>,
    );
    expect(document.body.style.overflow).toBe('');
  });
});
