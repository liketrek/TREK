// FE-COMP-TRIPCOVER-001 to -014: the cover picker the trip dialog and the phone sheet share.
import { act, renderHook } from '@testing-library/react';

import { tripsApi } from '../../api/client';
import { useTripCoverPicker } from './useTripCoverPicker';

const toast = { success: vi.fn(), error: vi.fn() };
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock('../../utils/convertHeic', () => ({ normalizeImageFile: (file: File) => Promise.resolve(file) }));

const origCreate = URL.createObjectURL;
const origRevoke = URL.revokeObjectURL;
const createObjectURL = vi.fn<(obj: Blob) => string>();
const revokeObjectURL = vi.fn<(url: string) => void>();

const png = () => new File(['x'], 'cover.png', { type: 'image/png' });
const photo = { id: 'p1', url: 'https://images.example/p1.jpg', thumb: 'https://images.example/p1-thumb.jpg' };

type Options = Parameters<typeof useTripCoverPicker>[0];

function picker(over: Partial<Options> = {}) {
  const props: Options = { trip: null, title: '', releasePreviewOnChange: false, ...over };
  return renderHook((p: Options) => useTripCoverPicker(p), { initialProps: props });
}

beforeEach(() => {
  let n = 0;
  createObjectURL.mockReset().mockImplementation(() => `blob:${++n}`);
  revokeObjectURL.mockReset();
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
  toast.success.mockReset();
  toast.error.mockReset();
});
afterEach(() => {
  URL.createObjectURL = origCreate;
  URL.revokeObjectURL = origRevoke;
  vi.restoreAllMocks();
});

