/**
 * FE-AI-RT-030 to FE-AI-RT-032
 *
 * The road trip cards' part of the map: a day pointed at draws its drive,
 * the drive goes when the pointer does and when the card goes; showing a
 * day selects it in the planner, steps the chat aside and fits the map.
 */
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FLORENCE_DAY } from '../../../../../tests/helpers/assistantRoadtrip';
import { useAssistantStore } from '../../../../store/assistantStore';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import { useRoadtripCardMap } from './useRoadtripCardMap';

const INITIAL = useAssistantStore.getState();

afterEach(() => {
  useAssistantStore.setState(INITIAL, true);
});

function wrapper(view: AssistantView) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <AssistantViewContext.Provider value={view}>{children}</AssistantViewContext.Provider>;
  };
}

describe('useRoadtripCardMap', () => {
  it('FE-AI-RT-030: a day pointed at draws its drive, which goes with the pointer and with the card', () => {
    const { result, unmount } = renderHook(() => useRoadtripCardMap(), {
      wrapper: wrapper({ tripId: 4, variant: 'window' }),
    });
    act(() => result.current.hoverDay('call_1', FLORENCE_DAY, '#0a84ff'));
    expect(useAssistantStore.getState().routePreview).toEqual({
      tripId: 4,
      ref: 'call_1',
      lines: FLORENCE_DAY.lines,
      color: '#0a84ff',
    });
    act(() => result.current.hoverDay('call_1', null, ''));
    expect(useAssistantStore.getState().routePreview).toBeNull();
    act(() => result.current.hoverDay('call_1', FLORENCE_DAY, '#0a84ff'));
    unmount();
    expect(useAssistantStore.getState().routePreview).toBeNull();
  });

  it('FE-AI-RT-032: a card going or its pointer leaving never takes away a drive another card drew', () => {
    const { result, unmount } = renderHook(() => useRoadtripCardMap(), {
      wrapper: wrapper({ tripId: 4, variant: 'window' }),
    });
    act(() => result.current.hoverDay('call_1', FLORENCE_DAY, '#0a84ff'));
    const other = { tripId: 4, ref: 'tour_9', lines: FLORENCE_DAY.lines, color: '#ff9f0a' };
    act(() => useAssistantStore.getState().setRoutePreview(other));
    act(() => result.current.hoverDay('call_1', null, ''));
    expect(useAssistantStore.getState().routePreview).toEqual(other);
    unmount();
    expect(useAssistantStore.getState().routePreview).toEqual(other);
  });

  it('FE-AI-RT-031: showing a day selects it, steps the chat aside and fits the map to its drive', () => {
    const onFocusDay = vi.fn();
    const onRevealMap = vi.fn();
    const { result } = renderHook(() => useRoadtripCardMap(), {
      wrapper: wrapper({ tripId: 4, variant: 'fullscreen', onFocusDay, onRevealMap }),
    });
    act(() => result.current.showDay(FLORENCE_DAY));
    expect(onFocusDay).toHaveBeenCalledWith(32);
    expect(onRevealMap).toHaveBeenCalledTimes(1);
    expect(useAssistantStore.getState().camera).toMatchObject({
      tripId: 4,
      points: FLORENCE_DAY.lines[0],
      mode: 'fit',
      why: 'user',
    });
    act(() => result.current.showPoints([]));
    expect(onRevealMap).toHaveBeenCalledTimes(1);
  });
});
