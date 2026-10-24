import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NO_SKI_CHOICE } from './skiChoice';
import { useSkiFields } from './useSkiFields';

// FE-TOUR-SKI-FIELDS-001 to FE-TOUR-SKI-FIELDS-004

describe('useSkiFields (SKI-02)', () => {
  it('FE-TOUR-SKI-FIELDS-001: a change is an edit only when it says something else and the planner allows it', () => {
    const onEdit = vi.fn(() => true);
    const { result } = renderHook(() => useSkiFields(NO_SKI_CHOICE, onEdit));
    act(() => result.current.change({ discipline: null, technique: null }));
    expect(onEdit).not.toHaveBeenCalled();
    act(() => result.current.change({ discipline: 'snowshoe', technique: null }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(result.current.choice).toEqual({ discipline: 'snowshoe', technique: null });

    onEdit.mockReturnValue(false);
    act(() => result.current.change({ discipline: 'alpine', technique: null }));
    expect(result.current.choice).toEqual({ discipline: 'snowshoe', technique: null });
  });

  it('FE-TOUR-SKI-FIELDS-002: a choice loaded from a tour or a draft is no edit', () => {
    const onEdit = vi.fn(() => true);
    const { result } = renderHook(() => useSkiFields(NO_SKI_CHOICE, onEdit));
    act(() => result.current.load({ discipline: 'cross_country', technique: 'classic' }));
    expect(result.current.choice).toEqual({ discipline: 'cross_country', technique: 'classic' });
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('FE-TOUR-SKI-FIELDS-003: an option changed is an edit that keeps the rest, the same option again none', () => {
    const onEdit = vi.fn(() => true);
    const { result } = renderHook(() => useSkiFields({ discipline: 'alpine', technique: null }, onEdit));
    act(() => result.current.setOption({ pace: 'sporty' }));
    act(() => result.current.setOption({ max_difficulty: 'advanced' }));
    expect(result.current.choice.options).toEqual({ pace: 'sporty', max_difficulty: 'advanced' });
    act(() => result.current.setOption({ pace: 'sporty' }));
    expect(onEdit).toHaveBeenCalledTimes(2);
    // Another discipline keeps the options chosen.
    act(() => result.current.change({ discipline: 'touring', technique: null }));
    expect(result.current.choice.options).toEqual({ pace: 'sporty', max_difficulty: 'advanced' });
  });

  it('FE-TOUR-SKI-FIELDS-004: a switch to snowboard leaves out surface lifts, unless lift classes were chosen', () => {
    const onEdit = vi.fn(() => true);
    const { result } = renderHook(() => useSkiFields({ discipline: 'alpine', technique: null }, onEdit));
    act(() => result.current.change({ discipline: 'snowboard', technique: null }));
    expect(result.current.choice.options).toEqual({ avoid_lifts: ['drag'] });
    act(() => result.current.setOption({ avoid_lifts: [] }));
    act(() => result.current.change({ discipline: 'alpine', technique: null }));
    act(() => result.current.change({ discipline: 'snowboard', technique: null }));
    expect(result.current.choice.options).toEqual({ avoid_lifts: [] });
  });
});
