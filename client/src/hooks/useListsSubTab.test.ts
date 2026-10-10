import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useListsSubTab } from './useListsSubTab';

// FE-HOOK-LISTSTAB-001 to FE-HOOK-LISTSTAB-006

describe('useListsSubTab', () => {
  it('FE-HOOK-LISTSTAB-001: opens on packing when nothing is stored for the trip', () => {
    const { result } = renderHook(() => useListsSubTab(7));
    expect(result.current[0]).toBe('packing');
  });

  it('FE-HOOK-LISTSTAB-002: reopens the sub-tab stored for that trip, not another one', () => {
    sessionStorage.setItem('trip-lists-subtab-7', 'todo');
    sessionStorage.setItem('trip-lists-subtab-8', 'packing');
    expect(renderHook(() => useListsSubTab(7)).result.current[0]).toBe('todo');
    expect(renderHook(() => useListsSubTab(8)).result.current[0]).toBe('packing');
    expect(renderHook(() => useListsSubTab(7, { onlyKnownTabs: true })).result.current[0]).toBe('todo');
  });

  it('FE-HOOK-LISTSTAB-003: the desktop takes whatever is stored, the phone only a tab it knows', () => {
    sessionStorage.setItem('trip-lists-subtab-7', 'files');
    expect(renderHook(() => useListsSubTab(7)).result.current[0]).toBe('files');
    expect(renderHook(() => useListsSubTab(7, { onlyKnownTabs: true })).result.current[0]).toBe('packing');
  });

  it('FE-HOOK-LISTSTAB-004: an empty stored value falls back to packing on both', () => {
    sessionStorage.setItem('trip-lists-subtab-7', '');
    expect(renderHook(() => useListsSubTab(7)).result.current[0]).toBe('packing');
    expect(renderHook(() => useListsSubTab(7, { onlyKnownTabs: true })).result.current[0]).toBe('packing');
  });

  it('FE-HOOK-LISTSTAB-005: switching shows the new tab and stores it under the trip key', () => {
    const { result } = renderHook(() => useListsSubTab(7, { onlyKnownTabs: true }));
    act(() => result.current[1]('todo'));
    expect(result.current[0]).toBe('todo');
    expect(sessionStorage.getItem('trip-lists-subtab-7')).toBe('todo');
    act(() => result.current[1]('packing'));
    expect(result.current[0]).toBe('packing');
    expect(sessionStorage.getItem('trip-lists-subtab-7')).toBe('packing');
  });

  it('FE-HOOK-LISTSTAB-006: a choice made on one surface is what the other opens with', () => {
    const desktop = renderHook(() => useListsSubTab(3));
    act(() => desktop.result.current[1]('todo'));
    expect(renderHook(() => useListsSubTab(3, { onlyKnownTabs: true })).result.current[0]).toBe('todo');
  });
});
