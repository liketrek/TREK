// FE-PAGE-HELP-001 to FE-PAGE-HELP-012
import { act, renderHook, waitFor } from '@testing-library/react';
import { helpApi, type HelpNavSection, type HelpPageData } from '../../api/client';
import { useHelp } from './useHelp';

let routeParams: { slug?: string } = {};
vi.mock('react-router', () => ({ useParams: () => routeParams }));

const SECTIONS: HelpNavSection[] = [
  { title: 'Getting started', pages: [{ slug: 'Home', title: 'Welcome' }, { slug: 'Install', title: 'Installation' }] },
  { title: 'Guides', pages: [{ slug: 'Trips', title: 'Planning a trip' }, { slug: 'Budget', title: 'Splitting costs' }] },
] as HelpNavSection[];

const PAGE = { slug: 'Home', title: 'Welcome', body: '# Welcome' } as unknown as HelpPageData;

beforeEach(() => {
  routeParams = {};
  // jsdom has no scrollTo and logs a "Not implemented" error for every call.
  vi.stubGlobal('scrollTo', vi.fn());
  vi.spyOn(helpApi, 'index').mockResolvedValue({ sections: SECTIONS } as never);
  vi.spyOn(helpApi, 'page').mockResolvedValue(PAGE as never);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useHelp', () => {
  it('FE-PAGE-HELP-001: loads the navigation and the landing page', async () => {
    const { result } = renderHook(() => useHelp());
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.filtered).toEqual(SECTIONS);
    expect(result.current.page).toEqual(PAGE);
    expect(result.current.pageError).toBe(false);
  });

  it('FE-PAGE-HELP-002: defaults to the first page in the index when the route has no slug', async () => {
    renderHook(() => useHelp());
    await waitFor(() => expect(helpApi.page).toHaveBeenLastCalledWith('Home'));
  });

  it('FE-PAGE-HELP-003: falls back to the Home slug while the index is still loading', () => {
    renderHook(() => useHelp());
    expect(helpApi.page).toHaveBeenCalledWith('Home');
  });

  it('FE-PAGE-HELP-004: honours the slug from the route', async () => {
    routeParams = { slug: 'Budget' };
    const { result } = renderHook(() => useHelp());

    await waitFor(() => expect(result.current.activeSlug).toBe('Budget'));
    expect(helpApi.page).toHaveBeenCalledWith('Budget');
  });

  it('FE-PAGE-HELP-005: keeps an empty navigation when the index request fails', async () => {
    vi.mocked(helpApi.index).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useHelp());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.filtered).toEqual([]);
  });

  it('FE-PAGE-HELP-006: flags a page that could not be fetched', async () => {
    vi.mocked(helpApi.page).mockRejectedValue(new Error('404'));
    const { result } = renderHook(() => useHelp());

    await waitFor(() => expect(result.current.pageError).toBe(true));
    expect(result.current.loading).toBe(false);
    expect(result.current.page).toBeNull();
  });

  it('FE-PAGE-HELP-007: filters the navigation by page title, case-insensitively', async () => {
    const { result } = renderHook(() => useHelp());
    await waitFor(() => expect(result.current.filtered).toHaveLength(2));

    act(() => result.current.setQuery('  PLAN  '));

    expect(result.current.filtered).toEqual([
      { title: 'Guides', pages: [{ slug: 'Trips', title: 'Planning a trip' }] },
    ]);
  });

  it('FE-PAGE-HELP-008: drops sections that no longer have a matching page', async () => {
    const { result } = renderHook(() => useHelp());
    await waitFor(() => expect(result.current.filtered).toHaveLength(2));

    act(() => result.current.setQuery('zzz'));
    expect(result.current.filtered).toEqual([]);
  });

  it('FE-PAGE-HELP-009: an empty query restores the full navigation', async () => {
    const { result } = renderHook(() => useHelp());
    await waitFor(() => expect(result.current.filtered).toHaveLength(2));

    act(() => result.current.setQuery('install'));
    expect(result.current.filtered).toHaveLength(1);

    act(() => result.current.setQuery('   '));
    expect(result.current.filtered).toEqual(SECTIONS);
  });

  it('FE-PAGE-HELP-010: scrolls back to the top and closes the mobile nav on navigation', async () => {
    const scrollTo = vi.mocked(window.scrollTo);
    const { result, rerender } = renderHook(() => useHelp());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setNavOpen(true));
    expect(result.current.navOpen).toBe(true);

    routeParams = { slug: 'Trips' };
    rerender();

    await waitFor(() => expect(result.current.navOpen).toBe(false));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
  });

  it('FE-PAGE-HELP-011: scrolls the content pane when the ref is attached', async () => {
    const { result, rerender } = renderHook(() => useHelp());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const scrollTo = vi.fn();
    (result.current.contentRef as { current: unknown }).current = { scrollTo };

    routeParams = { slug: 'Install' };
    rerender();

    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ top: 0 }));
  });

  it('FE-PAGE-HELP-012: a page arriving after a slug change does not overwrite the newer one', async () => {
    let resolveFirst: ((p: HelpPageData) => void) | undefined;
    vi.mocked(helpApi.page).mockImplementationOnce(
      () => new Promise(res => { resolveFirst = res as (p: HelpPageData) => void; }) as never,
    );

    const { result, rerender } = renderHook(() => useHelp());

    routeParams = { slug: 'Trips' };
    rerender();
    await waitFor(() => expect(result.current.page).toEqual(PAGE));

    const stale = { slug: 'Home', title: 'Stale', body: '' } as unknown as HelpPageData;
    await act(async () => { resolveFirst!(stale); });

    expect(result.current.page).toEqual(PAGE);
  });
});
