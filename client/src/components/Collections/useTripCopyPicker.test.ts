// FE-COMP-TRIPCOPYHOOK-001 to FE-COMP-TRIPCOPYHOOK-009: the "Copy to trip" picker logic
// behind both the desktop dialog and the phone sheet.
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock, type MockInstance } from 'vitest';

import { tripsApi } from '../../api/client';
import { formatDate } from '../../utils/formatters';
import { filterTripOptions, useTripCopyPicker, type TripCopyPickerOptions, type TripOption } from './useTripCopyPicker';

vi.mock('../../i18n', () => ({
  useTranslation: () => ({ language: 'en' }),
}));

const t = (k: string, p?: Record<string, unknown>) => (p ? `${k}:${JSON.stringify(p)}` : k);

const PARIS: TripOption = { id: 1, title: 'Paris', start_date: '2031-05-01', end_date: '2031-05-04' };
const ROME: TripOption = { id: 2, title: 'Rome', start_date: '2031-06-01', end_date: null };
const OSLO: TripOption = { id: 3, title: 'Oslo' };

let addToast: Mock<NonNullable<Window['__addToast']>>;
let list: MockInstance<typeof tripsApi.list>;

function setup(over: Partial<TripCopyPickerOptions> = {}) {
  const props: TripCopyPickerOptions = {
    open: true,
    onCopy: vi.fn().mockResolvedValue({ copied: 2, skipped: [] }),
    onClose: vi.fn(),
    t,
    ...over,
  };
  const hook = renderHook((p: TripCopyPickerOptions) => useTripCopyPicker(p), { initialProps: props });
  return { ...hook, props };
}

beforeEach(() => {
  addToast = vi.fn<NonNullable<Window['__addToast']>>();
  window.__addToast = addToast;
  list = vi.spyOn(tripsApi, 'list').mockResolvedValue({ trips: [PARIS, ROME, OSLO] });
});

afterEach(() => {
  vi.restoreAllMocks();
  delete window.__addToast;
});

describe('filterTripOptions', () => {
  it('FE-COMP-TRIPCOPYHOOK-001: matches the trimmed, case folded query against the title', () => {
    expect(filterTripOptions([PARIS, ROME], '  ')).toEqual([PARIS, ROME]);
    expect(filterTripOptions([PARIS, ROME], ' rO ')).toEqual([ROME]);
  });
});

describe('useTripCopyPicker', () => {
  it('FE-COMP-TRIPCOPYHOOK-002: loads the trips on open and narrows them by the search', async () => {
    const { result } = setup();
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.filtered).toEqual([PARIS, ROME, OSLO]);
    act(() => result.current.setSearch('osl'));
    expect(result.current.filtered).toEqual([OSLO]);
  });

  it('FE-COMP-TRIPCOPYHOOK-003: nothing loads while closed, and reopening clears the search and reloads', async () => {
    const { result, rerender, props } = setup({ open: false });
    expect(list).not.toHaveBeenCalled();
    rerender({ ...props, open: true });
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setSearch('rome'));
    rerender({ ...props, open: false });
    rerender({ ...props, open: true });
    expect(result.current.search).toBe('');
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
  });

  it('FE-COMP-TRIPCOPYHOOK-004: an empty list when loading fails', async () => {
    list.mockRejectedValueOnce(new Error('offline'));
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.filtered).toEqual([]);
  });

  it('FE-COMP-TRIPCOPYHOOK-005: the date range joins both ends, or shows the one there is', () => {
    const { result } = setup();
    expect(result.current.dateRange(PARIS)).toBe(
      `${formatDate('2031-05-01', 'en')} – ${formatDate('2031-05-04', 'en')}`
    );
    expect(result.current.dateRange(ROME)).toBe(formatDate('2031-06-01', 'en'));
    expect(result.current.dateRange(OSLO)).toBe('');
  });

  it('FE-COMP-TRIPCOPYHOOK-006: a pick copies, toasts the copied count and closes', async () => {
    const { result, props } = setup();
    await act(async () => {
      await result.current.handleCopy(1);
    });
    expect(props.onCopy).toHaveBeenCalledWith(1);
    expect(addToast).toHaveBeenCalledWith('collections.copiedCount:{"count":2}', 'success', undefined);
    expect(addToast).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(result.current.busyTripId).toBeNull();
  });

  it('FE-COMP-TRIPCOPYHOOK-007: skipped duplicates and an empty result get their own notes', async () => {
    const onCopy = vi
      .fn()
      .mockResolvedValueOnce({ copied: 0, skipped: [{ id: 5, name: 'Louvre' }] })
      .mockResolvedValueOnce({ copied: 0, skipped: [] });
    const { result } = setup({ onCopy });
    await act(async () => {
      await result.current.handleCopy(1);
    });
    expect(addToast).toHaveBeenCalledWith('collections.skippedDuplicates:{"count":1}', 'info', undefined);
    await act(async () => {
      await result.current.handleCopy(1);
    });
    expect(addToast).toHaveBeenLastCalledWith('collections.copyNothing', 'info', undefined);
  });

  it('FE-COMP-TRIPCOPYHOOK-008: a failed copy toasts the server message and stays open', async () => {
    const onCopy = vi.fn().mockRejectedValue({ response: { data: { error: 'No access' } } });
    const { result, props } = setup({ onCopy });
    await act(async () => {
      await result.current.handleCopy(2);
    });
    expect(addToast).toHaveBeenCalledWith('No access', 'error', undefined);
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('FE-COMP-TRIPCOPYHOOK-009: one copy at a time, and none at all for an empty selection', async () => {
    let finish: (v: { copied: number; skipped: [] }) => void = () => {};
    const onCopy = vi.fn().mockReturnValueOnce(
      new Promise((r) => {
        finish = r;
      })
    );
    const { result } = setup({ onCopy });
    act(() => {
      void result.current.handleCopy(1);
    });
    expect(result.current.busyTripId).toBe(1);
    await act(async () => {
      await result.current.handleCopy(2);
    });
    expect(onCopy).toHaveBeenCalledTimes(1);
    act(() => finish({ copied: 1, skipped: [] }));
    await waitFor(() => expect(result.current.busyTripId).toBeNull());

    const empty = setup({ emptySelection: true });
    await act(async () => {
      await empty.result.current.handleCopy(1);
    });
    expect(empty.props.onCopy).not.toHaveBeenCalled();
  });
});
