// FE-COMP-GHREL-HOOK-001 to -012: the release history behind both admin shells.
import { act, renderHook, waitFor } from '@testing-library/react';

import apiClient from '../../api/client';
import { type GithubRelease, useGithubReleases } from './useGithubReleases';

vi.mock('../../i18n', () => ({
  useTranslation: () => ({ language: 'de' }),
  getLocaleForLanguage: (language: string) => (language === 'de' ? 'de-DE' : 'en-US'),
}));

function release(id: number, prerelease = false): GithubRelease {
  return {
    id,
    prerelease,
    tag_name: `v${id}`,
    name: null,
    body: null,
    published_at: null,
    created_at: '2026-01-05T10:00:00Z',
    author: null,
  };
}

/** A full page of ten, numbered from `from`. */
function fullPage(from: number, prerelease = false) {
  return Array.from({ length: 10 }, (_, i) => release(from + i, prerelease));
}

/** Answers each page number from `pages`; a page holding an Error rejects with it. */
function serve(pages: Record<number, GithubRelease[] | Error>) {
  return vi
    .spyOn(apiClient, 'get')
    .mockImplementation(async (_url: string, config?: { params?: { page?: number } }) => {
      const answer = pages[config?.params?.page ?? 1] ?? [];
      if (answer instanceof Error) throw answer;
      return { data: answer };
    });
}

function requestedPages(spy: ReturnType<typeof serve>) {
  return spy.mock.calls.map((call) => (call[1] as { params: { page: number } }).params.page);
}

afterEach(() => vi.restoreAllMocks());

