// FE-JRN-GALLERYUPLOAD-001 to FE-JRN-GALLERYUPLOAD-007: the gallery upload behind both
// the desktop gallery and the phone journey screen.
import { act, renderHook } from '@testing-library/react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { useJourneyStore } from '../../store/journeyStore';
import { useGalleryUpload, type GalleryUploadOptions } from './useGalleryUpload';

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (k: string, p?: Record<string, unknown>) => (p ? `${k}:${JSON.stringify(p)}` : k),
  }),
}));
vi.mock('../../utils/convertHeic', () => ({
  normalizeImageFiles: (files: File[]) => Promise.resolve(files.map((f) => new File([f], `${f.name}.jpg`))),
}));

let addToast: Mock<NonNullable<Window['__addToast']>>;
let upload: Mock;
const initial = useJourneyStore.getState();

function setup(over: Partial<GalleryUploadOptions> = {}) {
  const props: GalleryUploadOptions = { journeyId: 12, onUploaded: vi.fn(), ...over };
  const hook = renderHook((p: GalleryUploadOptions) => useGalleryUpload(p), { initialProps: props });
  return { ...hook, props };
}

function changeEvent(files: File[]) {
  const target = { files, value: 'C:\\fake\\x' };
  return { event: { target } as unknown as React.ChangeEvent<HTMLInputElement>, target };
}

beforeEach(() => {
  addToast = vi.fn<NonNullable<Window['__addToast']>>();
  window.__addToast = addToast;
  upload = vi.fn(async () => ({ succeeded: [], failed: [] }));
  useJourneyStore.setState({ uploadGalleryPhotos: upload } as never);
});

afterEach(() => {
  useJourneyStore.setState(initial, true);
  delete window.__addToast;
});

describe('useGalleryUpload', () => {
  it('FE-JRN-GALLERYUPLOAD-001: normalises images, sends videos as they are, toasts and reloads', async () => {
    const image = new File(['i'], 'a.heic', { type: 'image/heic' });
    const video = new File(['v'], 'b.mp4', { type: 'video/mp4' });
    const { result, props } = setup();
    const { event, target } = changeEvent([image, video]);
    await act(() => result.current.handleGalleryUpload(event));
    const sent = upload.mock.calls[0][1] as File[];
    expect(upload.mock.calls[0]).toHaveLength(2);
    expect(upload.mock.calls[0][0]).toBe(12);
    expect(sent.map((f) => f.name)).toEqual(['a.heic.jpg', 'b.mp4']);
    expect(addToast).toHaveBeenCalledWith('journey.photosUploaded:{"count":2}', 'success', undefined);
    expect(props.onUploaded).toHaveBeenCalledTimes(1);
    expect(result.current.uploading).toBe(false);
    expect(target.value).toBe('');
  });

  it('FE-JRN-GALLERYUPLOAD-002: the desktop gallery hands the upload a progress callback', async () => {
    upload.mockImplementationOnce(async (_id: number, files: File[], cbs?: { onProgress?: (p: unknown) => void }) => {
      cbs?.onProgress?.({ done: 1, total: files.length });
      return { succeeded: [], failed: [] };
    });
    const { result } = setup({ trackProgress: true });
    await act(() => result.current.handleGalleryUpload(changeEvent([new File(['i'], 'a.jpg')]).event));
    expect(upload.mock.calls[0]).toHaveLength(3);
    expect(result.current.uploading).toBe(false);
  });

  it('FE-JRN-GALLERYUPLOAD-003: a partial failure says how many did not make it, and still reloads', async () => {
    const a = new File(['a'], 'a.jpg');
    upload.mockResolvedValueOnce({ succeeded: [], failed: [a] });
    const { result, props } = setup();
    await act(() => result.current.handleGalleryUpload(changeEvent([a, new File(['b'], 'b.jpg')]).event));
    expect(addToast).toHaveBeenCalledWith(
      'journey.editor.uploadPartialFailed:{"failed":"1","total":"2"}',
      'error',
      undefined
    );
    expect(props.onUploaded).toHaveBeenCalledTimes(1);
  });

  it('FE-JRN-GALLERYUPLOAD-004: a failed upload toasts the server message and does not reload', async () => {
    upload.mockRejectedValueOnce({ response: { data: { error: 'Quota' } } });
    const { result, props } = setup();
    await act(() => result.current.handleGalleryUpload(changeEvent([new File(['a'], 'a.jpg')]).event));
    expect(addToast).toHaveBeenCalledWith('Quota', 'error', undefined);
    expect(props.onUploaded).not.toHaveBeenCalled();
    expect(result.current.uploading).toBe(false);
  });

  it('FE-JRN-GALLERYUPLOAD-005: nothing goes up without files or before the journey is known', async () => {
    const empty = setup();
    await act(() => empty.result.current.handleGalleryUpload(changeEvent([]).event));
    const unknown = setup({ journeyId: null });
    const { event, target } = changeEvent([new File(['a'], 'a.jpg')]);
    await act(() => unknown.result.current.handleGalleryUpload(event));
    expect(upload).not.toHaveBeenCalled();
    expect(target.value).toBe('C:\\fake\\x');
  });

  it('FE-JRN-GALLERYUPLOAD-006: the phone screen hands in the toast and translate its page hook holds', async () => {
    const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
    const t = vi.fn((k: string) => `view:${k}`);
    const { result } = setup({ toast, t } as Partial<GalleryUploadOptions>);
    await act(() => result.current.handleGalleryUpload(changeEvent([new File(['a'], 'a.jpg')]).event));
    expect(toast.success).toHaveBeenCalledWith('view:journey.photosUploaded');
    expect(addToast).not.toHaveBeenCalled();
  });

  it('FE-JRN-GALLERYUPLOAD-007: progress counts the files up while they go and is gone after', async () => {
    let finish: () => void = () => {};
    let report: (p: unknown) => void = () => {};
    upload.mockImplementationOnce(
      (_id: number, _files: File[], cbs?: { onProgress?: (p: unknown) => void }) =>
        new Promise((resolve) => {
          report = (p) => cbs?.onProgress?.(p);
          finish = () => resolve({ succeeded: [], failed: [] });
        })
    );
    const { result } = setup({ trackProgress: true });
    expect(result.current.progress).toBeNull();
    let running: Promise<void> = Promise.resolve();
    await act(async () => {
      running = result.current.handleGalleryUpload(
        changeEvent([new File(['a'], 'a.jpg'), new File(['b'], 'b.jpg')]).event
      );
    });
    expect(result.current.progress).toEqual({ done: 0, total: 2 });
    act(() => report({ done: 1, total: 2 }));
    expect(result.current.progress).toEqual({ done: 1, total: 2 });
    await act(async () => {
      finish();
      await running;
    });
    expect(result.current.progress).toBeNull();
  });
});
