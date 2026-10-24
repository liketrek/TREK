// FE-FERRATA-GUARD-001: the press that closed a ferrata's card is kept from also acting on the map.
import { act, fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useOutsidePressGuard } from './useOutsidePressGuard';

describe('useOutsidePressGuard', () => {
  it('FE-FERRATA-GUARD-001: the guard drops the one map click after the closing press and is off once that click went by', () => {
    vi.useFakeTimers();
    try {
      const handler = vi.fn();
      const { result } = renderHook(() => useOutsidePressGuard());
      const guarded = result.current.guard(handler);
      expect(result.current.guard(undefined)).toBeUndefined();

      act(() => result.current.arm());
      guarded?.('first');
      expect(handler).not.toHaveBeenCalled();
      guarded?.('second');
      expect(handler).toHaveBeenCalledWith('second');

      // Armed, but the click lands somewhere that is not the map: the guard comes off right after it.
      act(() => result.current.arm());
      fireEvent.click(document.body);
      act(() => {
        vi.runAllTimers();
      });
      guarded?.('third');
      expect(handler).toHaveBeenCalledWith('third');
    } finally {
      vi.useRealTimers();
    }
  });
});
