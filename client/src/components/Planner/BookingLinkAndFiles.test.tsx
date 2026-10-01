// FE-PLANNER-LINKFILES-001 to FE-PLANNER-LINKFILES-014
import { createRef, type ComponentProps } from 'react';
import { render, screen, fireEvent, waitFor, within } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildTrip, buildTripFile } from '../../../tests/helpers/factories';
import { useTripStore } from '../../store/tripStore';
import { openFile } from '../../utils/fileDownload';
import { BookingLinkAndFiles } from './BookingLinkAndFiles';

vi.mock('../../utils/fileDownload', () => ({ openFile: vi.fn(async () => undefined) }));

const onBooking = buildTripFile({ id: 1, original_name: 'voucher.pdf', url: '/uploads/files/voucher.pdf', reservation_id: 9 });
const viaLink = buildTripFile({ id: 2, original_name: 'terms.pdf', linked_reservation_ids: [9] });
const loose = buildTripFile({ id: 3, original_name: 'map.pdf' });
const trashed = buildTripFile({ id: 4, original_name: 'old.pdf', deleted_at: '2025-02-01T00:00:00.000Z' });

let addToast: ReturnType<typeof vi.fn>;

type Props = ComponentProps<typeof BookingLinkAndFiles>;

function setup(overrides: Partial<Props> = {}) {
  const props: Props = {
    url: '',
    onUrlChange: vi.fn(),
    labelClass: 'label',
    inputClass: 'input',
    reservationId: 9,
    tripFiles: [onBooking, viaLink, loose, trashed],
    attachedFiles: [onBooking, viaLink],
    pendingFiles: [],
    onRemovePending: vi.fn(),
    fileInputRef: createRef<HTMLInputElement>(),
    onFileChange: vi.fn(),
    canAttach: true,
    uploading: false,
    onLinked: vi.fn(),
    onDetached: vi.fn(),
    ...overrides,
  };
  const view = render(<BookingLinkAndFiles {...props} />);
  return { ...view, props };
}

/** The attached file's row, found by its name. */
const rowOf = (name: string) => screen.getByText(name).parentElement as HTMLElement;

beforeEach(() => {
  resetAllStores();
  seedStore(useTripStore, { trip: buildTrip({ id: 1 }) });
  addToast = vi.fn();
  window.__addToast = addToast as unknown as typeof window.__addToast;
  vi.mocked(openFile).mockClear();
});

afterEach(() => {
  delete window.__addToast;
});

