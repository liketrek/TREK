// FE-PAGE-ATLASACTIONS-001 to FE-PAGE-ATLASACTIONS-014: the country / region popup logic
// behind both the desktop dialog and the phone sheet.
import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { buildAtlasData, buildBucketItem } from '../../../tests/helpers/atlas';
import { server } from '../../../tests/helpers/msw/server';
import type { AtlasData, BucketItem } from './atlasModel';
import {
  bucketMonthTarget,
  useAtlasCountryActions,
  withCountryDroppedAfterRegionUnmark,
  withRegionMarked,
  withRegionUnmarked,
  type AtlasConfirmAction,
  type VisitedRegionMap,
} from './useAtlasCountryActions';

const t = (k: string) => k;

let addToast: Mock<NonNullable<Window['__addToast']>>;
let posted: { url: string; body: unknown }[];
let deleted: string[];

interface HarnessInit {
  confirmAction: AtlasConfirmAction | null;
  data?: AtlasData | null;
  visitedRegions?: VisitedRegionMap;
  bucketList?: BucketItem[];
  handleDeleteBucketItem?: (id: number) => Promise<void>;
}

/** The hook over real state, the way useAtlas hands it its slices. */
function setup(init: HarnessInit) {
  const handleDeleteBucketItem = init.handleDeleteBucketItem ?? vi.fn().mockResolvedValue(undefined);
  return renderHook(() => {
    const [confirmAction, setConfirmAction] = useState<AtlasConfirmAction | null>(init.confirmAction);
    const [data, setData] = useState<AtlasData | null>(init.data ?? buildAtlasData());
    const [visitedRegions, setVisitedRegions] = useState<VisitedRegionMap>(init.visitedRegions ?? {});
    const [bucketList, setBucketList] = useState<BucketItem[]>(init.bucketList ?? []);
    const actions = useAtlasCountryActions({
      t,
      confirmAction,
      setConfirmAction,
      setData,
      visitedRegions,
      setVisitedRegions,
      bucketList,
      setBucketList,
      handleDeleteBucketItem,
    });
    return { actions, confirmAction, setConfirmAction, data, visitedRegions, bucketList };
  });
}

beforeEach(() => {
  addToast = vi.fn<NonNullable<Window['__addToast']>>();
  window.__addToast = addToast;
  posted = [];
  deleted = [];
  server.use(
    http.post('/api/addons/atlas/country/:code/mark', ({ request }) => {
      posted.push({ url: new URL(request.url).pathname, body: null });
      return HttpResponse.json({ success: true });
    }),
    http.post('/api/addons/atlas/region/:code/mark', async ({ request }) => {
      posted.push({ url: new URL(request.url).pathname, body: await request.json() });
      return HttpResponse.json({ success: true });
    }),
    http.delete('/api/addons/atlas/region/:code/mark', ({ request }) => {
      deleted.push(new URL(request.url).pathname);
      return HttpResponse.json({ success: true });
    }),
    http.post('/api/addons/atlas/bucket-list', async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      posted.push({ url: '/api/addons/atlas/bucket-list', body });
      return HttpResponse.json({
        item: buildBucketItem({
          id: 42,
          name: String(body.name),
          country_code: String(body.country_code),
          target_date: (body.target_date as string | null) ?? null,
        }),
      });
    })
  );
});

afterEach(() => {
  delete window.__addToast;
});

