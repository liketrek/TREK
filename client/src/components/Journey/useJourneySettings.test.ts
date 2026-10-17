// FE-JRN-SETTINGSHOOK-001 to FE-JRN-SETTINGSHOOK-014: the journey settings logic behind
// both the desktop dialog and the phone sheet, and the trip linking behind the desktop
// add trip dialog and the phone sheet.
import { act, renderHook, waitFor } from '@testing-library/react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { journeyApi } from '../../api/client';
import { useJourneyStore, type JourneyContributor, type JourneyDetail } from '../../store/journeyStore';
import { useJourneySettings, useJourneyTripLinking, type JourneySettingsOptions } from './useJourneySettings';

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (k: string, p?: Record<string, unknown>) => (p ? `${k}:${JSON.stringify(p)}` : k),
  }),
}));
vi.mock('../../utils/convertHeic', () => ({ normalizeImageFile: (f: File) => Promise.resolve(f) }));

const updateJourney = vi.fn(async (_id: number, _data: Record<string, unknown>) => {});
const deleteJourney = vi.fn(async (_id: number) => {});
let addToast: Mock<NonNullable<Window['__addToast']>>;

function buildJourney(overrides: Partial<JourneyDetail> = {}): JourneyDetail {
  return {
    id: 3,
    user_id: 1,
    title: 'Italy 2026',
    subtitle: 'Rome',
    status: 'active',
    cover_image: null,
    cover_gradient: null,
    created_at: 0,
    updated_at: 0,
    entries: [],
    gallery: [],
    trips: [],
    contributors: [],
    stats: { entries: 0, photos: 0, places: 0 },
    ...overrides,
  };
}

function setup(over: Partial<JourneySettingsOptions> = {}) {
  const props: JourneySettingsOptions = {
    journey: buildJourney(),
    onSaved: vi.fn(),
    onRefresh: vi.fn(),
    onContentChanged: vi.fn(),
    ...over,
  };
  const hook = renderHook((p: JourneySettingsOptions) => useJourneySettings(p), { initialProps: props });
  return { ...hook, props };
}

function fileEvent(file: File | undefined) {
  return { target: { files: file ? [file] : [] } } as unknown as React.ChangeEvent<HTMLInputElement>;
}

beforeEach(() => {
  updateJourney.mockReset().mockResolvedValue(undefined);
  deleteJourney.mockReset().mockResolvedValue(undefined);
  mockNavigate.mockClear();
  useJourneyStore.setState({ updateJourney, deleteJourney });
  addToast = vi.fn<NonNullable<Window['__addToast']>>();
  window.__addToast = addToast;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete window.__addToast;
});

