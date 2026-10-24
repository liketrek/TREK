import { act, renderHook, waitFor } from '@testing-library/react';
import type { TourListItem, TourPackingLink } from '@trek/shared';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import { TranslationProvider } from '../../../i18n/TranslationContext';
import { tourPackingLinkRepo } from '../../../repo/tourPackingLinkRepo';
import { useAddonStore } from '../../../store/addonStore';
import { useTripStore } from '../../../store/tripStore';
import type { PackingItem } from '../../../types';
import { TourPackingSection } from './TourPackingSection';
import { useTourPackingLink } from './useTourPackingLink';

// FE-TOUR-PACKING-001 to FE-TOUR-PACKING-011

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));

const TOUR = { place_id: 11, name: 'Ridge', tour_type: 'hike' } as TourListItem;
const GEAR: TourPackingLink = { category: 'Hiking gear', linked_at: '2026-10-20 09:00:00' };

let nextId = 1;
function item(name: string, category: string | null, over: Partial<PackingItem> = {}): PackingItem {
  return {
    id: nextId++,
    trip_id: 5,
    name,
    category,
    checked: 0,
    sort_order: nextId,
    quantity: 1,
    ...over,
  } as PackingItem;
}

const ITEMS = [
  item('Boots', 'Hiking gear', { checked: 1 }),
  item('Rain jacket', 'Hiking gear', { quantity: 2 }),
  item('Map', 'Hiking gear'),
  item('Passport', 'Documents'),
  item('...', 'Snacks'),
];

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <TranslationProvider>{children}</TranslationProvider>
    </MemoryRouter>
  );
}

function setPacking(enabled: boolean) {
  useAddonStore.setState({
    addons: [
      { id: 'tours', enabled: true },
      { id: 'packing', enabled },
    ] as never,
  });
}

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
  setPacking(true);
  useTripStore.setState({ packingItems: ITEMS });
  vi.spyOn(tourPackingLinkRepo, 'read').mockResolvedValue(null);
});
afterEach(() => vi.restoreAllMocks());

