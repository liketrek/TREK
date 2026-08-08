// FE-PAGE-JOIN-001 to FE-PAGE-JOIN-008
import { act, renderHook, waitFor } from '@testing-library/react';
import { tripInviteApi } from '../../api/client';
import { useJoinTrip } from './useJoinTrip';

const navigate = vi.fn();
let params: { token?: string } = { token: 'inv-1' };

vi.mock('react-router', () => ({
  useNavigate: () => navigate,
  useParams: () => params,
}));

beforeEach(() => {
  navigate.mockClear();
  params = { token: 'inv-1' };
  vi.spyOn(tripInviteApi, 'preview').mockResolvedValue({ title: 'Japan 2026' } as never);
  vi.spyOn(tripInviteApi, 'accept').mockResolvedValue({ trip_id: 42 } as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useJoinTrip', () => {
  it('FE-PAGE-JOIN-001: resolves the invite to a trip title', async () => {
    const { result } = renderHook(() => useJoinTrip());
    expect(result.current.state).toBe('loading');

    await waitFor(() => expect(result.current.state).toBe('ready'));
    expect(result.current.title).toBe('Japan 2026');
    expect(tripInviteApi.preview).toHaveBeenCalledWith('inv-1');
  });

  it('FE-PAGE-JOIN-002: goes straight to invalid without a token in the URL', async () => {
    params = {};
    const { result } = renderHook(() => useJoinTrip());

    expect(result.current.state).toBe('invalid');
    expect(tripInviteApi.preview).not.toHaveBeenCalled();
  });

  it('FE-PAGE-JOIN-003: marks a rejected invite invalid', async () => {
    vi.mocked(tripInviteApi.preview).mockRejectedValue(new Error('expired'));
    const { result } = renderHook(() => useJoinTrip());

    await waitFor(() => expect(result.current.state).toBe('invalid'));
    expect(result.current.title).toBe('');
  });

  it('FE-PAGE-JOIN-004: accepting opens the trip and replaces the invite URL', async () => {
    const { result } = renderHook(() => useJoinTrip());
    await waitFor(() => expect(result.current.state).toBe('ready'));

    await act(() => { result.current.accept(); return Promise.resolve(); });

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/trips/42', { replace: true }));
    expect(tripInviteApi.accept).toHaveBeenCalledWith('inv-1');
  });

  it('FE-PAGE-JOIN-005: shows the joining state while the invite is redeemed', async () => {
    let release: (() => void) | undefined;
    vi.mocked(tripInviteApi.accept).mockReturnValue(
      new Promise(res => { release = () => res({ trip_id: 7 } as never); }) as never,
    );

    const { result } = renderHook(() => useJoinTrip());
    await waitFor(() => expect(result.current.state).toBe('ready'));

    act(() => result.current.accept());
    expect(result.current.state).toBe('joining');

    await act(async () => { release!(); });
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/trips/7', { replace: true }));
  });

  it('FE-PAGE-JOIN-006: falls back to invalid when redeeming fails', async () => {
    vi.mocked(tripInviteApi.accept).mockRejectedValue(new Error('already a member'));
    const { result } = renderHook(() => useJoinTrip());
    await waitFor(() => expect(result.current.state).toBe('ready'));

    act(() => result.current.accept());
    await waitFor(() => expect(result.current.state).toBe('invalid'));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('FE-PAGE-JOIN-007: accept is a no-op without a token', () => {
    params = {};
    const { result } = renderHook(() => useJoinTrip());

    act(() => result.current.accept());
    expect(tripInviteApi.accept).not.toHaveBeenCalled();
    expect(result.current.state).toBe('invalid');
  });

  it('FE-PAGE-JOIN-008: the dashboard escape hatch replaces the invite URL too', async () => {
    const { result } = renderHook(() => useJoinTrip());
    await waitFor(() => expect(result.current.state).toBe('ready'));

    act(() => result.current.goToDashboard());
    expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('FE-PAGE-JOIN-009: a preview landing after unmount does not update state', async () => {
    let release: ((v: { title: string }) => void) | undefined;
    vi.mocked(tripInviteApi.preview).mockReturnValue(
      new Promise(res => { release = res as (v: { title: string }) => void; }) as never,
    );

    const { result, unmount } = renderHook(() => useJoinTrip());
    unmount();

    await act(async () => { release!({ title: 'Too late' }); });
    expect(result.current.state).toBe('loading');
  });
});
