// FE-STORE-JGAL-001 to FE-STORE-JGAL-011
import { http, HttpResponse } from 'msw';
import { server } from '../../tests/helpers/msw/server';
import { journeyApi } from '../api/client';
import { captureVideoPoster } from '../utils/videoPoster';
import { useJourneyStore } from './journeyStore';
import type { GalleryPhoto, JourneyDetail, JourneyEntry, JourneyPhoto } from './journeyStore';

// The real capture needs a decoding <video> + canvas; jsdom has neither.
vi.mock('../utils/videoPoster', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/videoPoster')>();
  return { ...actual, captureVideoPoster: vi.fn() };
});

const initialState = useJourneyStore.getState();

function buildPhoto(over: Partial<JourneyPhoto> = {}): JourneyPhoto {
  return {
    id: 1, entry_id: 10, photo_id: 100, caption: null, sort_order: 0, shared: 0, created_at: 0,
    provider: 'local', asset_id: null, owner_id: 1, file_path: null, thumbnail_path: null,
    width: null, height: null, media_type: 'image', duration_ms: null,
    ...over,
  };
}

function buildGalleryPhoto(over: Partial<GalleryPhoto> = {}): GalleryPhoto {
  return {
    id: 1, journey_id: 50, photo_id: 100, caption: null, shared: 0, sort_order: 0, created_at: 0,
    provider: 'local', asset_id: null, owner_id: 1, file_path: null, thumbnail_path: null,
    width: null, height: null, media_type: 'image', duration_ms: null,
    ...over,
  };
}

function buildEntry(over: Partial<JourneyEntry> = {}): JourneyEntry {
  return {
    id: 10, journey_id: 50, author_id: 1, type: 'entry', title: 'Day 1', story: null,
    entry_date: '2026-04-01', entry_time: null, location_name: null, location_lat: null,
    location_lng: null, mood: null, weather: null, tags: [], pros_cons: null,
    visibility: 'private', sort_order: 0, photos: [], created_at: 0, updated_at: 0,
    ...over,
  };
}

function buildDetail(over: Partial<JourneyDetail> = {}): JourneyDetail {
  return {
    id: 50, user_id: 1, title: 'Japan', subtitle: null, cover_gradient: null, cover_image: null,
    status: 'active', created_at: 0, updated_at: 0,
    entries: [], gallery: [], trips: [], contributors: [],
    stats: { entries: 0, photos: 0, places: 0 },
    ...over,
  };
}

const imageFile = () => new File(['x'], 'shrine.jpg', { type: 'image/jpeg' });
const videoFile = () => new File(['x'], 'clip.mp4', { type: 'video/mp4' });