describe('useJourneySettings', () => {
  it('FE-JRN-SETTINGSHOOK-001: seeds the name, tracks dirtiness and saves it', async () => {
    const { result, props } = setup();
    expect(result.current.isDirty).toBe(false);
    act(() => {
      result.current.setTitle('Italy 2027');
      result.current.setSubtitle('');
    });
    expect(result.current.isDirty).toBe(true);
    await act(() => result.current.handleSave());
    expect(updateJourney).toHaveBeenCalledWith(3, { title: 'Italy 2027', subtitle: null });
    expect(props.onSaved).toHaveBeenCalledTimes(1);
    expect(result.current.saving).toBe(false);
  });

  it('FE-JRN-SETTINGSHOOK-002: a failed save toasts and keeps the shell open', async () => {
    updateJourney.mockRejectedValueOnce(new Error('x'));
    const { result, props } = setup();
    await act(() => result.current.handleSave());
    expect(addToast).toHaveBeenCalledWith('journey.settings.saveFailed', 'error', undefined);
    expect(props.onSaved).not.toHaveBeenCalled();
  });

  it('FE-JRN-SETTINGSHOOK-003: a new cover goes up and hands over to onContentChanged', async () => {
    const upload = vi.spyOn(journeyApi, 'uploadCover').mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('x'));
    const { result, props } = setup();
    await act(() => result.current.handleCoverUpload(fileEvent(undefined)));
    expect(upload).not.toHaveBeenCalled();

    const file = new File(['x'], 'c.png');
    await act(() => result.current.handleCoverUpload(fileEvent(file)));
    expect((upload.mock.calls[0][1] as FormData).get('cover')).toBe(file);
    expect(addToast).toHaveBeenCalledWith('journey.settings.coverUpdated', 'success', undefined);
    expect(props.onContentChanged).toHaveBeenCalledTimes(1);

    await act(() => result.current.handleCoverUpload(fileEvent(file)));
    expect(addToast).toHaveBeenLastCalledWith('journey.settings.coverFailed', 'error', undefined);
    expect(props.onContentChanged).toHaveBeenCalledTimes(1);
  });

  it('FE-JRN-SETTINGSHOOK-004: archiving flips the status both ways', async () => {
    const active = setup();
    await act(() => active.result.current.handleArchiveToggle());
    expect(updateJourney).toHaveBeenLastCalledWith(3, { status: 'archived' });
    expect(addToast).toHaveBeenLastCalledWith('journey.settings.archived', 'success', undefined);
    expect(active.props.onSaved).toHaveBeenCalledTimes(1);

    const archived = setup({ journey: buildJourney({ status: 'archived' }) });
    await act(() => archived.result.current.handleArchiveToggle());
    expect(updateJourney).toHaveBeenLastCalledWith(3, { status: 'active' });
    expect(addToast).toHaveBeenLastCalledWith('journey.settings.reopened', 'success', undefined);
  });

  it('FE-JRN-SETTINGSHOOK-005: the tracks switch takes the new value or flips the current one, and only refreshes', async () => {
    const { result, props } = setup({ journey: buildJourney({ show_trip_tracks: 1 }) });
    await act(() => result.current.handleTracksToggle());
    expect(updateJourney).toHaveBeenLastCalledWith(3, { show_trip_tracks: false });
    await act(() => result.current.handleTracksToggle(true));
    expect(updateJourney).toHaveBeenLastCalledWith(3, { show_trip_tracks: true });
    expect(props.onRefresh).toHaveBeenCalledTimes(2);
    expect(props.onSaved).not.toHaveBeenCalled();
    expect(result.current.savingTracks).toBe(false);
  });

  it('FE-JRN-SETTINGSHOOK-006: an entry field switch takes the new value or flips the stored one', async () => {
    const { result } = setup({ journey: buildJourney({ show_mood: 0 } as Partial<JourneyDetail>) });
    await act(() => result.current.handleFieldToggle('show_mood'));
    expect(updateJourney).toHaveBeenLastCalledWith(3, { show_mood: true });
    await act(() => result.current.handleFieldToggle('show_weather', false));
    expect(updateJourney).toHaveBeenLastCalledWith(3, { show_weather: false });

    updateJourney.mockRejectedValueOnce(new Error('x'));
    await act(() => result.current.handleFieldToggle('show_verdict'));
    expect(addToast).toHaveBeenLastCalledWith('journey.settings.saveFailed', 'error', undefined);
    expect(result.current.savingField).toBeNull();
  });

  it('FE-JRN-SETTINGSHOOK-007: photo locations flip on the spot', async () => {
    const { result, props } = setup();
    await act(() => result.current.handlePhotoLocationToggle());
    expect(updateJourney).toHaveBeenCalledWith(3, { photo_location: true });
    expect(props.onRefresh).toHaveBeenCalledTimes(1);
  });

  it('FE-JRN-SETTINGSHOOK-008: the shown status is auto by default, stored as null, and the same choice is a no op', async () => {
    const { result } = setup();
    expect(result.current.statusChoice).toBe('auto');
    await act(() => result.current.handleStatusChange('auto'));
    expect(updateJourney).not.toHaveBeenCalled();
    await act(() => result.current.handleStatusChange('live'));
    expect(updateJourney).toHaveBeenCalledWith(3, { status_override: 'live' });

    const live = setup({ journey: buildJourney({ status_override: 'live' } as Partial<JourneyDetail>) });
    await act(() => live.result.current.handleStatusChange('auto'));
    expect(updateJourney).toHaveBeenLastCalledWith(3, { status_override: null });
  });

  it('FE-JRN-SETTINGSHOOK-009: deleting leaves for the journey list, a failure toasts', async () => {
    const { result } = setup();
    await act(() => result.current.handleDelete());
    expect(deleteJourney).toHaveBeenCalledWith(3);
    expect(mockNavigate).toHaveBeenCalledWith('/journey');

    deleteJourney.mockRejectedValueOnce(new Error('x'));
    await act(() => result.current.handleDelete());
    expect(addToast).toHaveBeenCalledWith('journey.settings.failedToDelete', 'error', undefined);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('FE-JRN-SETTINGSHOOK-010: removing a contributor asks first', async () => {
    const remove = vi.spyOn(journeyApi, 'removeContributor').mockResolvedValue({});
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    const { result, props } = setup();
    const c = { journey_id: 3, user_id: 2, role: 'editor', added_at: 0, username: 'julien' } as JourneyContributor;
    await act(() => result.current.handleRemoveContributor(c));
    expect(remove).not.toHaveBeenCalled();
    await act(() => result.current.handleRemoveContributor(c));
    expect(confirm).toHaveBeenLastCalledWith('journey.contributors.removeConfirm:{"username":"julien"}');
    expect(remove).toHaveBeenCalledWith(3, 2);
    expect(addToast).toHaveBeenCalledWith('journey.contributors.removed', 'success', undefined);
    expect(props.onRefresh).toHaveBeenCalledTimes(1);
  });

  it('FE-JRN-SETTINGSHOOK-011: unlinking the picked trip clears the pick and hands over, a failure keeps it', async () => {
    const remove = vi.spyOn(journeyApi, 'removeTrip').mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce({});
    const { result, props } = setup();
    await act(() => result.current.confirmUnlink());
    expect(remove).not.toHaveBeenCalled();

    act(() => result.current.setUnlinkTarget({ trip_id: 5, title: 'Italy Trip' }));
    await act(() => result.current.confirmUnlink());
    expect(addToast).toHaveBeenCalledWith('journey.trips.unlinkFailed', 'error', undefined);
    expect(result.current.unlinkTarget).not.toBeNull();

    await act(() => result.current.confirmUnlink());
    expect(remove).toHaveBeenLastCalledWith(3, 5);
    expect(result.current.unlinkTarget).toBeNull();
    expect(props.onContentChanged).toHaveBeenCalledTimes(1);
  });
});

describe('useJourneyTripLinking', () => {
  it('FE-JRN-SETTINGSHOOK-012: the desktop picker loads the trips on mount, the phone sheet when asked', async () => {
    const available = vi.spyOn(journeyApi, 'availableTrips').mockResolvedValue({ trips: [{ id: 9, title: 'Oslo' }] });
    const eager = renderHook(() => useJourneyTripLinking({ journeyId: 3, onLinked: vi.fn(), loadOnMount: true }));
    await waitFor(() => expect(eager.result.current.availableTrips).toEqual([{ id: 9, title: 'Oslo' }]));

    const lazy = renderHook(() => useJourneyTripLinking({ journeyId: 3, onLinked: vi.fn() }));
    expect(available).toHaveBeenCalledTimes(1);
    await act(() => lazy.result.current.loadAvailableTrips());
    expect(lazy.result.current.availableTrips).toEqual([{ id: 9, title: 'Oslo' }]);
  });

  it('FE-JRN-SETTINGSHOOK-013: a failed lookup leaves the list empty', async () => {
    vi.spyOn(journeyApi, 'availableTrips').mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useJourneyTripLinking({ journeyId: 3, onLinked: vi.fn() }));
    await act(() => result.current.loadAvailableTrips());
    expect(result.current.availableTrips).toEqual([]);
  });

  it('FE-JRN-SETTINGSHOOK-014: linking toasts and hands over, a failure only toasts', async () => {
    const add = vi.spyOn(journeyApi, 'addTrip').mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('x'));
    const onLinked = vi.fn();
    const { result } = renderHook(() => useJourneyTripLinking({ journeyId: 3, onLinked }));
    await act(() => result.current.linkTrip(9));
    expect(add).toHaveBeenCalledWith(3, 9);
    expect(addToast).toHaveBeenCalledWith('journey.trips.tripLinked', 'success', undefined);
    expect(onLinked).toHaveBeenCalledTimes(1);

    await act(() => result.current.linkTrip(9));
    expect(addToast).toHaveBeenLastCalledWith('journey.trips.linkFailed', 'error', undefined);
    expect(onLinked).toHaveBeenCalledTimes(1);
    expect(result.current.linkingTripId).toBeNull();
  });
});
