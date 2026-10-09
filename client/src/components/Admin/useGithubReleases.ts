import { useEffect, useState } from 'react';

import apiClient from '../../api/client';
import { getLocaleForLanguage, useTranslation } from '../../i18n';

const PER_PAGE = 10;
const MAX_PAGES_PER_LOAD = 5;

export interface GithubRelease {
  id: number;
  prerelease: boolean;
  tag_name: string;
  name: string | null;
  body: string | null;
  published_at: string | null;
  created_at: string;
  author: { login: string } | null;
  [key: string]: unknown;
}

interface UseGithubReleasesOptions {
  /** Whether this install runs a prerelease: prereleases only show to those. */
  isPrerelease: boolean;
  /**
   * Keep pulling pages until at least one release survives the prerelease filter, up to
   * MAX_PAGES_PER_LOAD per load. Without it each load reads exactly one page. Either way
   * a failed page keeps what is already shown and leaves the page counter where it was,
   * and the next good load clears the error.
   */
  fillPages?: boolean;
}

/**
 * The GitHub release history behind both admin shells (the desktop panel and the phone
 * panel render their own timeline over it): the paged fetch from the server's proxy,
 * which releases show, which ones are expanded, and their dates in the user's locale.
 */
export function useGithubReleases({ isPrerelease, fillPages = false }: UseGithubReleasesOptions) {
  const { language } = useTranslation();
  const [releases, setReleases] = useState<GithubRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const isShown = (release: GithubRelease) => isPrerelease || !release.prerelease;

  const fetchPage = async (pageNum: number) => {
    try {
      const res = await apiClient.get(`/admin/github-releases`, { params: { per_page: PER_PAGE, page: pageNum } });
      return Array.isArray(res.data) ? (res.data as GithubRelease[]) : [];
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  };

  const fetchReleases = async (pageNum = 1, append = false) => {
    const data = await fetchPage(pageNum);
    if (!data) return false;
    setReleases((prev) => (append ? [...prev, ...data] : data));
    setHasMore(data.length === PER_PAGE);
    setError(null);
    return true;
  };

  // Keep pulling pages until at least one release survives the prerelease filter,
  // otherwise a page of nothing but prereleases leaves an empty timeline behind a
  // "Load more" button. MAX_PAGES_PER_LOAD bounds the walk.
  const loadFrom = async (startPage: number, append: boolean) => {
    const collected: GithubRelease[] = [];
    let pageNum = startPage;
    let more = true;

    for (let i = 0; i < MAX_PAGES_PER_LOAD; i++) {
      // Step on only when another page follows, so `page` ends on the last one read.
      if (i > 0) pageNum += 1;
      const data = await fetchPage(pageNum);
      if (!data) return;
      collected.push(...data);
      more = data.length === PER_PAGE;
      if (!more || collected.some(isShown)) break;
    }

    setReleases((prev) => (append ? [...prev, ...collected] : collected));
    setHasMore(more);
    setPage(pageNum);
    setError(null);
  };

  useEffect(() => {
    setLoading(true);
    void (fillPages ? loadFrom(1, false) : fetchReleases(1)).finally(() => setLoading(false));
  }, []);

  const handleLoadMore = async () => {
    if (fillPages) {
      setLoadingMore(true);
      await loadFrom(page + 1, true);
      setLoadingMore(false);
      return;
    }
    const next = page + 1;
    setLoadingMore(true);
    if (await fetchReleases(next, true)) setPage(next);
    setLoadingMore(false);
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(getLocaleForLanguage(language), { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return {
    releases,
    shownReleases: releases.filter(isShown),
    loading,
    error,
    expanded,
    toggleExpand,
    hasMore,
    loadingMore,
    handleLoadMore,
    formatDate,
  };
}