describe('useTourPackingLink', () => {
  it('FE-TOUR-PACKING-001: reads the link, shows its items live and offers every category with its colour', async () => {
    vi.mocked(tourPackingLinkRepo.read).mockResolvedValue(GEAR);
    const { result } = renderHook(() => useTourPackingLink({ tripId: 5, tour: TOUR }), { wrapper });
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(tourPackingLinkRepo.read).toHaveBeenCalledWith(5, 11, expect.any(AbortSignal));
    expect(result.current.linked).toMatchObject({ state: 'ready', packed: 1 });
    expect(result.current.linked?.items.map((entry) => entry.name)).toEqual(['Boots', 'Rain jacket', 'Map']);
    expect(result.current.categories.map(({ name, count }) => [name, count])).toEqual([
      ['Hiking gear', 3],
      ['Documents', 1],
      ['Snacks', 0],
    ]);
    expect(result.current.linkedColor).toBe(result.current.categories[0]?.color);
    expect(result.current.wholeCount).toBe(4);

    // Ticking an item off in Packing shows here at once.
    act(() => useTripStore.setState({ packingItems: ITEMS.map((entry) => ({ ...entry, checked: 1 })) }));
    expect(result.current.linked?.packed).toBe(3);
  });

  it('FE-TOUR-PACKING-002: the dialog starts on what the tour points at and links the choice only on confirm', async () => {
    vi.mocked(tourPackingLinkRepo.read).mockResolvedValue(GEAR);
    const link = vi.spyOn(tourPackingLinkRepo, 'link').mockResolvedValue({ category: 'Documents', linked_at: 'now' });
    const { result } = renderHook(() => useTourPackingLink({ tripId: 5, tour: TOUR }), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    act(() => result.current.show());
    expect(result.current.open).toBe(true);
    expect(result.current.choice).toBe('Hiking gear');
    // The same choice again would change nothing.
    expect(result.current.canConfirm).toBe(false);
    act(() => result.current.choose('Documents'));
    expect(result.current.canConfirm).toBe(true);
    await act(() => result.current.confirm());
    expect(link).toHaveBeenCalledWith(5, 11, { category: 'Documents' });
    expect(result.current.link?.category).toBe('Documents');
    expect(result.current.open).toBe(false);
    expect(toast.success).toHaveBeenCalledWith('Packing list linked.');
  });

  it('FE-TOUR-PACKING-003: a refused write keeps the dialog and says why; letting go answers no link', async () => {
    vi.mocked(tourPackingLinkRepo.read).mockResolvedValue(GEAR);
    vi.spyOn(tourPackingLinkRepo, 'link').mockRejectedValue(new Error('boom'));
    const unlink = vi.spyOn(tourPackingLinkRepo, 'unlink').mockResolvedValue(null);
    const { result } = renderHook(() => useTourPackingLink({ tripId: 5, tour: TOUR }), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    act(() => result.current.show());
    act(() => result.current.choose(null));
    await act(() => result.current.confirm());
    expect(toast.error).toHaveBeenCalledWith('The link could not be saved.');
    expect(result.current.open).toBe(true);

    await act(() => result.current.unlink());
    expect(unlink).toHaveBeenCalledWith(5, 11);
    expect(result.current.link).toBeNull();
    expect(toast.success).toHaveBeenCalledWith('Link removed. The packing list stays as it is.');
  });

  it('FE-TOUR-PACKING-004: a failed read says so and is read again on retry; a reloaded tour reads again', async () => {
    vi.mocked(tourPackingLinkRepo.read).mockRejectedValueOnce(new Error('500'));
    const { result, rerender } = renderHook(({ tour }) => useTourPackingLink({ tripId: 5, tour }), {
      wrapper,
      initialProps: { tour: TOUR },
    });
    await waitFor(() => expect(result.current.status).toBe('error'));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(tourPackingLinkRepo.read).toHaveBeenCalledTimes(2);
    rerender({ tour: { ...TOUR } });
    await waitFor(() => expect(tourPackingLinkRepo.read).toHaveBeenCalledTimes(3));
  });
});

describe('TourPackingSection', () => {
  const section = (canEdit = true, onOpenPacking?: () => void) =>
    render(
      <TourPackingSection tripId={5} tour={TOUR} tourName="Ridge" canEdit={canEdit} onOpenPacking={onOpenPacking} />
    );

  it('FE-TOUR-PACKING-005: without a link it offers to link one, and links a category through the dialog', async () => {
    const link = vi.spyOn(tourPackingLinkRepo, 'link').mockResolvedValue(GEAR);
    section();
    expect(await screen.findByText('No packing list linked')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Link a packing list'));
    const whole = await screen.findByTestId('tour-packing-choice-whole');
    expect(whole).toHaveAttribute('aria-checked', 'true');
    expect(within(whole).getByText('4')).toBeInTheDocument();
    expect(screen.queryByTestId('tour-packing-unlink')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('tour-packing-choice-Hiking gear'));
    fireEvent.click(screen.getByTestId('tour-packing-confirm'));
    await waitFor(() => expect(link).toHaveBeenCalledWith(5, 11, { category: 'Hiking gear' }));
    expect(await screen.findByTestId('tour-packing-card')).toBeInTheDocument();
  });

  it('FE-TOUR-PACKING-006: a linked category shows its items, how many are packed, and opens Packing', async () => {
    vi.mocked(tourPackingLinkRepo.read).mockResolvedValue(GEAR);
    const open = vi.fn();
    section(true, open);
    const card = await screen.findByTestId('tour-packing-card');
    expect(within(card).getByText('Hiking gear')).toBeInTheDocument();
    expect(within(card).getByText('1 of 3 packed')).toBeInTheDocument();
    expect(within(card).getByText('Rain jacket')).toBeInTheDocument();
    expect(within(card).getByText('×2')).toBeInTheDocument();
    expect(within(card).queryByText('Passport')).not.toBeInTheDocument();
    fireEvent.click(within(card).getByText('Open packing list'));
    expect(open).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Change')).toBeInTheDocument();
  });

  it('FE-TOUR-PACKING-007: a long list shows its first items and how many more; all packed says so', async () => {
    const many = Array.from({ length: 8 }, (_, index) => item(`Thing ${index + 1}`, 'Bulk', { checked: 1 }));
    useTripStore.setState({ packingItems: many });
    vi.mocked(tourPackingLinkRepo.read).mockResolvedValue({ category: null, linked_at: 'x' });
    section(false);
    const card = await screen.findByTestId('tour-packing-card');
    expect(within(card).getByText('Whole packing list')).toBeInTheDocument();
    expect(within(card).getByText('+3 more')).toBeInTheDocument();
    expect(within(card).getByText('All packed')).toBeInTheDocument();
    expect(within(card).queryByText('Open packing list')).not.toBeInTheDocument();
    // Read only: no way to change the link.
    expect(screen.queryByText('Change')).not.toBeInTheDocument();
  });

  it('FE-TOUR-PACKING-008: a category with no item to see reads as missing, an empty one as empty', async () => {
    vi.mocked(tourPackingLinkRepo.read).mockResolvedValue({ category: 'Climbing', linked_at: 'x' });
    const { unmount } = section();
    expect(await screen.findByText('“Climbing” has no items you can see any more.')).toBeInTheDocument();
    unmount();

    vi.mocked(tourPackingLinkRepo.read).mockResolvedValue({ category: 'Snacks', linked_at: 'x' });
    section();
    expect(await screen.findByText('“Snacks” has no items yet.')).toBeInTheDocument();
  });

  it('FE-TOUR-PACKING-009: with Packing off a link is shown dimmed and can be let go, and without one nothing shows', async () => {
    setPacking(false);
    vi.mocked(tourPackingLinkRepo.read).mockResolvedValue(GEAR);
    const unlink = vi.spyOn(tourPackingLinkRepo, 'unlink').mockResolvedValue(null);
    section();
    expect(await screen.findByText('Packing lists are switched off, so the list cannot be shown.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Remove link'));
    // One click only asks: the dialog shows the dimmed link, nothing to choose and no way to link again.
    expect(unlink).not.toHaveBeenCalled();
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByTestId('tour-packing-dimmed')).toBeInTheDocument();
    expect(within(dialog).queryByTestId('tour-packing-choice-whole')).not.toBeInTheDocument();
    expect(within(dialog).queryByTestId('tour-packing-confirm')).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByTestId('tour-packing-unlink'));
    await waitFor(() => expect(unlink).toHaveBeenCalledWith(5, 11));
    await waitFor(() => expect(screen.queryByTestId('tour-packing-section')).not.toBeInTheDocument());
  });

  it('FE-TOUR-PACKING-011: with Packing off, cancelling the question keeps the link', async () => {
    setPacking(false);
    vi.mocked(tourPackingLinkRepo.read).mockResolvedValue(GEAR);
    const unlink = vi.spyOn(tourPackingLinkRepo, 'unlink').mockResolvedValue(null);
    section();
    fireEvent.click(await screen.findByText('Remove link'));
    fireEvent.click(within(await screen.findByRole('dialog')).getByText('Cancel'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(unlink).not.toHaveBeenCalled();
    expect(screen.getByTestId('tour-packing-dimmed')).toBeInTheDocument();
  });

  it('FE-TOUR-PACKING-010: a failed read is said, with a retry', async () => {
    vi.mocked(tourPackingLinkRepo.read).mockRejectedValueOnce(new Error('500'));
    section();
    expect(await screen.findByText('The packing link could not be loaded.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    expect(await screen.findByText('No packing list linked')).toBeInTheDocument();
  });
});
