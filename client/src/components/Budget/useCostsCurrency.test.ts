// FE-BUDGET-COSTSCUR-001 to FE-BUDGET-COSTSCUR-003
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { buildTrip } from '../../../tests/helpers/factories';
import { resetAllStores } from '../../../tests/helpers/store';
import { useSettingsStore } from '../../store/settingsStore';
import { useCostsCurrency } from './useCostsCurrency';

const trip = buildTrip({ id: 7, currency: 'VND' });

function setDisplayCurrency(currency: string) {
  useSettingsStore.setState((s) => ({ settings: { ...s.settings, default_currency: currency } }));
}

beforeEach(() => {
  resetAllStores();
  localStorage.removeItem('trek:costs-currency:7');
  localStorage.removeItem('trek:costs-currency:8');
});

describe('useCostsCurrency (#1683)', () => {
  it('FE-BUDGET-COSTSCUR-001: reads in the display currency, else in the trip currency, both on top of the picker', () => {
    setDisplayCurrency('SGD');
    const { result } = renderHook(() => useCostsCurrency(7, trip));
    expect(result.current.base).toBe('SGD');
    expect(result.current.baseOptions.slice(0, 2).map((o) => o.value)).toEqual(['SGD', 'VND']);
    setDisplayCurrency('');
    expect(renderHook(() => useCostsCurrency(7, trip)).result.current.base).toBe('VND');
  });

  it('FE-BUDGET-COSTSCUR-002: another currency is kept for this trip in this browser, and the usual one drops it', () => {
    setDisplayCurrency('SGD');
    const { result, rerender } = renderHook(({ id }) => useCostsCurrency(id, trip), { initialProps: { id: 7 } });
    act(() => result.current.setBase('vnd'));
    expect(result.current.base).toBe('VND');
    expect(localStorage.getItem('trek:costs-currency:7')).toBe('VND');
    // Opened again later, the trip still reads in it; another trip does not.
    expect(renderHook(() => useCostsCurrency(7, trip)).result.current.base).toBe('VND');
    rerender({ id: 8 });
    expect(result.current.base).toBe('SGD');
    rerender({ id: 7 });
    act(() => result.current.setBase('SGD'));
    expect(result.current.base).toBe('SGD');
    expect(localStorage.getItem('trek:costs-currency:7')).toBeNull();
  });

  it('FE-BUDGET-COSTSCUR-003: once the pick is dropped, a new display currency in Settings applies again', () => {
    setDisplayCurrency('SGD');
    const { result } = renderHook(() => useCostsCurrency(7, trip));
    act(() => result.current.setBase('SGD'));
    act(() => setDisplayCurrency('EUR'));
    expect(result.current.base).toBe('EUR');
  });
});
