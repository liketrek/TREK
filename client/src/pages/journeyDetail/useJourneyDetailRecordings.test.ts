// FE-JRN-DETAIL-RECORDINGS-001 to FE-JRN-DETAIL-RECORDINGS-003
//
// JRN-01: the journey page's map lines, with the days the journey keeps beside
// the trips' GPX tracks and the live Dawarich trail.
import type { JourneyTrack } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRecordedDay } from '../../../tests/helpers/journeyRecording';
import { renderHook, waitFor } from '../../../tests/helpers/render';
import { useJourneyDetailRecordings } from './useJourneyDetailRecordings';

const repo = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('../../repo/journeyRecordingsRepo', () => ({ journeyRecordingsRepo: repo }));

const line = (over: Partial<JourneyTrack>): JourneyTrack => ({
  place_id: 1,
  trip_id: 1,
  name: 'Ridge',
  color: '#aa0000',
  points: [
    [47, 11],
    [47.1, 11.1],
  ],
  ...over,
});

const GPX = [line({})];
const LIVE = [
  line({ place_id: -1, trip_id: 0, name: '2026-05-14', kind: 'dawarich_live' }),
  line({ place_id: -2, trip_id: 0, name: '2026-05-15', kind: 'dawarich_live' }),
];
const ITEMS = [{ entry_date: '2026-05-14', dayColor: '#ff0055' }];

function setup(over: Partial<Parameters<typeof useJourneyDetailRecordings>[0]> = {}) {
  return renderHook(() =>
    useJourneyDetailRecordings({
      loaded: true,
      journey: { id: 7, title: 'Venice' },
      canEdit: true,
      dawarichStatus: 'ready',
      sidebarMapItems: ITEMS,
      tripTracks: GPX,
      liveTracks: LIVE,
      ...over,
    })
  );
}

beforeEach(() => {
  repo.list.mockReset();
});

describe('useJourneyDetailRecordings', () => {
  it('FE-JRN-DETAIL-RECORDINGS-001: a kept day replaces the live trail of its date and takes the colour of its pins', async () => {
    repo.list.mockResolvedValue([buildRecordedDay()]);
    const { result } = setup();

    await waitFor(() => expect(result.current.recordings.days).toHaveLength(1));
    const kinds = result.current.mapTracks.map((track) => track.kind ?? 'trip_gpx');
    expect(kinds).toEqual(['trip_gpx', 'day_recording', 'dawarich_live']);
    expect(result.current.mapTracks[1]?.color).toBe('#ff0055');
    expect(result.current.mapTracks[2]?.name).toBe('2026-05-15');
  });

  it('FE-JRN-DETAIL-RECORDINGS-002: with nothing kept and no live trail the GPX tracks pass through as they are', async () => {
    repo.list.mockResolvedValue([]);
    const { result } = setup({ liveTracks: [] });
    await waitFor(() => expect(repo.list).toHaveBeenCalledWith(7));
    expect(result.current.mapTracks).toBe(GPX);
  });

  it('FE-JRN-DETAIL-RECORDINGS-003: only an editor whose Dawarich answers may take a day over; offline says so', () => {
    repo.list.mockResolvedValue([]);
    expect(setup().result.current).toMatchObject({ canTakeOverRecording: true, recordingNeedsConnection: false });
    expect(setup({ dawarichStatus: 'offline' }).result.current).toMatchObject({
      canTakeOverRecording: false,
      recordingNeedsConnection: true,
    });
    expect(setup({ canEdit: false }).result.current).toMatchObject({
      canTakeOverRecording: false,
      recordingNeedsConnection: false,
    });
    expect(setup({ dawarichStatus: 'disconnected' }).result.current.canTakeOverRecording).toBe(false);
  });
});