describe('BookingLinkAndFiles', () => {
  // ── Link ──────────────────────────────────────────────────────────────────

  it('FE-PLANNER-LINKFILES-001: the Link field shows the booking URL and reports every edit', () => {
    const { props } = setup({ url: 'https://hotel.example' });
    expect(screen.getByText('Link')).toBeInTheDocument();
    const field = screen.getByPlaceholderText('https://...');
    expect(field).toHaveValue('https://hotel.example');
    expect(field).toHaveAttribute('type', 'url');
    fireEvent.change(field, { target: { value: 'https://hotel.example/booking' } });
    expect(props.onUrlChange).toHaveBeenCalledWith('https://hotel.example/booking');
  });

  // ── Attach ────────────────────────────────────────────────────────────────

  it('FE-PLANNER-LINKFILES-002: attach opens the hidden file input, which reports what was picked', async () => {
    const user = userEvent.setup();
    const fileInputRef = createRef<HTMLInputElement>();
    const { props } = setup({ fileInputRef });
    const input = fileInputRef.current!;
    expect(input).toHaveAttribute('type', 'file');
    expect(input.accept).toContain('.pkpass');
    expect(input.style.display).toBe('none');

    const click = vi.spyOn(input, 'click').mockImplementation(() => undefined);
    await user.click(screen.getByRole('button', { name: /Attach file/ }));
    expect(click).toHaveBeenCalledTimes(1);

    fireEvent.change(input, { target: { files: [new File(['x'], 'ticket.pdf')] } });
    expect(props.onFileChange).toHaveBeenCalledTimes(1);
  });

  it('FE-PLANNER-LINKFILES-003: without upload rights there is no attach button, while uploading it is busy', () => {
    const { unmount } = setup({ canAttach: false });
    expect(screen.queryByRole('button', { name: /Attach file/ })).not.toBeInTheDocument();
    unmount();
    setup({ uploading: true });
    expect(screen.getByRole('button', { name: /Uploading/ })).toBeDisabled();
  });

  // ── Link an existing file ─────────────────────────────────────────────────

  it('FE-PLANNER-LINKFILES-004: the trip files not on the booking and not in the trash can be linked', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /Link existing file/ }));
    // voucher.pdf and terms.pdf are listed as attached rows, not offered again.
    expect(screen.getAllByText('map.pdf')).toHaveLength(1);
    expect(screen.getAllByText('voucher.pdf')).toHaveLength(1);
    expect(screen.queryByText('old.pdf')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-LINKFILES-005: before the first save nothing can be linked', () => {
    setup({ reservationId: null, attachedFiles: [] });
    expect(screen.queryByRole('button', { name: /Link existing file/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Attach file/ })).toBeInTheDocument();
  });

  it('FE-PLANNER-LINKFILES-006: linking a file posts the link and tells the dialog', async () => {
    const user = userEvent.setup();
    let body: unknown = null;
    server.use(
      http.post('/api/trips/1/files/3/link', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      }),
      http.get('/api/trips/1/files', () => HttpResponse.json({ files: [] })),
    );
    const { props } = setup();
    await user.click(screen.getByRole('button', { name: /Link existing file/ }));
    await user.click(screen.getByText('map.pdf'));

    await waitFor(() => expect(props.onLinked).toHaveBeenCalledWith(3));
    expect(body).toEqual({ reservation_id: 9 });
  });

  it('FE-PLANNER-LINKFILES-007: a failed link is reported and the dialog is not told', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/trips/1/files/3/link', () => HttpResponse.json({ error: 'nope' }, { status: 500 })));
    const { props } = setup();
    await user.click(screen.getByRole('button', { name: /Link existing file/ }));
    await user.click(screen.getByText('map.pdf'));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Failed to update', 'error', undefined));
    expect(props.onLinked).not.toHaveBeenCalled();
  });

  // ── Attached files ────────────────────────────────────────────────────────

  it('FE-PLANNER-LINKFILES-008: an attached file opens through the download helper', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(within(rowOf('voucher.pdf')).getByRole('button', { name: 'Open' }));
    expect(openFile).toHaveBeenCalledWith('/uploads/files/voucher.pdf');
    expect(addToast).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-LINKFILES-009: a file that cannot be opened is reported', async () => {
    const user = userEvent.setup();
    vi.mocked(openFile).mockRejectedValueOnce(new Error('gone'));
    setup();
    await user.click(within(rowOf('voucher.pdf')).getByRole('button', { name: 'Open' }));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Unknown error', 'error', undefined));
  });

  it('FE-PLANNER-LINKFILES-010: removing an attached file takes it off the booking and tells the dialog', async () => {
    const user = userEvent.setup();
    const unlinkFileFromReservation = vi.fn(async () => undefined);
    seedStore(useTripStore, { unlinkFileFromReservation });
    const { props } = setup();
    await user.click(within(rowOf('terms.pdf')).getByRole('button', { name: 'Remove link' }));

    await waitFor(() => expect(props.onDetached).toHaveBeenCalledWith(2));
    expect(unlinkFileFromReservation).toHaveBeenCalledWith(1, viaLink, 9);
    expect(addToast).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-LINKFILES-011: a failed removal is reported, and the dialog still lets the file go', async () => {
    const user = userEvent.setup();
    seedStore(useTripStore, { unlinkFileFromReservation: vi.fn(async () => { throw new Error('nope'); }) });
    const { props } = setup();
    await user.click(within(rowOf('voucher.pdf')).getByRole('button', { name: 'Remove link' }));

    await waitFor(() => expect(props.onDetached).toHaveBeenCalledWith(1));
    expect(addToast).toHaveBeenCalledWith('Failed to update', 'error', undefined);
  });

  it('FE-PLANNER-LINKFILES-012: without a trip or a saved booking the removal does nothing', async () => {
    const user = userEvent.setup();
    const unlinkFileFromReservation = vi.fn(async () => undefined);
    seedStore(useTripStore, { trip: null, unlinkFileFromReservation });
    const { props, unmount } = setup();
    await user.click(within(rowOf('voucher.pdf')).getByRole('button', { name: 'Remove link' }));
    unmount();

    seedStore(useTripStore, { trip: buildTrip({ id: 1 }) });
    setup({ reservationId: null, onDetached: props.onDetached });
    await user.click(within(rowOf('voucher.pdf')).getByRole('button', { name: 'Remove link' }));

    expect(unlinkFileFromReservation).not.toHaveBeenCalled();
    expect(props.onDetached).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-LINKFILES-013: the removal goes all the way through the store to the server', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    server.use(
      http.put('/api/trips/1/files/1', async ({ request }) => {
        calls.push(`PUT ${JSON.stringify(await request.json())}`);
        return HttpResponse.json({ file: onBooking });
      }),
      http.get('/api/trips/1/files/1/links', () => HttpResponse.json({ links: [{ id: 5, reservation_id: 9 }] })),
      http.delete('/api/trips/1/files/1/link/5', () => {
        calls.push('DELETE link 5');
        return HttpResponse.json({ success: true });
      }),
      http.get('/api/trips/1/files', () => HttpResponse.json({ files: [] })),
    );
    const { props } = setup();
    await user.click(within(rowOf('voucher.pdf')).getByRole('button', { name: 'Remove link' }));

    await waitFor(() => expect(props.onDetached).toHaveBeenCalledWith(1));
    expect(calls).toEqual(['PUT {"reservation_id":null}', 'DELETE link 5']);
  });

  // ── Files waiting for the first save ──────────────────────────────────────

  it('FE-PLANNER-LINKFILES-014: pending files are listed after the attached ones and each X drops its own', async () => {
    const user = userEvent.setup();
    const { props } = setup({ pendingFiles: [new File(['a'], 'a.pdf'), new File(['b'], 'b.pdf')] });
    const names = screen.getAllByText(/^(voucher|terms|a|b)\.pdf$/).map(n => n.textContent);
    expect(names).toEqual(['voucher.pdf', 'terms.pdf', 'a.pdf', 'b.pdf']);
    await user.click(within(rowOf('b.pdf')).getByRole('button', { name: 'Delete' }));
    expect(props.onRemovePending).toHaveBeenCalledWith(1);
  });
});
