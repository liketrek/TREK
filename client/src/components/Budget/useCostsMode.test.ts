// FE-BUDGET-COSTSMODE-001 to FE-BUDGET-COSTSMODE-003
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTrip } from '../../../tests/helpers/factories';
import { resetAllStores } from '../../../tests/helpers/store';
import { useTripStore, type TripStoreState } from '../../store/tripStore';
import { useCostsMode } from './useCostsMode';

let updateTrip: ReturnType<typeof vi.fn>;
let addToast: ReturnType<typeof vi.fn>;

const trip = (costsMode?: 'split' | 'totals') => buildTrip({ id: 7, ...(costsMode ? { costs_mode: costsMode } : {}) });

beforeEach(() => {
  resetAllStores();
  updateTrip = vi.fn(async () => buildTrip({ id: 7 }));
  useTripStore.setState({ updateTrip } as unknown as Partial<TripStoreState>);
  addToast = vi.fn();
  (window as unknown as { __addToast: unknown }).__addToast = addToast;
});

afterEach(() => {
  delete (window as unknown as { __addToast?: unknown }).__addToast;
});

describe('useCostsMode (#1714)', () => {
  it('FE-BUDGET-COSTSMODE-001: a trip splits its costs until it says otherwise, and keeps totals only when it does', () => {
    expect(renderHook(() => useCostsMode(trip(), 2, true)).result.current.splitting).toBe(true);
    expect(renderHook(() => useCostsMode(trip('split'), 2, true)).result.current.splitting).toBe(true);
    expect(renderHook(() => useCostsMode(trip('totals'), 2, true)).result.current.splitting).toBe(false);
  });

  it('FE-BUDGET-COSTSMODE-002: the switch is offered to whoever may edit the costs, on a trip of more than one', () => {
    expect(renderHook(() => useCostsMode(trip(), 2, true)).result.current.offered).toBe(true);
    expect(renderHook(() => useCostsMode(trip(), 1, true)).result.current.offered).toBe(false);
    expect(renderHook(() => useCostsMode(trip(), 3, false)).result.current.offered).toBe(false);
  });

  it('FE-BUDGET-COSTSMODE-003: switching saves the mode on the trip, and a failure says so', async () => {
    const { result } = renderHook(() => useCostsMode(trip(), 2, true));
    await act(async () => {
      await result.current.setSplitting(false);
    });
    expect(updateTrip).toHaveBeenCalledWith(7, { costs_mode: 'totals' });
    expect(result.current.saving).toBe(false);

    updateTrip.mockRejectedValueOnce(new Error('offline'));
    await act(async () => {
      await result.current.setSplitting(true);
    });
    expect(updateTrip).toHaveBeenLastCalledWith(7, { costs_mode: 'split' });
    expect(addToast.mock.calls.map((c) => c[1])).toContain('error');
    expect(result.current.saving).toBe(false);
  });
});
