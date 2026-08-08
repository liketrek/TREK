// FE-PLANNER-BOOKIMP-001 to FE-PLANNER-BOOKIMP-014
import { render, screen, fireEvent, waitFor } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { readMultipart } from '../../../tests/helpers/multipart';
import { useBackgroundTasksStore } from '../../store/backgroundTasksStore';
import { resetAllStores } from '../../../tests/helpers/store';
import { saveImportFiles } from '../../db/offlineDb';
import BookingImportModal from './BookingImportModal';

vi.mock('../../db/offlineDb', () => ({ saveImportFiles: vi.fn(async () => {}) }));

const defaultProps = { isOpen: true, onClose: vi.fn(), tripId: 4 };

// A file that is actually uploaded has to carry as many bytes as it reports —
// a size that lies leaves the multipart body and its length disagreeing, and the
// upload then fails to parse. Only the oversize case fakes the number, and that
// file is rejected by validateFile before it is ever sent.
const eml = (name = 'booking.eml', size = 100) => {
  const f = new File(['x'.repeat(Math.min(size, 4096))], name, { type: 'message/rfc822' });
  if (size > 4096) Object.defineProperty(f, 'size', { value: size });
  return f;
};

const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement;
const dropZone = () => screen.getByText(/Drop booking confirmation files here/).parentElement as HTMLElement;

beforeEach(() => {
  resetAllStores();
  vi.mocked(saveImportFiles).mockClear();
  server.use(
    http.get('/api/health/features', () => HttpResponse.json({ bookingImport: true, aiParsing: false })),
    http.post('/api/trips/4/reservations/import/booking/async', () => HttpResponse.json({ jobId: 'job-1' })),
  );
});

