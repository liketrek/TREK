import { act, fireEvent, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTourDraftStorage } from './useTourDraftStorage';

const { repo } = vi.hoisted(() => ({
  repo: { read: vi.fn(), keep: vi.fn(), flush: vi.fn(), forget: vi.fn() },
}));

vi.mock('../../../repo/tourDraftRepo', () => ({ tourDraftRepo: repo }));

const draft = {
  version: 11 as const,
  name: 'Ridge',
  waypoints: [
    { id: 'a', lat: 47, lng: 11, role: 'via' as const },
    { id: 'b', lat: 47.1, lng: 11.1, role: 'via' as const },
  ],
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.clearAllMocks();
  repo.read.mockResolvedValue(null);
  repo.forget.mockResolvedValue(undefined);
});

describe('useTourDraftStorage', () => {
  it('hands the account draft to the planner once its read is back, its points in order', async () => {
    repo.read.mockResolvedValue(JSON.stringify(draft));
    const onRestored = vi.fn();
    renderHook(() => useTourDraftStorage(4, onRestored));
    expect(onRestored).not.toHaveBeenCalled();

    await act(async () => {});

    expect(repo.read).toHaveBeenCalledWith(4);
    expect(onRestored).toHaveBeenCalledOnce();
    expect(onRestored.mock.calls[0][0]).toMatchObject({ name: 'Ridge' });
    expect(onRestored.mock.calls[0][0].waypoints.map((point: { role: string }) => point.role)).toEqual([
      'start',
      'end',
    ]);
  });

  it('restores nothing for no draft, one that fails the check, or a read that fails', async () => {
    const onRestored = vi.fn();
    renderHook(() => useTourDraftStorage(4, onRestored));
    repo.read.mockResolvedValueOnce(JSON.stringify({ ...draft, version: 99 }));
    renderHook(() => useTourDraftStorage(5, onRestored));
    repo.read.mockRejectedValueOnce(new Error('offline, nothing cached'));
    renderHook(() => useTourDraftStorage(6, onRestored));
    await act(async () => {});
    expect(onRestored).not.toHaveBeenCalled();
  });

  it('a read that comes back after the planner kept or forgot a draft is not laid over it', async () => {
    const late = deferred<string | null>();
    repo.read.mockReturnValue(late.promise);
    const onRestored = vi.fn();
    const { result } = renderHook(() => useTourDraftStorage(4, onRestored));

    act(() => result.current.keep({ ...draft, name: 'Newer' }));
    await act(async () => late.resolve(JSON.stringify(draft)));

    expect(onRestored).not.toHaveBeenCalled();
    expect(repo.keep).toHaveBeenCalledWith(4, JSON.stringify({ ...draft, name: 'Newer' }));
  });

  it('forgets on the account only while it may hold a draft, and writes a waiting one when the planner or the page closes', async () => {
    const onRestored = vi.fn();
    const { result, unmount } = renderHook(() => useTourDraftStorage(4, onRestored));
    await act(async () => {});
    // The account said it holds none: throwing nothing away sends nothing.
    act(() => result.current.forget());
    expect(repo.forget).not.toHaveBeenCalled();

    act(() => result.current.keep(draft));
    act(() => result.current.forget());
    expect(repo.forget).toHaveBeenCalledExactlyOnceWith(4);
    act(() => result.current.forget());
    expect(repo.forget).toHaveBeenCalledOnce();

    fireEvent(window, new Event('pagehide'));
    expect(repo.flush).toHaveBeenCalledExactlyOnceWith(4);
    unmount();
    expect(repo.flush).toHaveBeenCalledTimes(2);
    // Closed, the planner no longer answers the page going away.
    fireEvent(window, new Event('pagehide'));
    expect(repo.flush).toHaveBeenCalledTimes(2);
  });

  it('asks again on the next discard when the account refused one', async () => {
    repo.read.mockResolvedValue(JSON.stringify(draft));
    repo.forget.mockRejectedValueOnce(new Error('refused'));
    const onRestored = vi.fn();
    const { result } = renderHook(() => useTourDraftStorage(4, onRestored));
    await act(async () => {});

    await act(async () => result.current.forget());
    act(() => result.current.forget());
    expect(repo.forget).toHaveBeenCalledTimes(2);
  });
});
