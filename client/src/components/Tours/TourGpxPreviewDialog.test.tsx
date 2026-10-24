// FE-GPX-PREVIEW-001 to FE-GPX-PREVIEW-003
// The GPX preview as ACT-01 uses it: preset to the tour's type, a city walk
// imported as one, and when a track was recorded shown where it carried times.
import { fireEvent, render, screen } from '@testing-library/react';
import type { TourGpxPreviewTrack } from '@trek/shared';
import { describe, expect, it, vi } from 'vitest';
import TourGpxPreviewDialog from './TourGpxPreviewDialog';
import type { TourGpxImport } from './useTourGpxImport';

vi.mock('../Map/MapViewAuto', () => ({ MapViewAuto: () => <div data-testid="gpx-preview-map-stub" /> }));

function track(overrides: Partial<TourGpxPreviewTrack> = {}): TourGpxPreviewTrack {
  return {
    name: 'Morning',
    geometry: [
      [47, 11],
      [47.01, 11],
    ],
    point_count: 2,
    distance_km: 1.1,
    elevation_gain_m: null,
    elevation_loss_m: null,
    started_at: '2026-07-02T06:10:00.000Z',
    ended_at: '2026-07-02T07:00:00.000Z',
    duplicate: false,
    ...overrides,
  };
}

function gpxImport(tracks: TourGpxPreviewTrack[]): TourGpxImport {
  return {
    importing: false,
    preview: [{ file: new File(['<gpx/>'], 'morning.gpx'), tracks }],
    confirm: vi.fn(),
    cancel: vi.fn(),
    pick: vi.fn(),
    importFiles: vi.fn(),
  } as unknown as TourGpxImport;
}

describe('TourGpxPreviewDialog (ACT-01)', () => {
  it('FE-GPX-PREVIEW-001: shows when a track was recorded and how long it took, and nothing for one without times', () => {
    const tracks = [track(), track({ name: 'Drawn', started_at: null, ended_at: null })];
    render(<TourGpxPreviewDialog gpxImport={gpxImport(tracks)} />);
    const recorded = screen.getAllByTestId('gpx-preview-recorded');
    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toHaveTextContent('50 min');
  });

  it('FE-GPX-PREVIEW-002: imports as the preset type, a paddle tour with its boat and water', () => {
    const current = gpxImport([track()]);
    render(
      <TourGpxPreviewDialog
        gpxImport={current}
        initial={{ tour_type: 'kayak', boat_type: 'sup', water_context: 'lake' }}
      />
    );
    fireEvent.click(screen.getByTestId('gpx-preview-import'));
    expect(current.confirm).toHaveBeenCalledWith({ tour_type: 'kayak', boat_type: 'sup', water_context: 'lake' });
  });

  it('FE-GPX-PREVIEW-003: a city walk is imported as a city walk, and without a preset as a hike', () => {
    const walk = gpxImport([track()]);
    const { unmount } = render(<TourGpxPreviewDialog gpxImport={walk} initial={{ tour_type: 'walk' }} />);
    fireEvent.click(screen.getByTestId('gpx-preview-import'));
    expect(walk.confirm).toHaveBeenCalledWith({ tour_type: 'walk' });
    unmount();

    const hike = gpxImport([track()]);
    render(<TourGpxPreviewDialog gpxImport={hike} />);
    fireEvent.click(screen.getByTestId('gpx-preview-import'));
    expect(hike.confirm).toHaveBeenCalledWith({ tour_type: 'hike' });
  });
});
