// FE-PLANNER-PHOTOCREDIT-001 to FE-PLANNER-PHOTOCREDIT-003: who a source's photo is credited to,
// and the one-line caption the gallery shows under it.
import type { PlacePhotoCandidate } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { creditOf, photoCaption, sourceLabelFor } from './placePhotoCredit';

function photo(over: Partial<PlacePhotoCandidate> = {}): PlacePhotoCandidate {
  return {
    key: 'k',
    url: '/api/maps/place-photo/k/bytes',
    attribution: 'Alice',
    license: 'CC BY-SA 4.0',
    licenseUrl: null,
    sourceUrl: null,
    source: 'wikimedia',
    ...over,
  } as PlacePhotoCandidate;
}

describe('placePhotoCredit', () => {
  it('FE-PLANNER-PHOTOCREDIT-001: each provider is named by its proper name', () => {
    expect(sourceLabelFor('google')).toBe('Google');
    expect(sourceLabelFor('wikipedia')).toBe('Wikipedia');
    expect(sourceLabelFor('wikimedia')).toBe('Wikimedia Commons');
  });

  it('FE-PLANNER-PHOTOCREDIT-002: the author is credited, and the provider when there is none', () => {
    expect(creditOf(photo())).toBe('Alice');
    expect(creditOf(photo({ attribution: null, source: 'google' }))).toBe('Google');
    expect(creditOf(photo({ attribution: '', source: 'wikipedia' }))).toBe('Wikipedia');
  });

  it('FE-PLANNER-PHOTOCREDIT-003: the caption joins the credit and the licence with a comma, not a dot', () => {
    expect(photoCaption(photo())).toBe('Alice, CC BY-SA 4.0');
    expect(photoCaption(photo({ attribution: null, license: null, source: 'google' }))).toBe('Google');
    expect(photoCaption(photo()).includes('·')).toBe(false);
  });
});