beforeEach(() => {
  useJourneyStore.setState(initialState, true);
  server.resetHandlers();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('journeyStore gallery + photo links', () => {
  // ── uploadGalleryPhotos ──────────────────────────────────────────────────

  it('FE-STORE-JGAL-001: uploading an image appends it to the journey gallery', async () => {
    useJourneyStore.setState({ current: buildDetail({ gallery: [buildGalleryPhoto({ id: 1 })] }) });
    const added = buildGalleryPhoto({ id: 2, photo_id: 101 });
    // MSW's XHR interceptor hangs on FormData bodies in jsdom — spy on the API layer.
    const spy = vi.spyOn(journeyApi, 'uploadGalleryPhotos').mockResolvedValue({ photos: [added] });

    const result = await useJourneyStore.getState().uploadGalleryPhotos(50, [imageFile()]);

    expect(result.succeeded).toEqual([added]);
    expect(result.failed).toEqual([]);
    expect(spy.mock.calls[0][0]).toBe(50);
    expect((spy.mock.calls[0][1] as FormData).get('photos')).toBeInstanceOf(File);
    expect(useJourneyStore.getState().current?.gallery.map(p => p.id)).toEqual([1, 2]);
  });

  it('FE-STORE-JGAL-002: a video is uploaded with its poster frame and duration', async () => {
    useJourneyStore.setState({ current: buildDetail() });
    const poster = new Blob(['jpg'], { type: 'image/jpeg' });
    vi.mocked(captureVideoPoster).mockResolvedValue({ poster, durationMs: 4200 });
    const added = buildGalleryPhoto({ id: 3, media_type: 'video', duration_ms: 4200 });
    const spy = vi.spyOn(journeyApi, 'uploadGalleryVideo').mockResolvedValue({ photos: [added] });

    const result = await useJourneyStore.getState().uploadGalleryPhotos(50, [videoFile()]);

    const fd = spy.mock.calls[0][1] as FormData;
    expect(fd.get('video')).toBeInstanceOf(File);
    expect(fd.get('poster')).toBeInstanceOf(Blob);
    expect(fd.get('duration_ms')).toBe('4200');
    expect(result.succeeded).toEqual([added]);
    expect(useJourneyStore.getState().current?.gallery).toEqual([added]);
  });

  it('FE-STORE-JGAL-003: a video whose poster capture fails still uploads the raw file', async () => {
    useJourneyStore.setState({ current: buildDetail() });
    vi.mocked(captureVideoPoster).mockResolvedValue({ poster: null, durationMs: null });
    const spy = vi.spyOn(journeyApi, 'uploadGalleryVideo').mockResolvedValue({});

    const result = await useJourneyStore.getState().uploadGalleryPhotos(50, [videoFile()]);

    const fd = spy.mock.calls[0][1] as FormData;
    expect(fd.get('poster')).toBeNull();
    expect(fd.get('duration_ms')).toBeNull();
    expect(result.succeeded).toEqual([]);
    expect(useJourneyStore.getState().current?.gallery).toEqual([]);
  });

  it('FE-STORE-JGAL-004: photos for a different journey are not merged into the open one', async () => {
    useJourneyStore.setState({ current: buildDetail({ id: 50 }) });
    vi.spyOn(journeyApi, 'uploadGalleryPhotos').mockResolvedValue({ photos: [buildGalleryPhoto({ id: 9 })] });

    const result = await useJourneyStore.getState().uploadGalleryPhotos(99, [imageFile()]);

    expect(result.succeeded).toHaveLength(1);
    expect(useJourneyStore.getState().current?.gallery).toEqual([]);
  });

  it('FE-STORE-JGAL-005: a 4xx upload lands in failed without touching the gallery', async () => {
    useJourneyStore.setState({ current: buildDetail() });
    vi.spyOn(journeyApi, 'uploadGalleryPhotos').mockRejectedValue(
      Object.assign(new Error('Unsupported'), { response: { status: 415 } }),
    );
    const file = imageFile();

    const result = await useJourneyStore.getState().uploadGalleryPhotos(50, [file]);

    expect(result.succeeded).toEqual([]);
    expect(result.failed).toEqual([file]);
    expect(useJourneyStore.getState().current?.gallery).toEqual([]);
  });

  it('FE-STORE-JGAL-006: upload progress is reported to the caller', async () => {
    useJourneyStore.setState({ current: buildDetail() });
    vi.spyOn(journeyApi, 'uploadGalleryPhotos').mockResolvedValue({ photos: [] });
    const onProgress = vi.fn();

    await useJourneyStore.getState().uploadGalleryPhotos(50, [imageFile()], { onProgress });

    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ done: 1, total: 1, failed: 0 }));
  });

  // ── unlinkPhoto ──────────────────────────────────────────────────────────

  it('FE-STORE-JGAL-007: unlinking removes the photo from that entry only', async () => {
    const entry = buildEntry({ id: 10, photos: [buildPhoto({ id: 1 }), buildPhoto({ id: 2 })] });
    const other = buildEntry({ id: 11, photos: [buildPhoto({ id: 1, entry_id: 11 })] });
    useJourneyStore.setState({ current: buildDetail({ entries: [entry, other] }) });
    server.use(http.delete('/api/journeys/entries/10/photos/1', () => HttpResponse.json({})));

    await useJourneyStore.getState().unlinkPhoto(10, 1);

    const entries = useJourneyStore.getState().current!.entries;
    expect(entries[0].photos.map(p => p.id)).toEqual([2]);
    expect(entries[1].photos.map(p => p.id)).toEqual([1]);
  });

  it('FE-STORE-JGAL-008: unlinking without an open journey leaves the state untouched', async () => {
    server.use(http.delete('/api/journeys/entries/10/photos/1', () => HttpResponse.json({})));
    await useJourneyStore.getState().unlinkPhoto(10, 1);
    expect(useJourneyStore.getState().current).toBeNull();
  });

  it('FE-STORE-JGAL-009: a rejected unlink keeps the photo attached', async () => {
    const entry = buildEntry({ id: 10, photos: [buildPhoto({ id: 1 })] });
    useJourneyStore.setState({ current: buildDetail({ entries: [entry] }) });
    server.use(http.delete('/api/journeys/entries/10/photos/1', () => HttpResponse.json({}, { status: 403 })));

    await expect(useJourneyStore.getState().unlinkPhoto(10, 1)).rejects.toBeTruthy();
    expect(useJourneyStore.getState().current!.entries[0].photos).toHaveLength(1);
  });

  // ── deleteGalleryPhoto ───────────────────────────────────────────────────

  it('FE-STORE-JGAL-010: deleting a gallery photo drops it from the gallery and every entry', async () => {
    const entry = buildEntry({ id: 10, photos: [buildPhoto({ id: 1 }), buildPhoto({ id: 2 })] });
    useJourneyStore.setState({
      current: buildDetail({
        entries: [entry],
        gallery: [buildGalleryPhoto({ id: 1 }), buildGalleryPhoto({ id: 2 })],
      }),
    });
    server.use(http.delete('/api/journeys/50/gallery/1', () => HttpResponse.json({})));

    await useJourneyStore.getState().deleteGalleryPhoto(50, 1);

    const state = useJourneyStore.getState().current!;
    expect(state.gallery.map(p => p.id)).toEqual([2]);
    expect(state.entries[0].photos.map(p => p.id)).toEqual([2]);
  });

  it('FE-STORE-JGAL-011: deleting a gallery photo without an open journey is a no-op', async () => {
    server.use(http.delete('/api/journeys/50/gallery/1', () => HttpResponse.json({})));
    await useJourneyStore.getState().deleteGalleryPhoto(50, 1);
    expect(useJourneyStore.getState().current).toBeNull();
  });
});
