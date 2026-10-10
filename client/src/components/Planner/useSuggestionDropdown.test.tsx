import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useSuggestionDropdown } from './useSuggestionDropdown';

// FE-PLANNER-SUGGESTDD-001 to FE-PLANNER-SUGGESTDD-006

const ROWS = ['alpha', 'beta', 'gamma'];

function Harness({ rows = ROWS, onPick }: { rows?: string[]; onPick: (row: string) => void }) {
  const { open, setOpen, highlight, wrapRef, handleKey } = useSuggestionDropdown();
  return (
    <div>
      <div ref={wrapRef}>
        <input aria-label="field" onFocus={() => setOpen(true)} onKeyDown={(e) => handleKey(e, rows, onPick)} />
        <span data-testid="state">{`${open ? 'open' : 'closed'}:${highlight}`}</span>
      </div>
      <button type="button">outside</button>
    </div>
  );
}

function state() {
  return screen.getByTestId('state').textContent;
}

describe('useSuggestionDropdown', () => {
  it('FE-PLANNER-SUGGESTDD-001: starts closed with nothing highlighted', () => {
    render(<Harness onPick={vi.fn()} />);
    expect(state()).toBe('closed:-1');
  });

  it('FE-PLANNER-SUGGESTDD-002: arrow keys move the highlight and stop at both ends', () => {
    render(<Harness onPick={vi.fn()} />);
    const field = screen.getByLabelText('field');
    fireEvent.focus(field);
    fireEvent.keyDown(field, { key: 'ArrowDown' });
    fireEvent.keyDown(field, { key: 'ArrowDown' });
    fireEvent.keyDown(field, { key: 'ArrowDown' });
    fireEvent.keyDown(field, { key: 'ArrowDown' });
    expect(state()).toBe('open:2');
    fireEvent.keyDown(field, { key: 'ArrowUp' });
    fireEvent.keyDown(field, { key: 'ArrowUp' });
    fireEvent.keyDown(field, { key: 'ArrowUp' });
    expect(state()).toBe('open:0');
  });

  it('FE-PLANNER-SUGGESTDD-003: Enter picks the highlighted row, and does nothing without one', () => {
    const onPick = vi.fn();
    render(<Harness onPick={onPick} />);
    const field = screen.getByLabelText('field');
    fireEvent.focus(field);
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(onPick).not.toHaveBeenCalled();
    fireEvent.keyDown(field, { key: 'ArrowDown' });
    fireEvent.keyDown(field, { key: 'ArrowDown' });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(onPick).toHaveBeenCalledWith('beta');
  });

  it('FE-PLANNER-SUGGESTDD-004: Escape closes the list', () => {
    render(<Harness onPick={vi.fn()} />);
    const field = screen.getByLabelText('field');
    fireEvent.focus(field);
    fireEvent.keyDown(field, { key: 'Escape' });
    expect(state()).toBe('closed:-1');
  });

  it('FE-PLANNER-SUGGESTDD-005: keys are ignored while closed or without rows', () => {
    const onPick = vi.fn();
    const { unmount } = render(<Harness onPick={onPick} />);
    fireEvent.keyDown(screen.getByLabelText('field'), { key: 'ArrowDown' });
    expect(state()).toBe('closed:-1');
    unmount();

    render(<Harness rows={[]} onPick={onPick} />);
    const field = screen.getByLabelText('field');
    fireEvent.focus(field);
    fireEvent.keyDown(field, { key: 'ArrowDown' });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(state()).toBe('open:-1');
    expect(onPick).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-SUGGESTDD-006: a mousedown outside closes the list, one inside keeps it open', () => {
    render(<Harness onPick={vi.fn()} />);
    const field = screen.getByLabelText('field');
    fireEvent.focus(field);
    fireEvent.mouseDown(field);
    expect(state()).toBe('open:-1');
    fireEvent.mouseDown(screen.getByRole('button', { name: 'outside' }));
    expect(state()).toBe('closed:-1');
  });
});
