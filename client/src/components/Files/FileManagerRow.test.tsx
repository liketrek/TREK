// FE-FILES-ROW-001 to FE-FILES-ROW-006
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { buildPlace, buildReservation, buildTrip, buildTripFile } from '../../../tests/helpers/factories';
import { downloadFile } from '../../utils/fileDownload';
import type { TripFile } from '../../types';
import type { FileManagerState } from './useFileManager';
import { FileRow } from './FileManagerRow';

vi.mock('../../utils/fileDownload', () => ({ downloadFile: vi.fn(async () => {}) }));

const handlers = {
  handleStar: vi.fn(),
  handleRestore: vi.fn(),
  handlePermanentDelete: vi.fn(),
  handleDelete: vi.fn(),
  openFile: vi.fn(),
  setAssignFileId: vi.fn(),
};

const labels: Record<string, string> = {
  'common.open': 'Open', 'common.delete': 'Delete', 'files.download': 'Download', 'files.star': 'Star', 'files.unstar': 'Unstar',
  'files.assign': 'Assign', 'files.restore': 'Restore', 'files.sourcePlan': 'Day Plan', 'files.sourceBooking': 'Booking',
  'files.sourceTransport': 'Transport', 'files.sourceCollab': 'From Collab Notes',
};

function renderRow(file: TripFile, { isTrash = false, allowed = true } = {}) {
  const state = {
    ...handlers,
    places: [buildPlace({ id: 71, name: 'Louvre' })],
    reservations: [buildReservation({ id: 81, title: 'Shinkansen', type: 'train' }), buildReservation({ id: 82, title: '', type: 'restaurant' })],
    t: (k: string) => labels[k] ?? k,
    locale: 'en-US',
    can: () => allowed,
    trip: buildTrip({ id: 1 }),
  } as unknown as FileManagerState;
  return render(<FileRow {...state} file={file} isTrash={isTrash} />);
}

beforeEach(() => {
  Object.values(handlers).forEach(fn => fn.mockClear());
  vi.mocked(downloadFile).mockClear();
});

describe('FileRow', () => {
  it('FE-FILES-ROW-001: opens the file from its tile, its name and the Open action', async () => {
    const user = userEvent.setup();
    const file = buildTripFile({ original_name: 'ticket.pdf' });
    renderRow(file);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(screen.getAllByRole('button', { name: 'ticket.pdf' })[0]);
    expect(handlers.openFile).toHaveBeenCalledTimes(2);
    expect(handlers.openFile).toHaveBeenCalledWith(file);
  });

  it('FE-FILES-ROW-002: Download fetches the file under its own name', async () => {
    const user = userEvent.setup();
    const file = buildTripFile({ original_name: 'ticket.pdf', url: '/api/trips/1/files/9/download' });
    renderRow(file);
    await user.click(screen.getByRole('button', { name: 'Download' }));
    expect(downloadFile).toHaveBeenCalledWith('/api/trips/1/files/9/download', 'ticket.pdf');
  });

  it('FE-FILES-ROW-003: star, assign and delete reach their handlers', async () => {
    const user = userEvent.setup();
    const file = buildTripFile({ id: 555, starred: 1 } as never);
    renderRow(file);
    await user.click(screen.getByRole('button', { name: 'Unstar' }));
    await user.click(screen.getByRole('button', { name: 'Assign' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(handlers.handleStar).toHaveBeenCalledWith(555);
    expect(handlers.setAssignFileId).toHaveBeenCalledWith(555);
    expect(handlers.handleDelete).toHaveBeenCalledWith(555);
  });

  it('FE-FILES-ROW-004: without the rights there is nothing to assign or delete', () => {
    renderRow(buildTripFile({}), { allowed: false });
    expect(screen.getByRole('button', { name: 'Star' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Assign' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
  });

  it('FE-FILES-ROW-005: a file in the trash restores or goes for good, and does not open', async () => {
    const user = userEvent.setup();
    const file = buildTripFile({ id: 556, original_name: 'old.pdf' });
    renderRow(file, { isTrash: true });
    expect(screen.getAllByRole('button', { name: 'old.pdf' })[0]).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Restore' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(handlers.handleRestore).toHaveBeenCalledWith(556);
    expect(handlers.handlePermanentDelete).toHaveBeenCalledWith(556);
    expect(screen.queryByRole('button', { name: 'Open' })).toBeNull();
  });

  it('FE-FILES-ROW-006: says where the file came from: a place, a transport, a booking, a note', () => {
    const file = buildTripFile({ place_id: 71, reservation_id: 81, linked_reservation_ids: [82], note_id: 3, description: 'Seat map', file_size: 2048 } as never);
    renderRow(file);
    expect(screen.getByText('Louvre')).toBeInTheDocument();
    expect(screen.getByText('Shinkansen')).toBeInTheDocument();
    expect(screen.getByText('Booking')).toBeInTheDocument();
    expect(screen.getByText('From Collab Notes')).toBeInTheDocument();
    expect(screen.getByText('Seat map')).toBeInTheDocument();
  });
});
