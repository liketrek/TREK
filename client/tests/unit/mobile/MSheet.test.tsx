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
