/**
 * A shared Naver Maps list (a bookmark folder), read page by page from Naver's
 * share endpoint.
 *
 * The link is checked by the SSRF guard and a naver.me short link is followed
 * hop by hop through it. Every page is capped before and after it is read: the
 * folder id is attacker-influenced, and the pager buffers a fresh body on every
 * iteration. Every refusal is the exact message and status the import route
 * has always answered.
 */
import { Injectable } from '@nestjs/common';
import { checkSsrf, safeFetchFollow, SsrfBlockedError } from '../../../utils/ssrfGuard';
import { LIST_USER_AGENT, MAX_LIST_RESPONSE_BYTES } from './google-list.provider';
import type { ListImportError, ListRead, NaverListPlace } from '../place-import.types';

/** Bookmarks asked for per page. */
const PAGE_SIZE = 20;

type NaverPage = {
  folder?: { bookmarkCount?: number; name?: string };
  bookmarkList?: Record<string, unknown>[];
};

@Injectable()
export class NaverListProvider {
  async read(url: string): Promise<ListRead<NaverListPlace> | ListImportError> {
    let resolvedUrl = url;
    const limit = PAGE_SIZE;

    // SSRF guard: validate user-supplied URL before fetching
    const ssrf = await checkSsrf(url);
    if (!ssrf.allowed) return { error: 'URL is not allowed', status: 400 };

    // Resolve naver.me short links to the canonical map.naver.com folder URL.
    // Redirects are followed manually so each hop is re-validated against the
    // SSRF guard (a short link could otherwise 302 to an internal address).
    let parsedUrl: URL;
    try { parsedUrl = new URL(url); } catch { return { error: 'Invalid URL', status: 400 }; }
    if (parsedUrl.hostname === 'naver.me') {
      try {
        const redirectRes = await safeFetchFollow(url, { signal: AbortSignal.timeout(10000) });
        resolvedUrl = redirectRes.url;
      } catch (err) {
        if (err instanceof SsrfBlockedError) return { error: 'URL is not allowed', status: 400 };
        throw err;
      }
    }

    const folderMatch = resolvedUrl.match(/favorite\/myPlace\/folder\/([A-Za-z0-9_-]+)/i);
    const folderId = folderMatch?.[1] || null;
    if (!folderId) {
      return { error: 'Could not extract folder ID from URL. Please use a shared Naver Maps list link.', status: 400 };
    }

    const fetchPage = async (start: number) => {
      const apiUrl = `https://pages.map.naver.com/save-pages/api/maps-bookmark/v3/shares/${encodeURIComponent(folderId)}/bookmarks?placeInfo=true&start=${start}&limit=${limit}&sort=lastUseTime&mcids=ALL&createIdNo=true`;
      const apiRes = await fetch(apiUrl, {
        headers: {
          Accept: 'application/json',
          'User-Agent': LIST_USER_AGENT,
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!apiRes.ok) {
        return { error: 'Failed to fetch list from Naver Maps', status: 502 } as const;
      }

      // Same cap as the Google import: the URL is attacker-influenced via the
      // folder id, and this pager buffers a fresh body on every iteration, so an
      // uncapped read is worse here than there. The declared length is checked
      // before the read; the post-read check covers a chunked response that
      // carries no content-length at all.
      const declared = Number(apiRes.headers?.get('content-length') ?? 0);
      if (declared > MAX_LIST_RESPONSE_BYTES) {
        return { error: 'Failed to fetch list from Naver Maps', status: 502 } as const;
      }

      try {
        const rawText = await apiRes.text();
        if (rawText.length > MAX_LIST_RESPONSE_BYTES) {
          return { error: 'Failed to fetch list from Naver Maps', status: 502 } as const;
        }
        const data = JSON.parse(rawText) as NaverPage;
        return { data } as const;
      } catch {
        return { error: 'Invalid list data received from Naver Maps', status: 400 } as const;
      }
    };

    const firstPage = await fetchPage(0);
    if ('error' in firstPage) {
      return { error: firstPage.error, status: firstPage.status };
    }

    const listName = firstPage.data.folder?.name || 'Naver Maps List';
    const totalCount = typeof firstPage.data.folder?.bookmarkCount === 'number'
      ? firstPage.data.folder.bookmarkCount
      : (firstPage.data.bookmarkList?.length || 0);

    const allItems: Record<string, unknown>[] = [...(firstPage.data.bookmarkList || [])];
    for (let start = limit; start < totalCount; start += limit) {
      const page = await fetchPage(start);
      if ('error' in page) {
        return { error: page.error, status: page.status };
      }
      const pageItems = page.data.bookmarkList || [];
      if (!Array.isArray(pageItems) || pageItems.length === 0) break;
      allItems.push(...pageItems);
    }

    if (allItems.length === 0) {
      return { error: 'List is empty or could not be read', status: 400 };
    }

    const places: NaverListPlace[] = [];
    for (const item of allItems) {
      const lat = Number(item?.py);
      const lng = Number(item?.px);
      const name = typeof item?.name === 'string' && item.name.trim()
        ? item.name.trim()
        : (typeof item?.displayName === 'string' ? item.displayName.trim() : '');
      const note = typeof item?.memo === 'string' && item.memo.trim() ? item.memo.trim() : null;
      const address = typeof item?.address === 'string' && item.address.trim() ? item.address.trim() : null;

      if (name && Number.isFinite(lat) && Number.isFinite(lng)) {
        places.push({ name, lat, lng, notes: note, address });
      }
    }

    if (places.length === 0) {
      return { error: 'No places with coordinates found in list', status: 400 };
    }

    return { listName, places };
  }
}