describe('atlas popup helpers', () => {
  it('FE-PAGE-ATLASACTIONS-001: a bucket month needs both month and year', () => {
    expect(bucketMonthTarget(3, 2027)).toBe('2027-03');
    expect(bucketMonthTarget(0, 2027)).toBeNull();
    expect(bucketMonthTarget(3, 0)).toBeNull();
  });

  it('FE-PAGE-ATLASACTIONS-002: marking a region adds it once', () => {
    const region = { code: 'ES-GA', name: 'Galicia', placeCount: 0, manuallyMarked: true };
    const once = withRegionMarked({}, 'ES', region);
    expect(once).toEqual({ ES: [region] });
    expect(withRegionMarked(once, 'ES', region)).toBe(once);
  });

  it('FE-PAGE-ATLASACTIONS-003: unmarking the last region of a country drops the country key', () => {
    const prev = {
      ES: [
        { code: 'ES-GA', name: 'Galicia', placeCount: 0 },
        { code: 'ES-MD', name: 'Madrid', placeCount: 0 },
      ],
    };
    expect(withRegionUnmarked(prev, 'ES', 'ES-GA')).toEqual({ ES: [{ code: 'ES-MD', name: 'Madrid', placeCount: 0 }] });
    expect(withRegionUnmarked({ ES: [prev.ES[0]] }, 'ES', 'ES-GA')).toEqual({});
  });

  it('FE-PAGE-ATLASACTIONS-004: the country goes with its last region only without places or trips of its own', () => {
    const regions = { ES: [{ code: 'ES-GA', name: 'Galicia', placeCount: 0 }] };
    const marked = buildAtlasData({
      countries: [{ code: 'ES', tripCount: 0, placeCount: 0, firstVisit: null, lastVisit: null }],
      stats: { ...buildAtlasData().stats, totalCountries: 1 },
      continents: { Europe: 1 },
    });
    const dropped = withCountryDroppedAfterRegionUnmark(marked, 'ES', 'ES-GA', regions);
    expect(dropped?.countries).toEqual([]);
    expect(dropped?.stats.totalCountries).toBe(0);
    expect(dropped?.continents?.Europe).toBe(0);

    const withPlaces = buildAtlasData({ countries: [{ ...marked.countries[0], placeCount: 2 }] });
    expect(withCountryDroppedAfterRegionUnmark(withPlaces, 'ES', 'ES-GA', regions)).toBe(withPlaces);
    const twoRegions = { ES: [...regions.ES, { code: 'ES-MD', name: 'Madrid', placeCount: 0 }] };
    expect(withCountryDroppedAfterRegionUnmark(marked, 'ES', 'ES-GA', twoRegions)).toBe(marked);
    expect(withCountryDroppedAfterRegionUnmark(null, 'ES', 'ES-GA', regions)).toBeNull();
  });
});

