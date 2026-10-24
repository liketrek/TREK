import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePhotoPixels } from './usePhotoPixels';

/**
 * The original's pixel size, read off the original itself for the photo the
 * inspector shows: nothing until it has loaded, nothing for another photo
 * than the one asked about, nothing for an empty frame.
 */

class FakeImage {
  static made: FakeImage[] = [];
  onload: (() => void) | null = null;
  naturalWidth = 0;
  naturalHeight = 0;
  src = '';
  constructor() {
    FakeImage.made.push(this);
  }
  load(width: number, height: number) {
    this.naturalWidth = width;
    this.naturalHeight = height;
    this.onload?.();
  }
}

beforeEach(() => {
  FakeImage.made = [];
  vi.stubGlobal('Image', FakeImage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('usePhotoPixels', () => {
  it('FE-STUDIO-PIXELS-001: loads the original and answers its size once it is in', () => {
    const { result } = renderHook(() => usePhotoPixels(7));
    expect(result.current).toBeNull();
    const img = FakeImage.made[0] as FakeImage;
    expect(img.src).toBe('/api/photos/7/original');
    act(() => img.load(4000, 3000));
    expect(result.current).toEqual({ width: 4000, height: 3000 });
  });

  it('FE-STUDIO-PIXELS-002: forgets the size when another photo is asked about, and ignores the old one landing late', () => {
    const { result, rerender } = renderHook(({ id }: { id: number | null }) => usePhotoPixels(id), {
      initialProps: { id: 7 as number | null },
    });
    const first = FakeImage.made[0] as FakeImage;
    rerender({ id: 8 });
    expect(first.onload).toBeNull();
    act(() => first.load(100, 100));
    expect(result.current).toBeNull();
    act(() => (FakeImage.made[1] as FakeImage).load(600, 400));
    expect(result.current).toEqual({ width: 600, height: 400 });
    rerender({ id: null });
    expect(result.current).toBeNull();
    expect(FakeImage.made).toHaveLength(2);
  });

  it('FE-STUDIO-PIXELS-003: says nothing for a picture that loads without a size', () => {
    const { result } = renderHook(() => usePhotoPixels(9));
    act(() => (FakeImage.made[0] as FakeImage).load(0, 0));
    expect(result.current).toBeNull();
  });
});
