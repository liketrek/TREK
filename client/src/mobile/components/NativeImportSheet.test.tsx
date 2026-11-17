import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
import { saveSharedLink, useSharedImportStore } from '../../native/sharedFiles';
import { tripRepo } from '../../repo/tripRepo';
import { useAddonStore } from '../../store/addonStore';
import NativeImportSheet from './NativeImportSheet';

const navigate = vi.hoisted(() => vi.fn());
vi.mock('../../native/sharedFiles', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../native/sharedFiles')>()),
  saveSharedLink: vi.fn(),
}));
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => navigate,
}));

beforeEach(() => {
  // A second spyOn returns the first spy with its calls; start every test clean.
  vi.restoreAllMocks();
  navigate.mockReset();
  useSharedImportStore.setState({ file: null, tripId: null, link: null });
  useAddonStore.setState({ addons: [{ id: 'collab', enabled: true }] as never, loaded: true });
  vi.mocked(saveSharedLink).mockReset().mockResolvedValue();
  vi.spyOn(tripRepo, 'list').mockResolvedValue({
    trips: [
      { id: 1, title: 'Past trip', start_date: '2020-01-01', end_date: '2020-01-05' },
      { id: 2, title: 'Japan', start_date: '2099-03-01', end_date: '2099-03-10' },
    ],
    archivedTrips: [],
  } as unknown as Awaited<ReturnType<typeof tripRepo.list>>);
});

const page = () => new File(['<html></html>'], 'hotel.html', { type: 'text/html' });
const bareLink = () => new File(['https://hotel.example/stay'], 'link.url', { type: 'text/uri-list' });
const link = (presetTripId: number | null = null) => ({
  url: 'https://hotel.example/stay',
  title: 'Hotel Kanra',
  presetTripId,
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

  it('goes straight to the trip the share sheet picked, without asking', () => {
    render(<NativeImportSheet />);
    act(() => {
      useSharedImportStore.getState().setFile(new File(['x'], 'booking.pdf', { type: 'application/pdf' }));
      useSharedImportStore.getState().chooseTrip(2);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(navigate).toHaveBeenCalledWith('/trips/2');
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('asks what a shared page is for, and keeps it among the links of the trip picked', async () => {
    render(<NativeImportSheet />);
    act(() => useSharedImportStore.getState().setFile(page(), link()));
    expect(screen.getByText('What should TREK do with this link?')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Japan/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Save to the trip's links/ }));
    expect(screen.getByText('Save the link to which trip?')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: /Japan/ }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/trips/2?tab=collab'));
    expect(saveSharedLink).toHaveBeenCalledWith(2, link());
    expect(useSharedImportStore.getState().file).toBeNull();
  });

  it('reads a booking from the page when that is asked for', async () => {
    render(<NativeImportSheet />);
    act(() => useSharedImportStore.getState().setFile(page(), link()));
    fireEvent.click(screen.getByRole('button', { name: /Read a booking from it/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Japan/ }));
    expect(useSharedImportStore.getState().tripId).toBe(2);
    expect(navigate).toHaveBeenCalledWith('/trips/2');
    expect(saveSharedLink).not.toHaveBeenCalled();
  });

  it('keeps a bare link in the trip the share sheet picked, with nothing to ask', async () => {
    render(<NativeImportSheet />);
    act(() => useSharedImportStore.getState().setFile(bareLink(), link(2)));
    await waitFor(() => expect(saveSharedLink).toHaveBeenCalledWith(2, link(2)));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/trips/2?tab=collab'));
  });

  it('with Collab off, a page is read as a booking and a bare link is explained', async () => {
    useAddonStore.setState({ addons: [], loaded: true });
    render(<NativeImportSheet />);
    act(() => useSharedImportStore.getState().setFile(page(), link()));
    expect(screen.queryByText('What should TREK do with this link?')).not.toBeInTheDocument();
    expect(await screen.findAllByRole('button', { name: /Japan|Past trip/ })).toHaveLength(2);

    act(() => useSharedImportStore.getState().setFile(bareLink(), link()));
    expect(screen.getByText('Turn on Collab to keep links in a trip.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Japan/ })).not.toBeInTheDocument();
  });

  it('says so when the link cannot be saved, and offers the trips again', async () => {
    vi.mocked(saveSharedLink).mockRejectedValue(new Error('offline'));
    render(<NativeImportSheet />);
    act(() => useSharedImportStore.getState().setFile(bareLink(), link(2)));
    expect(await screen.findByRole('button', { name: /Japan/ })).toBeEnabled();
    expect(navigate).not.toHaveBeenCalled();
    expect(useSharedImportStore.getState().file).not.toBeNull();
  });

  it('stays closed with nothing shared', () => {
    render(<NativeImportSheet />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(tripRepo.list).not.toHaveBeenCalled();
  });
});