describe('BookingImportModal', () => {
  it('FE-PLANNER-BOOKIMP-001: renders nothing while closed', () => {
    render(<BookingImportModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Import booking confirmations')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-BOOKIMP-002: shows title, accepted formats and a disabled import button', () => {
    render(<BookingImportModal {...defaultProps} />);
    expect(screen.getByText('Import booking confirmations')).toBeInTheDocument();
    expect(screen.getByText(/Accepted: EML, PDF, PKPass/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled();
  });

  it('FE-PLANNER-BOOKIMP-003: selecting a supported file lists its name', async () => {
    render(<BookingImportModal {...defaultProps} />);
    await userEvent.upload(fileInput(), eml('flight.pdf'));
    expect(await screen.findByText('flight.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import' })).toBeEnabled();
  });

  it('FE-PLANNER-BOOKIMP-004: an unsupported extension is rejected with a message', () => {
    render(<BookingImportModal {...defaultProps} />);
    // userEvent.upload honours the input's accept filter, so drive the change directly.
    fireEvent.change(fileInput(), { target: { files: [new File(['x'], 'photo.png', { type: 'image/png' })] } });
    expect(screen.getByText(/Unsupported file format/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled();
  });

  it('FE-PLANNER-BOOKIMP-005: a file over 10 MB is rejected by name', () => {
    render(<BookingImportModal {...defaultProps} />);
    fireEvent.change(fileInput(), { target: { files: [eml('huge.eml', 11 * 1024 * 1024)] } });
    expect(screen.getByText('File "huge.eml" exceeds 10 MB limit.')).toBeInTheDocument();
  });

  it('FE-PLANNER-BOOKIMP-006: a mixed selection keeps the valid files and still surfaces the error', () => {
    render(<BookingImportModal {...defaultProps} />);
    fireEvent.change(fileInput(), { target: { files: [eml('ok.eml'), new File(['x'], 'bad.png')] } });
    expect(screen.getByText('ok.eml')).toBeInTheDocument();
    expect(screen.getByText(/Unsupported file format/)).toBeInTheDocument();
  });

  it('FE-PLANNER-BOOKIMP-007: only the first five files are taken', () => {
    render(<BookingImportModal {...defaultProps} />);
    const many = Array.from({ length: 7 }, (_, i) => eml(`b${i}.eml`));
    fireEvent.change(fileInput(), { target: { files: many } });
    expect(screen.getByText('b0.eml, b1.eml, b2.eml, b3.eml, b4.eml')).toBeInTheDocument();
    expect(screen.queryByText(/b5\.eml/)).not.toBeInTheDocument();
  });

  it('FE-PLANNER-BOOKIMP-008: dragging over the drop zone switches to the drop label', () => {
    render(<BookingImportModal {...defaultProps} />);
    const zone = dropZone();
    fireEvent.dragOver(zone);
    expect(screen.getByText('Drop files to import')).toBeInTheDocument();
    fireEvent.dragLeave(zone);
    expect(screen.getByText(/Drop booking confirmation files here/)).toBeInTheDocument();
  });

  it('FE-PLANNER-BOOKIMP-016: clicking the drop zone opens the hidden file input', () => {
    render(<BookingImportModal {...defaultProps} />);
    const click = vi.spyOn(fileInput(), 'click').mockImplementation(() => {});
    fireEvent.click(dropZone());
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });

  it('FE-PLANNER-BOOKIMP-009: dropping files selects them', () => {
    render(<BookingImportModal {...defaultProps} />);
    fireEvent.drop(dropZone(), { dataTransfer: { files: [eml('dropped.eml')] } });
    expect(screen.getByText('dropped.eml')).toBeInTheDocument();
  });

  it('FE-PLANNER-BOOKIMP-010: importing queues a background task, stores the files and closes', async () => {
    const onClose = vi.fn();
    let sentMode: string | null = null;
    server.use(
      http.post('/api/trips/4/reservations/import/booking/async', async ({ request }) => {
        sentMode = (await readMultipart(request)).fields.mode ?? null;
        return HttpResponse.json({ jobId: 'job-42' });
      }),
    );
    render(<BookingImportModal {...defaultProps} onClose={onClose} />);
    fireEvent.change(fileInput(), { target: { files: [eml('a.eml'), eml('b.pdf')] } });
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(sentMode).toBe('no-ai');
    expect(vi.mocked(saveImportFiles).mock.calls[0][0]).toBe('job-42');
    const task = useBackgroundTasksStore.getState().tasks.find(t => t.id === 'job-42');
    expect(task).toMatchObject({ tripId: '4', label: 'a.eml, b.pdf', total: 2, mode: 'no-ai' });
  });

  it('FE-PLANNER-BOOKIMP-011: with AI parsing enabled the mode falls back on empty results', async () => {
    let sentMode: string | null = null;
    server.use(
      http.get('/api/health/features', () => HttpResponse.json({ bookingImport: true, aiParsing: true })),
      http.post('/api/trips/4/reservations/import/booking/async', async ({ request }) => {
        sentMode = (await readMultipart(request)).fields.mode ?? null;
        return HttpResponse.json({ jobId: 'job-ai' });
      }),
    );
    render(<BookingImportModal {...defaultProps} />);
    // Wait for the feature probe to land before kicking off the import.
    await waitFor(() => expect(screen.getByText('Import booking confirmations')).toBeInTheDocument());
    fireEvent.change(fileInput(), { target: { files: [eml()] } });
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    await waitFor(() => expect(sentMode).toBe('fallback-on-empty'));
  });

  it('FE-PLANNER-BOOKIMP-012: a failing upload surfaces the server error and keeps the modal open', async () => {
    const onClose = vi.fn();
    server.use(
      http.post('/api/trips/4/reservations/import/booking/async', () =>
        HttpResponse.json({ error: 'Storage full' }, { status: 500 })),
    );
    render(<BookingImportModal {...defaultProps} onClose={onClose} />);
    fireEvent.change(fileInput(), { target: { files: [eml()] } });
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    expect(await screen.findByText('Storage full')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Import' })).toBeEnabled();
  });

  it('FE-PLANNER-BOOKIMP-013: an error without a server message falls back to the generic parse error', async () => {
    server.use(
      http.post('/api/trips/4/reservations/import/booking/async', () => HttpResponse.error()),
    );
    render(<BookingImportModal {...defaultProps} />);
    fireEvent.change(fileInput(), { target: { files: [eml()] } });
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    expect(await screen.findByText(/Parsing failed/)).toBeInTheDocument();
  });

  it('FE-PLANNER-BOOKIMP-014: Cancel closes and reopening clears the previous selection', async () => {
    const onClose = vi.fn();
    const { rerender } = render(<BookingImportModal {...defaultProps} onClose={onClose} />);
    fireEvent.change(fileInput(), { target: { files: [eml('stale.eml')] } });
    expect(screen.getByText('stale.eml')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();

    rerender(<BookingImportModal {...defaultProps} isOpen={false} onClose={onClose} />);
    rerender(<BookingImportModal {...defaultProps} isOpen onClose={onClose} />);
    await waitFor(() => expect(screen.queryByText('stale.eml')).not.toBeInTheDocument());
  });

  it('FE-PLANNER-BOOKIMP-015: a backdrop press-and-release closes, a press inside does not', () => {
    const onClose = vi.fn();
    render(<BookingImportModal {...defaultProps} onClose={onClose} />);
    const backdrop = document.querySelector('[style*="z-index: 99999"]') as HTMLElement;
    const card = screen.getByText('Import booking confirmations').closest('div')!.parentElement!;

    // A drag that starts inside the dialog and ends on the backdrop must not close it.
    fireEvent.mouseDown(card);
    fireEvent.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(backdrop);
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
