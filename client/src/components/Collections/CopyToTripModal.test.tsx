// FE-COMP-COPYTRIP-001 to FE-COMP-COPYTRIP-016
import React from 'react';
import { afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { tripsApi } from '../../api/client';
import { useTranslation } from '../../i18n/TranslationContext';
import CopyToTripModal from './CopyToTripModal';

type ModalProps = Omit<React.ComponentProps<typeof CopyToTripModal>, 't'>;
type CopyResult = { copied: number; skipped: { id: number; name: string }[] };

function Harness(props: ModalProps): React.ReactElement {
  const { t } = useTranslation();
  return <CopyToTripModal {...props} t={t} />;
}

const TRIPS = [
  { id: 1, title: 'Rome 2026', start_date: '2026-04-02', end_date: '2026-04-09', cover_image: '/uploads/covers/rome.jpg' },
  { id: 2, title: 'Tokyo', start_date: null, end_date: null, cover_image: null },
];

let addToast: ReturnType<typeof vi.fn>;

function renderModal(overrides: Partial<ModalProps> = {}) {
  const props: ModalProps = {
    isOpen: true,
    onClose: vi.fn(),
    placeIds: [7],
    onCopy: vi.fn(async () => ({ copied: 1, skipped: [] })),
    ...overrides,
  };
  render(<Harness {...props} />);
  return props;
}

beforeEach(() => {
  addToast = vi.fn();
  window.__addToast = addToast as unknown as typeof window.__addToast;
  vi.spyOn(tripsApi, 'list').mockResolvedValue({ trips: TRIPS });
});

afterEach(() => {
  vi.restoreAllMocks();
  delete window.__addToast;
});

describe('CopyToTripModal', () => {
  it('FE-COMP-COPYTRIP-001: lists the user trips with their date range once loaded', async () => {
    renderModal();
    expect(await screen.findByText('Rome 2026')).toBeInTheDocument();
    const rome = screen.getByRole('button', { name: /Rome 2026/ });
    expect(within(rome).getByText(/Apr 2 – .*Apr 9/)).toBeInTheDocument();
    // A trip without dates renders no date row at all.
    const tokyo = screen.getByRole('button', { name: /Tokyo/ });
    expect(tokyo.querySelector('.lucide-calendar-days')).toBeNull();
  });

  it('FE-COMP-COPYTRIP-015: a trips response landing after the modal closed is dropped', async () => {
    const closed = <Harness isOpen onClose={vi.fn()} placeIds={[7]} onCopy={vi.fn(async () => ({ copied: 0, skipped: [] }))} />;

    let resolve!: (v: { trips: typeof TRIPS }) => void;
    const spy = vi.spyOn(tripsApi, 'list').mockReturnValue(new Promise(r => { resolve = r; }));
    render(closed).unmount();
    resolve({ trips: TRIPS });
    await Promise.resolve();
    expect(screen.queryByText('Rome 2026')).not.toBeInTheDocument();

    // Same for a rejection — no "no trips" state is written into an unmounted tree.
    let reject!: (e: Error) => void;
    spy.mockReturnValue(new Promise((_, r) => { reject = r; }));
    render(closed).unmount();
    reject(new Error('offline'));
    await Promise.resolve();
    expect(screen.queryByText('No trips yet')).not.toBeInTheDocument();
  });

  it('FE-COMP-COPYTRIP-016: a trip without a title still renders and stays filterable', async () => {
    vi.spyOn(tripsApi, 'list').mockResolvedValue({ trips: [{ id: 8, title: null }, ...TRIPS] });
    renderModal();

    await screen.findByText('Rome 2026');
    fireEvent.change(screen.getByPlaceholderText('Search trips'), { target: { value: 'rome' } });
    expect(screen.getByText('Rome 2026')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Rome 2026|Tokyo/ })).toHaveLength(1);
  });

  it('FE-COMP-COPYTRIP-014: a one-sided date range falls back to the single date it has', async () => {
    vi.spyOn(tripsApi, 'list').mockResolvedValue({
      trips: [
        { id: 3, title: 'Open ended', start_date: '2026-04-02', end_date: null },
        { id: 4, title: 'Return only', start_date: null, end_date: '2026-04-09' },
      ],
    });
    renderModal();
    await screen.findByText('Open ended');
    expect(within(screen.getByRole('button', { name: /Open ended/ })).getByText(/Apr 2/)).toBeInTheDocument();
    expect(within(screen.getByRole('button', { name: /Return only/ })).getByText(/Apr 9/)).toBeInTheDocument();
  });

  it('FE-COMP-COPYTRIP-002: a cover image replaces the pin placeholder', async () => {
    renderModal();
    await screen.findByText('Rome 2026');
    const rome = screen.getByRole('button', { name: /Rome 2026/ });
    expect(rome.querySelector('img')).toHaveAttribute('src', '/uploads/covers/rome.jpg');
    expect(screen.getByRole('button', { name: /Tokyo/ }).querySelector('.lucide-map-pin')).not.toBeNull();
  });

  it('FE-COMP-COPYTRIP-003: the title is singular for one place and counted for a bulk copy', async () => {
    const { unmount } = render(<Harness {...{ isOpen: true, onClose: vi.fn(), placeIds: [7], onCopy: vi.fn(async () => ({ copied: 1, skipped: [] })) }} />);
    expect(await screen.findByRole('heading', { name: 'Copy to trip' })).toBeInTheDocument();
    unmount();

    renderModal({ placeIds: [7, 8, 9] });
    expect(await screen.findByRole('heading', { name: 'Copy 3 to trip' })).toBeInTheDocument();
  });

  it('FE-COMP-COPYTRIP-004: shows the spinner until the trips arrive', async () => {
    let resolve!: (v: { trips: typeof TRIPS }) => void;
    vi.spyOn(tripsApi, 'list').mockReturnValue(new Promise(r => { resolve = r; }));
    renderModal();
    expect(document.querySelector('.animate-spin')).not.toBeNull();

    resolve({ trips: TRIPS });
    expect(await screen.findByText('Rome 2026')).toBeInTheDocument();
  });

  it('FE-COMP-COPYTRIP-005: an empty or failing trips response shows the no-trips copy', async () => {
    vi.spyOn(tripsApi, 'list').mockResolvedValue({});
    const { unmount } = render(<Harness {...{ isOpen: true, onClose: vi.fn(), placeIds: [7], onCopy: vi.fn(async () => ({ copied: 0, skipped: [] })) }} />);
    expect(await screen.findByText('No trips yet')).toBeInTheDocument();
    unmount();

    vi.spyOn(tripsApi, 'list').mockRejectedValue(new Error('offline'));
    renderModal();
    expect(await screen.findByText('No trips yet')).toBeInTheDocument();
  });

  it('FE-COMP-COPYTRIP-006: requests nothing and renders nothing while closed', () => {
    const spy = vi.spyOn(tripsApi, 'list').mockResolvedValue({ trips: TRIPS });
    renderModal({ isOpen: false });
    expect(spy).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: /Copy/ })).not.toBeInTheDocument();
  });

  it('FE-COMP-COPYTRIP-007: the search box filters trips by title, case-insensitively', async () => {
    renderModal();
    const search = await screen.findByPlaceholderText('Search trips');

    fireEvent.change(search, { target: { value: 'rome' } });
    expect(screen.getByText('Rome 2026')).toBeInTheDocument();
    expect(screen.queryByText('Tokyo')).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'nope' } });
    expect(screen.getByText('No trips yet')).toBeInTheDocument();
  });

  it('FE-COMP-COPYTRIP-008: picking a trip copies, reports the count and closes', async () => {
    const onCopy = vi.fn(async (): Promise<CopyResult> => ({ copied: 2, skipped: [] }));
    const props = renderModal({ onCopy });

    fireEvent.click(await screen.findByText('Rome 2026'));

    await waitFor(() => expect(props.onClose).toHaveBeenCalled());
    expect(onCopy).toHaveBeenCalledWith(1);
    expect(addToast).toHaveBeenCalledWith('Copied 2 places', 'success', undefined);
  });

  it('FE-COMP-COPYTRIP-009: server-side duplicates are reported alongside the copied count', async () => {
    const onCopy = vi.fn(async (): Promise<CopyResult> => ({ copied: 1, skipped: [{ id: 9, name: 'Colosseum' }] }));
    renderModal({ onCopy });

    fireEvent.click(await screen.findByText('Rome 2026'));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Skipped 1 duplicates', 'info', undefined));
    expect(addToast).toHaveBeenCalledWith('Copied 1 places', 'success', undefined);
  });

  it('FE-COMP-COPYTRIP-010: a no-op copy says so instead of staying silent', async () => {
    const onCopy = vi.fn(async (): Promise<CopyResult> => ({ copied: 0, skipped: [] }));
    renderModal({ onCopy });

    fireEvent.click(await screen.findByText('Rome 2026'));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Nothing to copy', 'info', undefined));
    expect(addToast).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-COPYTRIP-011: a failed copy surfaces the server message and keeps the modal open', async () => {
    const onCopy = vi.fn((): Promise<CopyResult> => Promise.reject({ response: { data: { error: 'Trip is locked' } } }));
    const props = renderModal({ onCopy });

    fireEvent.click(await screen.findByText('Rome 2026'));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Trip is locked', 'error', undefined));
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('FE-COMP-COPYTRIP-012: a second click while a copy is running is ignored', async () => {
    let resolve!: (v: CopyResult) => void;
    const onCopy = vi.fn(() => new Promise<CopyResult>(r => { resolve = r; }));
    const props = renderModal({ onCopy });

    fireEvent.click(await screen.findByText('Rome 2026'));
    fireEvent.click(screen.getByText('Tokyo'));
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /Rome 2026/ })).toBeDisabled();

    resolve({ copied: 1, skipped: [] });
    await waitFor(() => expect(props.onClose).toHaveBeenCalled());
  });

  it('FE-COMP-COPYTRIP-013: an empty selection never reaches the copy handler and Escape closes', async () => {
    const user = userEvent.setup();
    const props = renderModal({ placeIds: [] });

    fireEvent.click(await screen.findByText('Rome 2026'));
    expect(props.onCopy).not.toHaveBeenCalled();

    await user.keyboard('{Escape}');
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
