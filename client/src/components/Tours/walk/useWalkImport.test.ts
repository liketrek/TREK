import { act, renderHook } from '@testing-library/react';
import type { WalkImportPreviewResponse } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TranslationProvider } from '../../../i18n/TranslationContext';
import { OnlineOnlyError } from '../../../repo/onlineOnly';
import { tourWalkImportRepo } from '../../../repo/tourWalkImportRepo';
import { useWalkImport } from './useWalkImport';

// FE-WALK-IMPORT-001 to FE-WALK-IMPORT-007

const ROUTE = 'https://www.google.com/maps/dir/Cathedral/Market/Park/data=!3e2';
const PREVIEW: WalkImportPreviewResponse = {
  stations: [
    { name: 'Cathedral', lat: 48.1, lng: 11.5 },
    { name: 'Market', lat: null, lng: null },
    { name: null, lat: 48.12, lng: 11.52 },
    { name: 'Park', lat: 48.13, lng: 11.53 },
  ],
  resolved_url: ROUTE,
};

let preview: ReturnType<typeof vi.spyOn>;
const planner = () => ({ tripId: 5, startDerivedTour: vi.fn(() => true) });

function setup(p = planner()) {
  const hook = renderHook(() => useWalkImport({ planner: p }), { wrapper: TranslationProvider });
  return { ...hook, planner: p };
}

async function readLink(result: ReturnType<typeof setup>['result'], text: string) {
  act(() => result.current.show());
  act(() => result.current.setUrl(text));
  await act(() => result.current.read());
}

beforeEach(() => {
  preview = vi.spyOn(tourWalkImportRepo, 'preview').mockResolvedValue(PREVIEW);
});
afterEach(() => vi.restoreAllMocks());

