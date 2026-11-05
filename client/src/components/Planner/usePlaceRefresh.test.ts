// FE-PLANNER-REFRESHHOOK-001 to FE-PLANNER-REFRESHHOOK-002
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { placeDetailsRepo } from '../../repo/placeDetailsRepo';
import type { Place } from '../../types';
import { DEFAULT_FORM, type PlaceFormData } from './PlaceFormModal.helpers';
import { usePlaceRefresh } from './usePlaceRefresh';

const SAVED = { id: 1, name: 'Café Luna', google_place_id: 'g-luna', osm_id: null } as unknown as Place;

const DETAILS: Record<string, Record<string, unknown>> = {
  'g-luna': { website: 'https://cafe-luna.de' },
  'g-sole': { website: 'https://sole.example', phone: '+39 06 1234' },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('usePlaceRefresh', () => {
  it('FE-PLANNER-REFRESHHOOK-001: a saved place is compared with its own fresh details', async () => {
    const details = vi.spyOn(placeDetailsRepo, 'details').mockImplementation(async (id) => DETAILS[id] ?? null);
    const form: PlaceFormData = { ...DEFAULT_FORM };
    const { result } = renderHook(() => usePlaceRefresh({ place: SAVED, form, language: 'de' }));
    await waitFor(() => expect(result.current.candidates).toHaveLength(1));
    expect(details).toHaveBeenCalledWith('g-luna', 'de');
    expect(result.current.candidates[0]).toMatchObject({ field: 'website', current: '' });
  });

  it('FE-PLANNER-REFRESHHOOK-002: after another place is picked in the search box, its details are the ones compared', async () => {
    const details = vi.spyOn(placeDetailsRepo, 'details').mockImplementation(async (id) => DETAILS[id] ?? null);
    const form: PlaceFormData = { ...DEFAULT_FORM, google_place_id: 'g-sole', website: 'https://sole.example' };
    const { result } = renderHook(() => usePlaceRefresh({ place: SAVED, form, language: 'de' }));
    await waitFor(() => expect(result.current.candidates).toHaveLength(1));
    expect(details).not.toHaveBeenCalledWith('g-luna', 'de');
    expect(result.current.candidates[0]).toMatchObject({ field: 'phone', next: '+39 06 1234' });
  });
});
