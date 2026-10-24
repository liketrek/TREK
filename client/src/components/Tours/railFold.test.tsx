import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { useRailFold } from './railFold';
import { RailCard } from './tourParts';

describe('useRailFold', () => {
  beforeEach(() => localStorage.clear());

  it('starts at its default, and a choice outlasts a reload', () => {
    const first = renderHook(() => useRailFold('waypoints'));
    expect(first.result.current.folded).toBe(false);
    act(() => first.result.current.toggle());
    expect(first.result.current.folded).toBe(true);
    first.unmount();
    expect(renderHook(() => useRailFold('waypoints')).result.current.folded).toBe(true);
    // Another card keeps its own state.
    expect(renderHook(() => useRailFold('paddle-wind')).result.current.folded).toBe(false);
  });

  it('a card folded by default stays open once opened', () => {
    const first = renderHook(() => useRailFold('trip-totals', true));
    expect(first.result.current.folded).toBe(true);
    act(() => first.result.current.toggle());
    first.unmount();
    expect(renderHook(() => useRailFold('trip-totals', true)).result.current.folded).toBe(false);
  });

  it('falls back to the default where the storage is blocked', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(renderHook(() => useRailFold('trip-totals', true)).result.current.folded).toBe(true);
    spy.mockRestore();
  });
});

describe('RailCard with a fold', () => {
  beforeEach(() => localStorage.clear());

  it('folds to its head by the chevron or the title, keeping the head aside', () => {
    render(
      <RailCard icon={null} title="Waypoints" foldId="waypoints" aside={<span>5</span>}>
        <p>rows</p>
      </RailCard>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Collapse: Waypoints' }));
    expect(screen.queryByText('rows')).toBeNull();
    expect(screen.getByText('5')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Waypoints' }));
    expect(screen.getByText('rows')).toBeInTheDocument();
  });

  it('a card without a fold id has no fold', () => {
    render(
      <RailCard icon={null} title="Tour summary">
        <p>facts</p>
      </RailCard>
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('facts')).toBeInTheDocument();
  });
});
