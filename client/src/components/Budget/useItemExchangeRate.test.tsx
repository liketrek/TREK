import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { budgetApi } from '../../api/client';
import {
  displayRateToStored,
  formatDisplayRate,
  storedRateToDisplay,
  useItemExchangeRate,
} from './useItemExchangeRate';

vi.mock('../../api/client', () => ({
  budgetApi: { resolveExchangeRate: vi.fn() },
}));

const resolved = (currency = 'USD', exchangeRate = 0.125) => ({
  trip_id: 1,
  trip_currency: 'HKD',
  item_currency: currency,
  exchange_rate: exchangeRate,
  source: 'global' as const,
  source_version: 'global:2026-08-28',
  effective_date: '2026-08-28',
  fetched_at: '2026-08-28T00:00:00.000Z',
  stale: false,
});

describe('rate orientation helpers', () => {
  it('converts between stored and user-facing reciprocal orientation', () => {
    expect(storedRateToDisplay(0.125)).toBe(8);
    expect(displayRateToStored(8)).toBe(0.125);
    expect(formatDisplayRate(0.125)).toBe('8');
    expect(storedRateToDisplay(0)).toBeNull();
  });
});

describe('useItemExchangeRate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows an inherited Trip/Global rate on create but omits it from the write', async () => {
    vi.mocked(budgetApi.resolveExchangeRate).mockResolvedValue(resolved());
    const { result } = renderHook(() => useItemExchangeRate(1, 'USD', 'HKD'));
    await waitFor(() => expect(result.current.value).toBe('8'));
    expect(result.current.suggestion?.source).toBe('global');
    expect(result.current.valid).toBe(true);
    expect(result.current.write).toEqual({});
  });

  it('preserves an existing frozen rate when currency is unchanged', () => {
    const { result } = renderHook(() =>
      useItemExchangeRate(1, 'USD', 'HKD', {
        currency: 'USD',
        exchange_rate: 0.2,
        exchange_rate_source: 'trip',
        exchange_rate_source_version: 'trip:1:USD:v1',
        exchange_rate_note: 'locked at booking',
      })
    );
    expect(result.current.value).toBe('5');
    expect(result.current.note).toBe('locked at booking');
    expect(result.current.write).toEqual({});
    expect(budgetApi.resolveExchangeRate).not.toHaveBeenCalled();
  });

  it('sends a reciprocal explicit rate and note only after manual editing', async () => {
    vi.mocked(budgetApi.resolveExchangeRate).mockResolvedValue(resolved());
    const { result } = renderHook(() => useItemExchangeRate(1, 'USD', 'HKD'));
    await waitFor(() => expect(result.current.value).toBe('8'));
    act(() => {
      result.current.setManualValue('7.8');
      result.current.setNote('card statement');
    });
    expect(result.current.manual).toBe(true);
    expect(result.current.write.exchange_rate).toBeCloseTo(1 / 7.8);
    expect(result.current.write.exchange_rate_note).toBe('card statement');
  });

  it('resolves a new currency and never lets a late response overwrite manual input', async () => {
    let finish: (value: ReturnType<typeof resolved>) => void = () => {};
    vi.mocked(budgetApi.resolveExchangeRate).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    const { result } = renderHook(() => useItemExchangeRate(1, 'USD', 'HKD'));
    act(() => result.current.setManualValue('7.75'));
    await act(async () => finish(resolved()));
    expect(result.current.value).toBe('7.75');
    expect(result.current.manual).toBe(true);
  });

  it('requires a positive manual value when no inherited rate exists', async () => {
    vi.mocked(budgetApi.resolveExchangeRate).mockRejectedValue(new Error('unavailable'));
    const { result } = renderHook(() => useItemExchangeRate(1, 'USD', 'HKD'));
    await waitFor(() => expect(result.current.unavailable).toBe(true));
    expect(result.current.valid).toBe(false);
    act(() => result.current.setManualValue('0'));
    expect(result.current.valid).toBe(false);
    act(() => result.current.setManualValue('7.8'));
    expect(result.current.valid).toBe(true);
  });
});