describe('useAtlasCountryActions', () => {
  it('FE-PAGE-ATLASACTIONS-005: marking a country posts it, adds it to the atlas and closes', async () => {
    const { result } = setup({ confirmAction: { type: 'choose', code: 'DE', name: 'Germany' } });
    await act(() => result.current.actions.markCountry());
    expect(posted).toEqual([{ url: '/api/addons/atlas/country/DE/mark', body: null }]);
    expect(result.current.data?.countries.map((c) => c.code)).toEqual(['FR', 'DE']);
    expect(result.current.confirmAction).toBeNull();
  });

  it('FE-PAGE-ATLASACTIONS-006: a failed mark toasts and still closes', async () => {
    server.use(
      http.post('/api/addons/atlas/country/:code/mark', () => HttpResponse.json({ error: 'Locked' }, { status: 400 }))
    );
    const { result } = setup({ confirmAction: { type: 'choose', code: 'DE', name: 'Germany' } });
    await act(() => result.current.actions.markCountry());
    expect(addToast).toHaveBeenCalledWith('Locked', 'error', undefined);
    expect(result.current.data?.countries.map((c) => c.code)).toEqual(['FR']);
    expect(result.current.confirmAction).toBeNull();
  });

  it('FE-PAGE-ATLASACTIONS-007: marking a region stores it without a status (desktop) or as visited (phone)', async () => {
    const action: AtlasConfirmAction = { type: 'choose-region', code: 'ES', name: 'Galicia', regionCode: 'ES-GA' };
    const desktop = setup({ confirmAction: action });
    await act(() => desktop.result.current.actions.markRegion());
    expect(posted[0]).toEqual({
      url: '/api/addons/atlas/region/ES-GA/mark',
      body: { name: 'Galicia', country_code: 'ES' },
    });
    expect(desktop.result.current.visitedRegions).toEqual({
      ES: [{ code: 'ES-GA', name: 'Galicia', placeCount: 0, manuallyMarked: true }],
    });
    expect(desktop.result.current.data?.countries.map((c) => c.code)).toEqual(['FR', 'ES']);

    const phone = setup({ confirmAction: action });
    await act(() => phone.result.current.actions.markRegion(true));
    expect(phone.result.current.visitedRegions).toEqual({
      ES: [{ code: 'ES-GA', name: 'Galicia', placeCount: 0, status: 'visited', manuallyMarked: true }],
    });
    expect(phone.result.current.confirmAction).toBeNull();
  });

  it('FE-PAGE-ATLASACTIONS-008: a region action without a region code does nothing', async () => {
    const { result } = setup({ confirmAction: { type: 'choose-region', code: 'ES', name: 'Galicia' } });
    await act(() => result.current.actions.markRegion());
    await act(() => result.current.actions.unmarkRegion());
    expect(posted).toEqual([]);
    expect(deleted).toEqual([]);
    expect(result.current.confirmAction).not.toBeNull();
  });

  it('FE-PAGE-ATLASACTIONS-009: unmarking a region removes it and the country it leaves empty', async () => {
    const { result } = setup({
      confirmAction: { type: 'unmark-region', code: 'ES', name: 'Galicia', regionCode: 'ES-GA' },
      data: buildAtlasData({
        countries: [{ code: 'ES', tripCount: 0, placeCount: 0, firstVisit: null, lastVisit: null }],
      }),
      visitedRegions: { ES: [{ code: 'ES-GA', name: 'Galicia', placeCount: 0 }] },
    });
    await act(() => result.current.actions.unmarkRegion());
    expect(deleted).toEqual(['/api/addons/atlas/region/ES-GA/mark']);
    expect(result.current.visitedRegions).toEqual({});
    expect(result.current.data?.countries).toEqual([]);
    expect(result.current.confirmAction).toBeNull();
  });

  it('FE-PAGE-ATLASACTIONS-010: adding to the bucket list posts the entry, prepends it and runs beforeClose', async () => {
    const beforeClose = vi.fn();
    const { result } = setup({
      confirmAction: { type: 'bucket', code: 'ES', name: 'Galicia', regionCode: 'ES-GA' },
      bucketList: [buildBucketItem()],
    });
    await act(() => result.current.actions.addBucket('2027-05', beforeClose));
    expect(posted).toEqual([
      {
        url: '/api/addons/atlas/bucket-list',
        body: { name: 'Galicia', country_code: 'ES', target_date: '2027-05', region_code: 'ES-GA' },
      },
    ]);
    expect(result.current.bucketList.map((b) => b.id)).toEqual([42, 1]);
    expect(beforeClose).toHaveBeenCalledTimes(1);
    expect(result.current.confirmAction).toBeNull();
  });

  it('FE-PAGE-ATLASACTIONS-011: a known duplicate stays open without a request', async () => {
    const beforeClose = vi.fn();
    const { result } = setup({
      confirmAction: { type: 'bucket', code: 'DE', name: 'Germany' },
      bucketList: [buildBucketItem({ name: 'Germany', country_code: 'DE', target_date: '2027-05' })],
    });
    await act(() => result.current.actions.addBucket('2027-05', beforeClose));
    expect(posted).toEqual([]);
    expect(addToast).toHaveBeenCalledWith('atlas.bucketDuplicate', 'error', undefined);
    expect(beforeClose).not.toHaveBeenCalled();
    expect(result.current.confirmAction).not.toBeNull();
  });

  it('FE-PAGE-ATLASACTIONS-012: a server duplicate stays open, any other failure toasts and closes', async () => {
    server.use(http.post('/api/addons/atlas/bucket-list', () => HttpResponse.json({ error: 'dup' }, { status: 409 })));
    const { result } = setup({ confirmAction: { type: 'bucket', code: 'DE', name: 'Germany' } });
    await act(() => result.current.actions.addBucket(null));
    expect(addToast).toHaveBeenLastCalledWith('atlas.bucketDuplicate', 'error', undefined);
    expect(result.current.confirmAction).not.toBeNull();

    server.use(http.post('/api/addons/atlas/bucket-list', () => HttpResponse.json({ error: 'Boom' }, { status: 500 })));
    await act(() => result.current.actions.addBucket(null));
    expect(addToast).toHaveBeenLastCalledWith('Boom', 'error', undefined);
    expect(result.current.confirmAction).toBeNull();
  });

  it('FE-PAGE-ATLASACTIONS-013: the phone month input feeds the entry and clears when the popup closes', async () => {
    const { result } = setup({ confirmAction: { type: 'bucket', code: 'DE', name: 'Germany' } });
    act(() => result.current.actions.setBucketDate('2028-01'));
    await act(() => result.current.actions.addBucketForDate());
    expect(posted[0].body).toMatchObject({ target_date: '2028-01' });
    expect(result.current.actions.bucketDate).toBe('');

    act(() => result.current.setConfirmAction({ type: 'bucket', code: 'DE', name: 'Germany' }));
    await act(() => result.current.actions.addBucketForDate());
    expect(posted[1].body).toMatchObject({ target_date: null });
  });

  it('FE-PAGE-ATLASACTIONS-014: taking a country off the wishlist deletes every entry for it', async () => {
    const handleDeleteBucketItem = vi.fn().mockResolvedValue(undefined);
    const { result } = setup({
      confirmAction: { type: 'choose', code: 'FR', name: 'France' },
      bucketList: [
        buildBucketItem({ id: 1, country_code: 'FR' }),
        buildBucketItem({ id: 2, country_code: 'FR' }),
        buildBucketItem({ id: 3, country_code: 'JP' }),
      ],
      handleDeleteBucketItem,
    });
    expect(result.current.actions.onWishlist).toBe(true);
    await act(() => result.current.actions.removeBucket());
    expect(handleDeleteBucketItem.mock.calls).toEqual([[1], [2]]);
    expect(result.current.confirmAction).toBeNull();
    expect(result.current.actions.onWishlist).toBe(false);
  });
});
