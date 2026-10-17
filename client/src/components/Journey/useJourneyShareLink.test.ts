// FE-JRN-SHAREHOOK-001 to FE-JRN-SHAREHOOK-008: the public share link logic behind
// both the desktop share section and the phone settings sheet.
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { server } from '../../../tests/helpers/msw/server';
import { journeyShareUrl, useJourneyShareLink } from './useJourneyShareLink';

vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

const LINK = { token: 'tok', share_timeline: true, share_gallery: false, share_map: true };

let addToast: Mock<NonNullable<Window['__addToast']>>;
let posted: unknown[];

beforeEach(() => {
  addToast = vi.fn<NonNullable<Window['__addToast']>>();
  window.__addToast = addToast;
  posted = [];
  server.use(
    http.get('/api/journeys/7/share-link', () => HttpResponse.json({ link: LINK })),
    http.post('/api/journeys/7/share-link', async ({ request }) => {
      posted.push(await request.json());
      return HttpResponse.json({ token: 'fresh' });
    }),
    http.delete('/api/journeys/7/share-link', () => HttpResponse.json({ success: true }))
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  delete window.__addToast;
});

async function loaded() {
  const hook = renderHook(() => useJourneyShareLink(7));
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

describe('journeyShareUrl', () => {
  it('FE-JRN-SHAREHOOK-001: the public journey address of a token, empty without a link', () => {
    expect(journeyShareUrl(LINK, 'https://trek.example')).toBe('https://trek.example/public/journey/tok');
    expect(journeyShareUrl(null, 'https://trek.example')).toBe('');
  });
});

describe('useJourneyShareLink', () => {
  it('FE-JRN-SHAREHOOK-002: loads the existing link', async () => {
    const { result } = await loaded();
    expect(result.current.link).toEqual(LINK);
    expect(result.current.manageable).toBe(true);
    expect(result.current.shareUrl).toBe(`${window.location.origin}/public/journey/tok`);
  });

  it('FE-JRN-SHAREHOOK-003: a 403 marks the link as not this user to manage, other errors do not', async () => {
    server.use(http.get('/api/journeys/7/share-link', () => HttpResponse.json({ error: 'no' }, { status: 403 })));
    const refused = await loaded();
    expect(refused.result.current.manageable).toBe(false);

    server.use(http.get('/api/journeys/7/share-link', () => HttpResponse.json({ error: 'down' }, { status: 500 })));
    const failed = await loaded();
    expect(failed.result.current.manageable).toBe(true);
    expect(failed.result.current.link).toBeNull();
  });

  it('FE-JRN-SHAREHOOK-004: creating shares every section', async () => {
    server.use(http.get('/api/journeys/7/share-link', () => HttpResponse.json({ link: null })));
    const { result } = await loaded();
    await act(() => result.current.createLink());
    expect(posted).toEqual([{ share_timeline: true, share_gallery: true, share_map: true }]);
    expect(result.current.link).toEqual({ token: 'fresh', share_timeline: true, share_gallery: true, share_map: true });
    expect(addToast).toHaveBeenCalledWith('journey.share.linkCreated', 'success', undefined);
  });

  it('FE-JRN-SHAREHOOK-005: a failed create only toasts', async () => {
    server.use(
      http.get('/api/journeys/7/share-link', () => HttpResponse.json({ link: null })),
      http.post('/api/journeys/7/share-link', () => HttpResponse.json({ error: 'x' }, { status: 500 }))
    );
    const { result } = await loaded();
    await act(() => result.current.createLink());
    expect(result.current.link).toBeNull();
    expect(addToast).toHaveBeenCalledWith('journey.share.createFailed', 'error', undefined);
  });

  it('FE-JRN-SHAREHOOK-006: a section switch saves the whole set and rolls back when refused', async () => {
    const { result } = await loaded();
    await act(() => result.current.togglePerm('share_gallery'));
    expect(posted).toEqual([{ share_timeline: true, share_gallery: true, share_map: true }]);
    expect(result.current.link?.share_gallery).toBe(true);

    server.use(http.post('/api/journeys/7/share-link', () => HttpResponse.json({ error: 'x' }, { status: 500 })));
    await act(() => result.current.togglePerm('share_map'));
    expect(result.current.link?.share_map).toBe(true);
    expect(addToast).toHaveBeenCalledWith('journey.share.updateFailed', 'error', undefined);
  });

  it('FE-JRN-SHAREHOOK-007: deleting drops the link, a failure keeps it', async () => {
    const { result } = await loaded();
    server.use(http.delete('/api/journeys/7/share-link', () => HttpResponse.json({ error: 'x' }, { status: 500 })));
    await act(() => result.current.deleteLink());
    expect(result.current.link).toEqual(LINK);
    expect(addToast).toHaveBeenCalledWith('journey.share.deleteFailed', 'error', undefined);

    server.use(http.delete('/api/journeys/7/share-link', () => HttpResponse.json({ success: true })));
    await act(() => result.current.deleteLink());
    expect(result.current.link).toBeNull();
    expect(addToast).toHaveBeenLastCalledWith('journey.share.linkDeleted', 'success', undefined);
  });

  it('FE-JRN-SHAREHOOK-008: copying shows "copied" for two seconds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true, writable: true });
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true, writable: true });
    const { result } = await loaded();
    vi.useFakeTimers();
    await act(() => result.current.copyLink());
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/public/journey/tok`);
    expect(result.current.copied).toBe(true);
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.copied).toBe(false);
  });
});
