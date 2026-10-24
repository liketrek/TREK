/**
 * FE-AI-CARDHOOK-001 to FE-AI-CARDHOOK-004
 *
 * The hooks a card leans on: how it writes numbers for this user, its part
 * of the map (a pin while resting, a pan on a click, the pin gone with the
 * card), and who is signed in.
 */
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildUser } from '../../../../../tests/helpers/factories';
import { TranslationProvider } from '../../../../i18n/TranslationContext';
import { useAssistantStore } from '../../../../store/assistantStore';
import { useAuthStore } from '../../../../store/authStore';
import { useSettingsStore } from '../../../../store/settingsStore';
import { AssistantViewContext } from '../../assistantViewContext';
import { useCardFormat } from './useCardFormat';
import { useCardPoint } from './useCardPoint';
import { useViewerId } from './useViewerId';

const ASSISTANT = useAssistantStore.getState();
const AUTH = useAuthStore.getState();
const SETTINGS = useSettingsStore.getState();

const onRevealMap = vi.fn();

function wrapper({ children }: { children: ReactNode }) {
  return (
    <TranslationProvider>
      <AssistantViewContext.Provider value={{ tripId: 4, variant: 'fullscreen', onRevealMap }}>
        {children}
      </AssistantViewContext.Provider>
    </TranslationProvider>
  );
}

afterEach(() => {
  useAssistantStore.setState(ASSISTANT, true);
  useAuthStore.setState(AUTH, true);
  useSettingsStore.setState(SETTINGS, true);
  vi.clearAllMocks();
});

describe('card hooks', () => {
  it('FE-AI-CARDHOOK-001: numbers follow the user: clock setting, units, money in its currency, minutes as hours', () => {
    useSettingsStore.setState({ settings: { ...SETTINGS.settings, time_format: '12h', distance_unit: 'imperial' } });
    const { result } = renderHook(() => useCardFormat(), { wrapper });
    const format = result.current;
    expect(format.clock('14:30')).toBe('2:30 PM');
    expect(format.distance(10)).toBe('6.2 mi');
    expect(format.elevation(100)).toBe('328 ft');
    expect(format.money({ amount: 12.5, currency: 'USD' })).toBe('$12.50');
    expect(format.minutes(45)).toMatch(/45/);
    expect(format.minutes(120)).toMatch(/^2/);
    expect(format.minutes(135)).toMatch(/2.*15/);
    expect(format.count(1200)).toMatch(/1.?200/);
    expect(format.date('2026-10-22')).toMatch(/22/);
  });

  it('FE-AI-CARDHOOK-002: resting on a spot pins it, a click steps the chat aside and pans there', () => {
    const setPreviewPin = vi.fn();
    const requestCamera = vi.fn();
    useAssistantStore.setState({ setPreviewPin, requestCamera });
    const { result } = renderHook(() => useCardPoint(), { wrapper });
    result.current.hover({ ref: 'r1:0', lat: 45, lng: 7, name: 'Col', placeId: 9 });
    const pin = { tripId: 4, ref: 'r1:0', lat: 45, lng: 7, name: 'Col', placeId: 9 };
    expect(setPreviewPin).toHaveBeenLastCalledWith(pin);
    result.current.hover(null);
    expect(setPreviewPin).toHaveBeenLastCalledWith(null);
    result.current.show({ lat: 45, lng: 7 });
    expect(onRevealMap).toHaveBeenCalled();
    expect(requestCamera).toHaveBeenCalledWith(4, [[45, 7]], 'pan', 'user');
  });

  it('FE-AI-CARDHOOK-003: the pin goes with the card', () => {
    const setPreviewPin = vi.fn();
    useAssistantStore.setState({ setPreviewPin });
    const { unmount } = renderHook(() => useCardPoint(), { wrapper });
    unmount();
    expect(setPreviewPin).toHaveBeenLastCalledWith(null);
  });

  it('FE-AI-CARDHOOK-004: the viewer is the signed-in user, or nobody', () => {
    useAuthStore.setState({ user: buildUser({ id: 7 }) });
    expect(renderHook(() => useViewerId()).result.current).toBe(7);
    useAuthStore.setState({ user: null });
    expect(renderHook(() => useViewerId()).result.current).toBeNull();
  });
});
