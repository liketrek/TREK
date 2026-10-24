// FE-PLANNER-PLIMGCHOICE-001 to FE-PLANNER-PLIMGCHOICE-006: the editor's picture choice
// as a pure model, read the same way by the desktop dialog and the phone sheet.
import { describe, expect, it } from 'vitest';

import { buildTripFile } from '../../../tests/helpers/factories';
import { chosenImage, pendingImagePayload, pickableImages, type PendingPlaceImage } from './placeImageChoice';

const CURRENT = '/uploads/places/current.jpg';

describe('pickableImages', () => {
  it('FE-PLANNER-PLIMGCHOICE-001: keeps the jpeg, png, gif and webp files and drops the rest', () => {
    const jpg = buildTripFile({ mime_type: 'image/jpeg' });
    const png = buildTripFile({ mime_type: 'image/png' });
    const gif = buildTripFile({ mime_type: 'image/gif' });
    const webp = buildTripFile({ mime_type: 'image/webp' });
    const heic = buildTripFile({ mime_type: 'image/heic' });
    const svg = buildTripFile({ mime_type: 'image/svg+xml' });
    const pdf = buildTripFile({ mime_type: 'application/pdf' });
    const unknown = buildTripFile({ mime_type: undefined as unknown as string });

    expect(pickableImages([jpg, pdf, png, heic, gif, svg, webp, unknown])).toEqual([jpg, png, gif, webp]);
    expect(pickableImages([])).toEqual([]);
  });
});

describe('chosenImage', () => {
  const upload: PendingPlaceImage = { kind: 'upload', file: new File(['x'], 'a.png'), preview: 'blob:a' };
  const attached: PendingPlaceImage = { kind: 'attached', file: buildTripFile({ id: 77, mime_type: 'image/png' }) };

  it('FE-PLANNER-PLIMGCHOICE-002: a waiting picture wins over whatever the field holds', () => {
    expect(chosenImage('https://img.example/1.jpg', upload, CURRENT)).toEqual({ kind: 'upload' });
    expect(chosenImage(null, attached, CURRENT)).toEqual({ kind: 'attached', fileId: 77 });
  });

  it('FE-PLANNER-PLIMGCHOICE-003: null drops the picture, whether the place had one or not', () => {
    expect(chosenImage(null, null, CURRENT)).toEqual({ kind: 'none' });
    expect(chosenImage(null, null, null)).toEqual({ kind: 'none' });
  });

  it("FE-PLANNER-PLIMGCHOICE-004: a URL is a source's photo, unless it is the picture the place already has", () => {
    expect(chosenImage('https://img.example/1.jpg', null, CURRENT)).toEqual({
      kind: 'url',
      url: 'https://img.example/1.jpg',
    });
    expect(chosenImage(CURRENT, null, CURRENT)).toEqual({ kind: 'current' });
  });

  it('FE-PLANNER-PLIMGCHOICE-005: an untouched field keeps the current picture, or none on a place without one', () => {
    expect(chosenImage(undefined, null, CURRENT)).toEqual({ kind: 'current' });
    expect(chosenImage(undefined, null, null)).toEqual({ kind: 'none' });
    expect(chosenImage(undefined, null, undefined)).toEqual({ kind: 'none' });
    expect(chosenImage('', null, CURRENT)).toEqual({ kind: 'current' });
  });
});

describe('pendingImagePayload', () => {
  it("FE-PLANNER-PLIMGCHOICE-006: the save carries the file itself, or the attached file's id, or nothing", () => {
    const file = new File(['x'], 'a.png');
    expect(pendingImagePayload({ kind: 'upload', file, preview: 'blob:a' })).toBe(file);
    expect(pendingImagePayload({ kind: 'attached', file: buildTripFile({ id: 9, mime_type: 'image/png' }) })).toEqual({
      fileId: 9,
    });
    expect(pendingImagePayload(null)).toBeUndefined();
  });
});
