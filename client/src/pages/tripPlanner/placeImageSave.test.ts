// FE-TP-PLIMGSAVE-001 to FE-TP-PLIMGSAVE-006: the waiting picture taken off what the place
// form saves, and put in place once the place has an id.
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setForcedOffline } from '../../sync/networkMode';
import type { Place } from '../../types';
import { savePendingImage, takePendingImage } from './placeImageSave';

const needsConnection = () => 'places.image.needsConnection';

function actions() {
  return {
    uploadPlaceImage: vi.fn(async () => ({ id: 1 }) as Place),
    setPlaceImageFromFile: vi.fn(async () => ({ id: 1 }) as Place),
  };
}

afterEach(() => {
  setForcedOffline(false);
});

describe('takePendingImage', () => {
  it('FE-TP-PLIMGSAVE-001: takes the picture off the data, online', () => {
    const file = new File(['x'], 'a.png');
    const data: { name: string; _pendingImage?: File | { fileId: number } } = { name: 'Lake', _pendingImage: file };
    expect(takePendingImage(data, needsConnection)).toBe(file);
    expect('_pendingImage' in data).toBe(false);
    expect(data).toEqual({ name: 'Lake' });
  });

  it('FE-TP-PLIMGSAVE-002: without a picture nothing is taken, offline included', () => {
    setForcedOffline(true);
    const data: { name: string; _pendingImage?: File } = { name: 'Lake' };
    expect(takePendingImage(data, needsConnection)).toBeUndefined();
    expect(data).toEqual({ name: 'Lake' });
  });

  it('FE-TP-PLIMGSAVE-003: offline, a waiting picture refuses the save with the reason', () => {
    setForcedOffline(true);
    const data = { _pendingImage: { fileId: 4 } };
    expect(() => takePendingImage(data, needsConnection)).toThrow('places.image.needsConnection');
  });
});

describe('savePendingImage', () => {
  it('FE-TP-PLIMGSAVE-004: a file from the device is uploaded, an attached file is taken by its id', async () => {
    const a = actions();
    const onError = vi.fn();
    const file = new File(['x'], 'a.png');
    await savePendingImage(a, 42, 7, file, onError);
    expect(a.uploadPlaceImage).toHaveBeenCalledWith(42, 7, file);
    expect(a.setPlaceImageFromFile).not.toHaveBeenCalled();

    await savePendingImage(a, 42, 7, { fileId: 13 }, onError);
    expect(a.setPlaceImageFromFile).toHaveBeenCalledWith(42, 7, 13);
    expect(onError).not.toHaveBeenCalled();
  });

  it('FE-TP-PLIMGSAVE-005: nothing waiting, or no place to put it on, sends nothing', async () => {
    const a = actions();
    await savePendingImage(a, 42, 7, undefined, vi.fn());
    await savePendingImage(a, 42, undefined, new File(['x'], 'a.png'), vi.fn());
    expect(a.uploadPlaceImage).not.toHaveBeenCalled();
    expect(a.setPlaceImageFromFile).not.toHaveBeenCalled();
  });

  it('FE-TP-PLIMGSAVE-006: a refused picture goes to onError instead of failing the save', async () => {
    const a = actions();
    const refused = new Error('too large');
    a.uploadPlaceImage.mockRejectedValueOnce(refused);
    a.setPlaceImageFromFile.mockRejectedValueOnce(refused);
    const onError = vi.fn();
    await expect(savePendingImage(a, 42, 7, new File(['x'], 'a.png'), onError)).resolves.toBeUndefined();
    await expect(savePendingImage(a, 42, 7, { fileId: 2 }, onError)).resolves.toBeUndefined();
    expect(onError).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledWith(refused);
  });
});
