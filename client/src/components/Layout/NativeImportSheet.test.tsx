import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '../../../tests/helpers/render';
import { tripsApi } from '../../api/client';
import { useSharedImportStore } from '../../native/sharedFiles';
import NativeImportSheet from './NativeImportSheet';

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => navigate,
}));

beforeEach(() => {
  navigate.mockReset();
  useSharedImportStore.setState({ file: null, tripId: null });
  vi.spyOn(tripsApi, 'list').mockResolvedValue({
    trips: [
      { id: 1, title: 'Past trip', start_date: '2020-01-01', end_date: '2020-01-05' },
      { id: 2, title: 'Japan', start_date: '2099-03-01', end_date: '2099-03-10' },
    ],
  });
});

describe('NativeImportSheet', () => {
  it('asks which trip a shared document goes to, upcoming trips first, and opens it there', async () => {
    render(<NativeImportSheet />);
    act(() => useSharedImportStore.getState().setFile(new File(['x'], 'booking.pdf', { type: 'application/pdf' })));

    const rows = await screen.findAllByRole('button', { name: /Japan|Past trip/ });
    expect(rows.map((r) => r.textContent)).toEqual(['Japan', 'Past trip']);
    expect(screen.getByText('booking.pdf')).toBeInTheDocument();

    fireEvent.click(rows[0]);
    expect(useSharedImportStore.getState().tripId).toBe(2);
    expect(navigate).toHaveBeenCalledWith('/trips/2');
  });

  it('stays closed with nothing shared', () => {
    render(<NativeImportSheet />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(tripsApi.list).not.toHaveBeenCalled();
  });
});