describe('useTripCoverPicker', () => {
  it('FE-COMP-TRIPCOVER-001: creating stages a picked file as a blob preview without a request', async () => {
    const upload = vi.spyOn(tripsApi, 'uploadCover');
    const { result } = picker();
    await act(() => result.current.selectFile(png()));
    expect(result.current.coverPreview).toBe('blob:1');
    expect(upload).not.toHaveBeenCalled();
  });

  it('FE-COMP-TRIPCOVER-002: editing uploads a picked file straight away', async () => {
    vi.spyOn(tripsApi, 'uploadCover').mockResolvedValue({ cover_image: '/uploads/covers/new.jpg' });
    const onCoverUpdate = vi.fn();
    const { result } = picker({ trip: { id: 5 }, onCoverUpdate });
    await act(() => result.current.selectFile(png()));
    expect(tripsApi.uploadCover).toHaveBeenCalledWith(5, expect.any(FormData));
    expect(result.current.coverPreview).toBe('/uploads/covers/new.jpg');
    expect(onCoverUpdate).toHaveBeenCalledWith(5, '/uploads/covers/new.jpg');
    expect(toast.success).toHaveBeenCalledWith('dashboard.coverSaved');
    expect(result.current.uploadingCover).toBe(false);
  });

  it('FE-COMP-TRIPCOVER-003: a failed upload while editing toasts and keeps the preview', async () => {
    vi.spyOn(tripsApi, 'uploadCover').mockRejectedValue(new Error('boom'));
    const { result } = picker({ trip: { id: 5 } });
    act(() => result.current.resetCover('/uploads/covers/old.jpg'));
    await act(() => result.current.selectFile(png()));
    expect(toast.error).toHaveBeenCalledWith('dashboard.coverUploadError');
    expect(result.current.coverPreview).toBe('/uploads/covers/old.jpg');
  });

  it('FE-COMP-TRIPCOVER-004: the desktop mode revokes a staged preview when another file replaces it', async () => {
    const { result } = picker();
    await act(() => result.current.selectFile(png()));
    await act(() => result.current.selectFile(png()));
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:1');
    expect(result.current.coverPreview).toBe('blob:2');
  });

  it('FE-COMP-TRIPCOVER-005: the desktop mode keeps a dropped preview until reset, then revokes it', async () => {
    const { result } = picker();
    await act(() => result.current.selectFile(png()));
    await act(() => result.current.removeCover());
    expect(result.current.coverPreview).toBeNull();
    expect(revokeObjectURL).not.toHaveBeenCalled();
    act(() => result.current.resetCover(null));
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:1');
  });

  it('FE-COMP-TRIPCOVER-006: the desktop mode revokes the staged preview on unmount', async () => {
    const { result, unmount } = picker();
    await act(() => result.current.selectFile(png()));
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:1');
  });

  it('FE-COMP-TRIPCOVER-007: the phone mode releases a blob preview as soon as it is dropped', async () => {
    const { result } = picker({ releasePreviewOnChange: true });
    await act(() => result.current.selectFile(png()));
    expect(revokeObjectURL).not.toHaveBeenCalled();
    await act(() => result.current.removeCover());
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:1');
  });

  it('FE-COMP-TRIPCOVER-008: the phone mode never revokes a stored cover url', () => {
    const { result, unmount } = picker({ releasePreviewOnChange: true, trip: { id: 5 } });
    act(() => result.current.resetCover('/uploads/covers/a.jpg'));
    unmount();
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it('FE-COMP-TRIPCOVER-009: search falls back to the title and needs one of the two', async () => {
    const searchSpy = vi.spyOn(tripsApi, 'searchCoverImages').mockResolvedValue({ photos: [photo] });
    const empty = picker();
    await act(() => empty.result.current.search());
    expect(empty.result.current.searchError).toBe('dashboard.unsplashQueryRequired');
    expect(searchSpy).not.toHaveBeenCalled();

    const { result } = picker({ title: '  Lisbon  ' });
    await act(() => result.current.search());
    expect(searchSpy).toHaveBeenCalledWith('Lisbon');
    expect(result.current.searchResults).toEqual([photo]);
    expect(result.current.searching).toBe(false);
  });

  it('FE-COMP-TRIPCOVER-010: no photos and failures land in the search error', async () => {
    vi.spyOn(tripsApi, 'searchCoverImages').mockResolvedValueOnce({ photos: [] });
    const { result } = picker();
    act(() => result.current.setSearchQuery('nowhere'));
    await act(() => result.current.search());
    expect(result.current.searchError).toBe('dashboard.unsplashNoResults');

    vi.spyOn(tripsApi, 'searchCoverImages').mockRejectedValueOnce(new Error('offline'));
    await act(() => result.current.search());
    expect(result.current.searchError).toBe('offline');
  });

  it('FE-COMP-TRIPCOVER-011: only the latest search applies its results', async () => {
    let resolveFirst!: (v: { photos: (typeof photo)[] }) => void;
    vi.spyOn(tripsApi, 'searchCoverImages')
      .mockImplementationOnce(() => new Promise((r) => (resolveFirst = r)))
      .mockResolvedValueOnce({ photos: [{ ...photo, id: 'newer' }] });
    const { result } = picker({ title: 'x' });
    let first!: Promise<void>;
    act(() => {
      first = result.current.search();
    });
    await act(() => result.current.search());
    await act(async () => {
      resolveFirst({ photos: [photo] });
      await first;
    });
    expect(result.current.searchResults.map((p) => p.id)).toEqual(['newer']);
  });

  it('FE-COMP-TRIPCOVER-012: picking a photo stages it while creating and saves it while editing', async () => {
    const update = vi.spyOn(tripsApi, 'update').mockResolvedValue({ trip: {} } as never);
    const creating = picker();
    await act(() => creating.result.current.selectPhoto(photo));
    expect(creating.result.current.coverPreview).toBe(photo.url);
    expect(update).not.toHaveBeenCalled();

    const onCoverUpdate = vi.fn();
    const editing = picker({ trip: { id: 9 }, onCoverUpdate });
    await act(() => editing.result.current.selectPhoto(photo));
    expect(update).toHaveBeenCalledWith(9, { cover_image: photo.url });
    expect(onCoverUpdate).toHaveBeenCalledWith(9, photo.url);
    expect(toast.success).toHaveBeenCalledWith('dashboard.coverSaved');
  });

  it('FE-COMP-TRIPCOVER-013: removing a stored cover clears it on the server, a failure toasts', async () => {
    const update = vi.spyOn(tripsApi, 'update').mockResolvedValueOnce({ trip: {} } as never);
    const onCoverUpdate = vi.fn();
    const { result } = picker({ trip: { id: 9 }, onCoverUpdate });
    act(() => result.current.resetCover('/uploads/covers/a.jpg'));
    await act(() => result.current.removeCover());
    expect(update).toHaveBeenCalledWith(9, { cover_image: null });
    expect(onCoverUpdate).toHaveBeenCalledWith(9, null);
    expect(result.current.coverPreview).toBeNull();

    update.mockRejectedValueOnce(new Error('no'));
    await act(() => result.current.removeCover());
    expect(toast.error).toHaveBeenCalledWith('dashboard.coverRemoveError');
  });

  it('FE-COMP-TRIPCOVER-014: applyToCreatedTrip saves the staged file or photo on the new trip', async () => {
    const upload = vi.spyOn(tripsApi, 'uploadCover').mockResolvedValue({ cover_image: '/uploads/covers/c.jpg' });
    const update = vi.spyOn(tripsApi, 'update').mockResolvedValue({ trip: {} } as never);
    const onCoverUpdate = vi.fn();

    const withFile = picker({ onCoverUpdate });
    await act(() => withFile.result.current.applyToCreatedTrip(3));
    expect(upload).not.toHaveBeenCalled();
    await act(() => withFile.result.current.selectFile(png()));
    await act(() => withFile.result.current.applyToCreatedTrip(undefined));
    expect(upload).not.toHaveBeenCalled();
    await act(() => withFile.result.current.applyToCreatedTrip(3));
    expect(upload).toHaveBeenCalledWith(3, expect.any(FormData));
    expect(onCoverUpdate).toHaveBeenCalledWith(3, '/uploads/covers/c.jpg');

    const withPhoto = picker({ onCoverUpdate });
    await act(() => withPhoto.result.current.selectPhoto(photo));
    await act(() => withPhoto.result.current.applyToCreatedTrip(4));
    expect(update).toHaveBeenCalledWith(4, { cover_image: photo.url });
    expect(onCoverUpdate).toHaveBeenCalledWith(4, photo.url);

    upload.mockRejectedValueOnce(new Error('x'));
    await act(() => withFile.result.current.applyToCreatedTrip(3));
    expect(toast.error).toHaveBeenCalledWith('dashboard.coverUploadError');
    update.mockRejectedValueOnce(new Error('x'));
    await act(() => withPhoto.result.current.applyToCreatedTrip(4));
    expect(toast.error).toHaveBeenCalledWith('dashboard.coverSaveError');
  });
});
