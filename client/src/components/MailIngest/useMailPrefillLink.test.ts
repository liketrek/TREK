// FE-MAIL-PREFILL-001 to FE-MAIL-PREFILL-003: "Fill in yourself" opens the booking form in the trip.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { BookingImportPreviewItem } from '@trek/shared';
import { createElement, type ReactNode } from 'react';
import { MemoryRouter, useSearchParams } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { useMailIngestStore } from '../../store/mailIngestStore';

const repo = vi.hoisted(() => ({ prefill: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../../repo/mailIngestRepo', () => ({ mailIngestRepo: repo }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));

const { useMailPrefillLink } = await import('./useMailPrefillLink');

const ITEM = { type: 'hotel', title: 'Hotel Roma' } as BookingImportPreviewItem;

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    MemoryRouter,
    { initialEntries: ['/trips/5?mailPrefill=12'] },
    createElement(TranslationProvider, null, children)
  );

function setup() {
  const startImportReview = vi.fn();
  const view = renderHook(
    () => {
      const [searchParams, setSearchParams] = useSearchParams();
      useMailPrefillLink({ searchParams, setSearchParams, loaded: true, startImportReview });
      return { searchParams, setSearchParams };
    },
    { wrapper }
  );
  return { ...view, startImportReview };
}

beforeEach(() => {
  vi.clearAllMocks();
  repo.prefill.mockResolvedValue({ trip_id: 5, item: ITEM });
});

describe('useMailPrefillLink', () => {
  it('FE-MAIL-PREFILL-001: opens the form once and takes the parameter out of the address', async () => {
    const { result, startImportReview } = setup();
    await waitFor(() => expect(startImportReview).toHaveBeenCalledTimes(1));
    expect(startImportReview.mock.calls[0].slice(0, 3)).toEqual([[ITEM], [], 'bookings']);
    expect(repo.prefill).toHaveBeenCalledWith(12);
    expect(result.current.searchParams.get('mailPrefill')).toBeNull();
  });

  it('FE-MAIL-PREFILL-002: the same entry asked for again in the open trip opens the form again', async () => {
    const { result, startImportReview } = setup();
    await waitFor(() => expect(startImportReview).toHaveBeenCalledTimes(1));
    act(() => result.current.setSearchParams({ mailPrefill: '12' }));
    await waitFor(() => expect(startImportReview).toHaveBeenCalledTimes(2));
    expect(result.current.searchParams.get('mailPrefill')).toBeNull();
  });

  it('FE-MAIL-PREFILL-003: a saved booking sets the entry aside, and a refused one reads the inbox again', async () => {
    const act$ = vi.fn().mockResolvedValue({});
    const loadInbox = vi.fn().mockResolvedValue(undefined);
    useMailIngestStore.setState({ act: act$, loadInbox });
    const { startImportReview } = setup();
    await waitFor(() => expect(startImportReview).toHaveBeenCalledTimes(1));
    const onSaved = startImportReview.mock.calls[0][3] as () => void;
    onSaved();
    expect(act$).toHaveBeenCalledWith(12, 'discard');
    expect(loadInbox).not.toHaveBeenCalled();
    act$.mockRejectedValueOnce(new Error('decided already'));
    onSaved();
    await waitFor(() => expect(loadInbox).toHaveBeenCalledTimes(1));
  });
});