describe('useWalkImport (CW-07)', () => {
  it('FE-WALK-IMPORT-001: reads the link and shows its stops, counting the ones without a position', async () => {
    const { result } = setup();
    expect(result.current.open).toBe(false);
    act(() => result.current.show());
    expect(result.current.open).toBe(true);
    expect(result.current.canRead).toBe(false);
    act(() => result.current.setUrl(' https://maps.app.goo.gl/abc '));
    expect(result.current.canRead).toBe(true);
    await act(() => result.current.read());
    expect(preview).toHaveBeenCalledWith(5, 'https://maps.app.goo.gl/abc', expect.any(AbortSignal));
    expect(result.current.phase).toBe('preview');
    expect(result.current.preview).toBe(PREVIEW);
    expect(result.current.unplaced).toBe(1);
    expect(result.current.canLoad).toBe(true);
  });

  it('FE-WALK-IMPORT-002: takes the one link out of the share text of the Google Maps app, and sends anything else as typed', async () => {
    const { result } = setup();
    await readLink(result, 'Walk through the old town\nhttps://maps.app.goo.gl/abc');
    expect(preview).toHaveBeenLastCalledWith(5, 'https://maps.app.goo.gl/abc', expect.any(AbortSignal));
    await readLink(result, 'https://maps.app.goo.gl/a https://maps.app.goo.gl/b');
    expect(preview).toHaveBeenLastCalledWith(
      5,
      'https://maps.app.goo.gl/a https://maps.app.goo.gl/b',
      expect.any(AbortSignal)
    );
    preview.mockClear();
    act(() => result.current.setUrl('   '));
    await act(() => result.current.read());
    expect(preview).not.toHaveBeenCalled();
  });

  it('FE-WALK-IMPORT-003: a refusal is said in the reader’s language, offline and other failures too', async () => {
    const { result } = setup();
    preview.mockRejectedValueOnce({
      response: { status: 400, data: { error: 'Not on foot.', reason: 'not_walking' } },
    });
    await readLink(result, ROUTE);
    expect(result.current.phase).toBe('link');
    expect(result.current.failure).toBe(
      'That route is not planned on foot. Switch Google Maps to walking and share the route again.'
    );
    preview.mockRejectedValueOnce(new OnlineOnlyError());
    await act(() => result.current.read());
    expect(result.current.failure).toBe('Reading a link needs a connection.');
    preview.mockRejectedValueOnce(new Error('Network Error'));
    await act(() => result.current.read());
    expect(result.current.failure).toBe('The link could not be read just now. Try again in a moment.');
    // The link stays as typed for another try.
    expect(result.current.url).toBe(ROUTE);
  });

  it('FE-WALK-IMPORT-004: a newer read and closing drop the request before it answers', async () => {
    const answers: Array<(value: WalkImportPreviewResponse) => void> = [];
    preview.mockImplementation(() => new Promise((resolve) => answers.push(resolve)));
    const { result } = setup();
    act(() => result.current.show());
    act(() => result.current.setUrl(ROUTE));
    let first: Promise<void> = Promise.resolve();
    act(() => {
      first = result.current.read();
    });
    expect(result.current.phase).toBe('reading');
    expect(result.current.canRead).toBe(false);
    const firstSignal = preview.mock.calls[0][2] as AbortSignal;
    let second: Promise<void> = Promise.resolve();
    act(() => {
      second = result.current.read();
    });
    expect(firstSignal.aborted).toBe(true);
    const secondSignal = preview.mock.calls[1][2] as AbortSignal;
    act(() => result.current.close());
    expect(secondSignal.aborted).toBe(true);
    await act(async () => {
      answers.forEach((resolve) => resolve(PREVIEW));
      await Promise.all([first, second]);
    });
    expect(result.current.open).toBe(false);
    expect(result.current.preview).toBeNull();
  });

  it('FE-WALK-IMPORT-005: a failure that comes after closing is not shown, and unmounting drops the request', async () => {
    let fail: (reason: unknown) => void = () => undefined;
    preview.mockImplementation(() => new Promise((_resolve, reject) => (fail = reject)));
    const { result, unmount } = setup();
    act(() => result.current.show());
    act(() => result.current.setUrl(ROUTE));
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.read();
    });
    act(() => result.current.close());
    await act(async () => {
      fail(new Error('late'));
      await pending;
    });
    expect(result.current.failure).toBeNull();

    act(() => result.current.show());
    act(() => result.current.setUrl(ROUTE));
    act(() => {
      void result.current.read();
    });
    const signal = preview.mock.calls[1][2] as AbortSignal;
    unmount();
    expect(signal.aborted).toBe(true);
  });

  it('FE-WALK-IMPORT-006: loads only the stops with a position, in order and with their names, as a walk from Google Maps', async () => {
    const { result, planner: p } = setup();
    await readLink(result, ROUTE);
    act(() => result.current.load());
    expect(p.startDerivedTour).toHaveBeenCalledExactlyOnceWith({
      name: 'Walk from Google Maps',
      difficulty: 2,
      points: [
        { lat: 48.1, lng: 11.5, name: 'Cathedral' },
        { lat: 48.12, lng: 11.52, name: null },
        { lat: 48.13, lng: 11.53, name: 'Park' },
      ],
      inPlace: false,
      tourType: 'walk',
      source: 'google_maps',
    });
    expect(result.current.open).toBe(false);
  });

  it('FE-WALK-IMPORT-007: stays open when the planner does not take it, and loads nothing with fewer than two positions', async () => {
    const refusing = { tripId: 5, startDerivedTour: vi.fn(() => false) };
    const { result } = setup(refusing);
    await readLink(result, ROUTE);
    act(() => result.current.load());
    expect(refusing.startDerivedTour).toHaveBeenCalledTimes(1);
    expect(result.current.open).toBe(true);

    act(() => result.current.back());
    expect(result.current.phase).toBe('link');
    expect(result.current.preview).toBeNull();
    expect(result.current.url).toBe(ROUTE);

    preview.mockResolvedValueOnce({
      ...PREVIEW,
      stations: [PREVIEW.stations[0], PREVIEW.stations[1]],
    });
    await act(() => result.current.read());
    expect(result.current.canLoad).toBe(false);
    act(() => result.current.load());
    expect(refusing.startDerivedTour).toHaveBeenCalledTimes(1);
  });
});