describe('useGithubReleases, one page per load', () => {
  it('FE-COMP-GHREL-HOOK-001: loads the first page and hides prereleases from a stable install', async () => {
    const spy = serve({ 1: [release(1, true), release(2)] });
    const { result } = renderHook(() => useGithubReleases({ isPrerelease: false }));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(spy).toHaveBeenCalledWith('/admin/github-releases', { params: { per_page: 10, page: 1 } });
    expect(result.current.releases.map((r) => r.id)).toEqual([1, 2]);
    expect(result.current.shownReleases.map((r) => r.id)).toEqual([2]);
    expect(result.current.hasMore).toBe(false);
  });

  it('FE-COMP-GHREL-HOOK-002: a prerelease install shows every release', async () => {
    serve({ 1: [release(1, true), release(2)] });
    const { result } = renderHook(() => useGithubReleases({ isPrerelease: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.shownReleases.map((r) => r.id)).toEqual([1, 2]);
  });

  it('FE-COMP-GHREL-HOOK-003: load more appends the next page and keeps going while pages are full', async () => {
    const spy = serve({ 1: fullPage(1), 2: [release(11)] });
    const { result } = renderHook(() => useGithubReleases({ isPrerelease: false }));
    await waitFor(() => expect(result.current.hasMore).toBe(true));
    await act(async () => {
      await result.current.handleLoadMore();
    });
    expect(requestedPages(spy)).toEqual([1, 2]);
    expect(result.current.releases).toHaveLength(11);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.loadingMore).toBe(false);
  });

  it('FE-COMP-GHREL-HOOK-004: a failed load more sets the error and holds the page', async () => {
    const spy = serve({ 1: fullPage(1), 2: new Error('rate limited'), 3: [release(21)] });
    const { result } = renderHook(() => useGithubReleases({ isPrerelease: false }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.handleLoadMore();
    });
    expect(result.current.error).toBe('rate limited');
    await act(async () => {
      await result.current.handleLoadMore();
    });
    expect(requestedPages(spy)).toEqual([1, 2, 2]);
    expect(result.current.error).toBe('rate limited');
  });

  it('FE-COMP-GHREL-HOOK-012: a failed load more keeps the list and the retry clears the error', async () => {
    let failPage2 = true;
    const spy = vi
      .spyOn(apiClient, 'get')
      .mockImplementation(async (_url: string, config?: { params?: { page?: number } }) => {
        const page = config?.params?.page;
        if (page === 1) return { data: fullPage(1) };
        if (failPage2) throw new Error('offline');
        return { data: [release(11)] };
      });
    const { result } = renderHook(() => useGithubReleases({ isPrerelease: false }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.handleLoadMore();
    });
    expect(result.current.error).toBe('offline');
    expect(result.current.releases).toHaveLength(10);
    failPage2 = false;
    await act(async () => {
      await result.current.handleLoadMore();
    });
    expect(requestedPages(spy)).toEqual([1, 2, 2]);
    expect(result.current.error).toBeNull();
    expect(result.current.releases).toHaveLength(11);
    expect(result.current.hasMore).toBe(false);
  });

  it('FE-COMP-GHREL-HOOK-005: a first page of only prereleases is all a stable install gets', async () => {
    const spy = serve({ 1: fullPage(1, true), 2: [release(11)] });
    const { result } = renderHook(() => useGithubReleases({ isPrerelease: false }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(requestedPages(spy)).toEqual([1]);
    expect(result.current.shownReleases).toEqual([]);
    expect(result.current.hasMore).toBe(true);
  });
});

describe('useGithubReleases, filling pages', () => {
  it('FE-COMP-GHREL-HOOK-006: walks past pages of hidden prereleases until one release shows', async () => {
    const spy = serve({
      1: fullPage(1, true),
      2: fullPage(11, true),
      3: [release(21), ...fullPage(22, true).slice(1)],
    });
    const { result } = renderHook(() => useGithubReleases({ isPrerelease: false, fillPages: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(requestedPages(spy)).toEqual([1, 2, 3]);
    expect(result.current.releases).toHaveLength(30);
    expect(result.current.shownReleases.map((r) => r.id)).toEqual([21]);
    expect(result.current.hasMore).toBe(true);
  });

  it('FE-COMP-GHREL-HOOK-007: stops after five pages in one load', async () => {
    const pages: Record<number, GithubRelease[]> = {};
    for (let p = 1; p <= 6; p++) pages[p] = fullPage(p * 10, true);
    const spy = serve(pages);
    const { result } = renderHook(() => useGithubReleases({ isPrerelease: false, fillPages: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(requestedPages(spy)).toEqual([1, 2, 3, 4, 5]);
    expect(result.current.releases).toHaveLength(50);
    expect(result.current.hasMore).toBe(true);
  });

  it('FE-COMP-GHREL-HOOK-011: load more after a five page walk goes on with the next unread page', async () => {
    const pages: Record<number, GithubRelease[]> = {};
    for (let p = 1; p <= 5; p++) pages[p] = fullPage(p * 10, true);
    pages[6] = [release(60)];
    const spy = serve(pages);
    const { result } = renderHook(() => useGithubReleases({ isPrerelease: false, fillPages: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.handleLoadMore();
    });
    expect(requestedPages(spy)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result.current.shownReleases.map((r) => r.id)).toEqual([60]);
  });

  it('FE-COMP-GHREL-HOOK-008: a failed load more keeps the list, holds the page, and the retry clears the error', async () => {
    let failPage2 = true;
    const spy = vi
      .spyOn(apiClient, 'get')
      .mockImplementation(async (_url: string, config?: { params?: { page?: number } }) => {
        const page = config?.params?.page;
        if (page === 1) return { data: fullPage(1) };
        if (failPage2) throw new Error('offline');
        return { data: [release(11)] };
      });
    const { result } = renderHook(() => useGithubReleases({ isPrerelease: false, fillPages: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.handleLoadMore();
    });
    expect(result.current.error).toBe('offline');
    expect(result.current.releases).toHaveLength(10);
    failPage2 = false;
    await act(async () => {
      await result.current.handleLoadMore();
    });
    expect(requestedPages(spy)).toEqual([1, 2, 2]);
    expect(result.current.error).toBeNull();
    expect(result.current.releases).toHaveLength(11);
  });
});

describe('useGithubReleases, display helpers', () => {
  it('FE-COMP-GHREL-HOOK-009: toggleExpand flips one release at a time', async () => {
    serve({ 1: [release(1)] });
    const { result } = renderHook(() => useGithubReleases({ isPrerelease: false }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.toggleExpand(1));
    expect(result.current.expanded).toEqual({ 1: true });
    act(() => result.current.toggleExpand(1));
    expect(result.current.expanded).toEqual({ 1: false });
  });

  it('FE-COMP-GHREL-HOOK-010: formatDate writes the date in the locale of the UI language', async () => {
    serve({ 1: [] });
    const { result } = renderHook(() => useGithubReleases({ isPrerelease: false }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.formatDate('2026-01-05T10:00:00Z')).toBe(
      new Date('2026-01-05T10:00:00Z').toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })
    );
  });
});
