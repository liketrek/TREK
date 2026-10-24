// FE-PLANNER-PLIMGFIELD-001 to FE-PLANNER-PLIMGFIELD-004: the editor's picture field the
// desktop dialog and the phone sheet share: the place's attached images, the waiting
// picture's preview, and which tile stands for the choice.
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildReservation, buildTripFile } from '../../../tests/helpers/factories';
import { resetAllStores } from '../../../tests/helpers/store';
import { useTripStore } from '../../store/tripStore';
import type { TripFile } from '../../types';
import type { PendingPlaceImage } from './placeImageChoice';
import { usePlaceImageField } from './usePlaceImageField';

const PHOTO = buildTripFile({ id: 1, place_id: 5, mime_type: 'image/jpeg', original_name: 'front.jpg' });
const PDF = buildTripFile({ id: 2, place_id: 5, mime_type: 'application/pdf' });
const ELSEWHERE = buildTripFile({ id: 3, place_id: 6, mime_type: 'image/png' });
const ON_BOOKING = buildTripFile({
  id: 4,
  place_id: null,
  reservation_id: 90,
  mime_type: 'image/webp',
} as Partial<TripFile>);

const handlers = () => ({ stageUpload: vi.fn(), stageAttached: vi.fn(), removeImage: vi.fn() });

beforeEach(() => {
  resetAllStores();
  useTripStore.setState({
    files: [PHOTO, PDF, ELSEWHERE, ON_BOOKING],
    reservations: [buildReservation({ id: 90, place_id: 5 })],
  } as never);
});

describe('usePlaceImageField', () => {
  it("FE-PLANNER-PLIMGFIELD-001: offers the place's attached images, its booking's included, and its current picture", () => {
    const h = handlers();
    const { result } = renderHook(() =>
      usePlaceImageField({
        place: { id: 5, image_url: '/uploads/places/5.jpg' },
        imageUrl: undefined,
        pendingImage: null,
        canUploadFiles: true,
        ...h,
      })
    );
    expect(result.current.own.attached).toEqual([PHOTO, ON_BOOKING]);
    expect(result.current.own.currentUrl).toBe('/uploads/places/5.jpg');
    expect(result.current.own.pendingPreview).toBeNull();
    expect(result.current.own.canUpload).toBe(true);
    expect(result.current.own.onUpload).toBe(h.stageUpload);
    expect(result.current.own.onPickAttached).toBe(h.stageAttached);
    expect(result.current.own.onRemove).toBe(h.removeImage);
    expect(result.current.chosen).toEqual({ kind: 'current' });
  });

  it('FE-PLANNER-PLIMGFIELD-002: a new place has nothing attached and no picture, but can still be given one', () => {
    const { result } = renderHook(() =>
      usePlaceImageField({ place: null, imageUrl: undefined, pendingImage: null, canUploadFiles: true, ...handlers() })
    );
    expect(result.current.own.attached).toEqual([]);
    expect(result.current.own.currentUrl).toBeNull();
    expect(result.current.own.canUpload).toBe(true);
    expect(result.current.chosen).toEqual({ kind: 'none' });
  });

  it('FE-PLANNER-PLIMGFIELD-003: a waiting upload shows as its preview and is the choice', () => {
    const pending: PendingPlaceImage = { kind: 'upload', file: new File(['x'], 'a.png'), preview: 'blob:a' };
    const { result } = renderHook(() =>
      usePlaceImageField({
        place: { id: 5, image_url: null },
        imageUrl: undefined,
        pendingImage: pending,
        canUploadFiles: false,
        ...handlers(),
      })
    );
    expect(result.current.own.pendingPreview).toBe('blob:a');
    expect(result.current.own.canUpload).toBe(false);
    expect(result.current.chosen).toEqual({ kind: 'upload' });
  });

  it('FE-PLANNER-PLIMGFIELD-004: a waiting attached image has no preview, and a dropped picture reads as none', () => {
    const attached = renderHook(() =>
      usePlaceImageField({
        place: { id: 5, image_url: '/uploads/places/5.jpg' },
        imageUrl: undefined,
        pendingImage: { kind: 'attached', file: PHOTO },
        canUploadFiles: true,
        ...handlers(),
      })
    );
    expect(attached.result.current.own.pendingPreview).toBeNull();
    expect(attached.result.current.chosen).toEqual({ kind: 'attached', fileId: 1 });

    const dropped = renderHook(() =>
      usePlaceImageField({
        place: { id: 5, image_url: '/uploads/places/5.jpg' },
        imageUrl: null,
        pendingImage: null,
        canUploadFiles: true,
        ...handlers(),
      })
    );
    expect(dropped.result.current.chosen).toEqual({ kind: 'none' });
  });
});
