// FE-FILES-LIGHTBOX-001 to FE-FILES-LIGHTBOX-008: the media viewer logic behind the
// desktop file manager's lightbox and the phone's files tab lightbox.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { TouchEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTripFile } from '../../../tests/helpers/factories';
import { useMediaLightbox, type MediaLightboxOptions } from './useMediaLightbox';

const getAuthUrl = vi.fn(async (url: string, _purpose: string) => `${url}?token=t`);
vi.mock('../../api/authUrl', () => ({
  getAuthUrl: (url: string, purpose: string) => getAuthUrl(url, purpose),
}));

const IMG = buildTripFile({ id: 1, mime_type: 'image/png', url: '/files/1' });
const VID = buildTripFile({ id: 2, mime_type: 'video/mp4', url: '/files/2' });
const IMG2 = buildTripFile({ id: 3, mime_type: 'image/jpeg', url: '/files/3' });
const FILES = [IMG, VID, IMG2];

function setup(index: number, files = FILES) {
  const onIndexChange = vi.fn();
  const onClose = vi.fn();
  const hook = renderHook(
    (props: Partial<MediaLightboxOptions>) => useMediaLightbox({ files, index, onIndexChange, onClose, ...props }),
    { initialProps: {} }
  );
  return { ...hook, onIndexChange, onClose };
}

function touch(x: number) {
  return { touches: [{ clientX: x }], changedTouches: [{ clientX: x }] } as unknown as TouchEvent;
}

beforeEach(() => {
  getAuthUrl.mockReset();
  getAuthUrl.mockImplementation(async (url: string) => `${url}?token=t`);
});

describe('useMediaLightbox', () => {
  it('FE-FILES-LIGHTBOX-001: an image gets its signed address', async () => {
    const { result } = setup(0);
    expect(result.current.file).toBe(IMG);
    expect(result.current.fileIsVideo).toBe(false);
    await waitFor(() => expect(result.current.imgSrc).toBe('/files/1?token=t'));
    expect(getAuthUrl).toHaveBeenCalledWith('/files/1', 'download');
  });

  it('FE-FILES-LIGHTBOX-002: a video mints no token and keeps an empty image address', () => {
    const { result } = setup(1);
    expect(result.current.fileIsVideo).toBe(true);
    expect(result.current.imgSrc).toBe('');
    expect(getAuthUrl).not.toHaveBeenCalled();
  });

  it('FE-FILES-LIGHTBOX-003: a token minted for a file paged away from never paints', async () => {
    let resolveFirst: (v: string) => void = () => {};
    getAuthUrl.mockReturnValueOnce(new Promise((r) => (resolveFirst = r))).mockResolvedValueOnce('/files/3?token=b');
    const { result, rerender } = setup(0);
    rerender({ index: 2 });
    await waitFor(() => expect(result.current.imgSrc).toBe('/files/3?token=b'));
    await act(async () => {
      resolveFirst('/files/1?token=a');
    });
    expect(result.current.imgSrc).toBe('/files/3?token=b');
  });

  it('FE-FILES-LIGHTBOX-004: paging stops at both ends', () => {
    const first = setup(0);
    expect(first.result.current.hasPrev).toBe(false);
    expect(first.result.current.hasNext).toBe(true);
    first.result.current.goPrev();
    expect(first.onIndexChange).not.toHaveBeenCalled();
    first.result.current.goNext();
    expect(first.onIndexChange).toHaveBeenCalledWith(1);

    const last = setup(2);
    expect(last.result.current.hasNext).toBe(false);
    last.result.current.goNext();
    expect(last.onIndexChange).not.toHaveBeenCalled();
    last.result.current.goPrev();
    expect(last.onIndexChange).toHaveBeenCalledWith(1);
  });

  it('FE-FILES-LIGHTBOX-005: arrow keys page and Escape closes', () => {
    const { onIndexChange, onClose } = setup(1);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-FILES-LIGHTBOX-006: arrow keys do nothing past either end, and stop after unmount', () => {
    const { onIndexChange, unmount } = setup(0, [IMG]);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(onIndexChange).not.toHaveBeenCalled();
    unmount();
    const { onClose } = setup(0);
    // Only the mounted instance's Escape closes.
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-FILES-LIGHTBOX-007: a long swipe pages, a short one does not', () => {
    const { result, onIndexChange } = setup(1);
    result.current.onTouchStart(touch(200));
    result.current.onTouchEnd(touch(150));
    expect(onIndexChange).not.toHaveBeenCalled();

    result.current.onTouchStart(touch(200));
    result.current.onTouchEnd(touch(100));
    expect(onIndexChange).toHaveBeenLastCalledWith(2);

    result.current.onTouchStart(touch(100));
    result.current.onTouchEnd(touch(200));
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
  });

  it('FE-FILES-LIGHTBOX-008: a touch end without a start does nothing', () => {
    const { result, onIndexChange } = setup(1);
    result.current.onTouchEnd(touch(0));
    expect(onIndexChange).not.toHaveBeenCalled();
    result.current.onTouchStart(touch(300));
    result.current.onTouchEnd(touch(100));
    // The start is used up by the first end.
    result.current.onTouchEnd(touch(0));
    expect(onIndexChange).toHaveBeenCalledTimes(1);
  });
});
