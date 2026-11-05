// FE-GPX-PREVIEW-001 to FE-GPX-PREVIEW-009
// The GPX preview as ACT-01 uses it: preset to the tour's type, a city walk
// imported as one, and when a track was recorded shown where it carried times.
import { fireEvent, render, screen } from '@testing-library/react';
import type { TourFileLeftOut, TourGpxPreviewTrack } from '@trek/shared';
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

function gpxImport(tracks: TourGpxPreviewTrack[], leftOut?: TourFileLeftOut): TourGpxImport {
  return {
    importing: false,
    preview: [{ file: new File(['<gpx/>'], 'morning.gpx'), tracks, leftOut }],
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

  it('FE-GPX-PREVIEW-004: a track taken over from before Tours reads as one, not as a duplicate (#2810)', () => {
    render(<TourGpxPreviewDialog gpxImport={gpxImport([track({ adopts_track: true })])} />);
    expect(screen.getByTestId('gpx-preview-track')).not.toHaveAttribute('data-duplicate');
    expect(screen.getByText(/tours\.import\.previewAdopts|becomes a tour/)).toBeInTheDocument();
    expect(screen.queryByText(/tours\.import\.previewDuplicate|Already in the trip/)).toBeNull();
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
    expect(current.confirm).toHaveBeenCalledWith(
      { tour_type: 'kayak', boat_type: 'sup', water_context: 'lake' },
      { points: false }
    );
  });

  it('FE-GPX-PREVIEW-003: a city walk is imported as a city walk, and without a preset as a hike', () => {
    const walk = gpxImport([track()]);
    const { unmount } = render(<TourGpxPreviewDialog gpxImport={walk} initial={{ tour_type: 'walk' }} />);
    fireEvent.click(screen.getByTestId('gpx-preview-import'));
    expect(walk.confirm).toHaveBeenCalledWith({ tour_type: 'walk' }, { points: false });
    unmount();

    const hike = gpxImport([track()]);
    render(<TourGpxPreviewDialog gpxImport={hike} />);
    fireEvent.click(screen.getByTestId('gpx-preview-import'));
    expect(hike.confirm).toHaveBeenCalledWith({ tour_type: 'hike' }, { points: false });
  });
});

describe('TourGpxPreviewDialog with points beside the lines (#2969)', () => {
  it('FE-GPX-PREVIEW-005: offers the points as places, on by default, and imports them with the tour', () => {
    const current = gpxImport([track()], { points: 4, areas: 0, other: 0 });
    render(<TourGpxPreviewDialog gpxImport={current} offerPoints />);
    expect(screen.getByTestId('gpx-preview-points')).toBeInTheDocument();
    // Added as places, they are not listed as left out.
    expect(screen.queryByTestId('gpx-preview-left-out')).toBeNull();
    fireEvent.click(screen.getByTestId('gpx-preview-import'));
    expect(current.confirm).toHaveBeenCalledWith({ tour_type: 'hike' }, { points: true });
  });

  it('FE-GPX-PREVIEW-006: switched off, the points are named as left out and not imported', () => {
    const current = gpxImport([track()], { points: 4, areas: 1, other: 0 });
    render(<TourGpxPreviewDialog gpxImport={current} offerPoints />);
    fireEvent.click(screen.getByRole('button', { name: /tours\.import\.pointsAsPlaces|Add the points as places/ }));
    expect(screen.getByTestId('gpx-preview-left-out')).toHaveTextContent(/tours\.import\.leftOutPoints|4 pins/);
    fireEvent.click(screen.getByTestId('gpx-preview-import'));
    expect(current.confirm).toHaveBeenCalledWith({ tour_type: 'hike' }, { points: false });
  });

  it('FE-GPX-PREVIEW-007: a file whose every track the trip holds can still bring its points', () => {
    const current = gpxImport([track({ duplicate: true })], { points: 2, areas: 0, other: 0 });
    render(<TourGpxPreviewDialog gpxImport={current} offerPoints />);
    const button = screen.getByTestId('gpx-preview-import');
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent(/tours\.import\.pointsConfirm|Add places/);
    expect(screen.queryByText(/tours\.import\.previewAllDuplicates|nothing to import/)).toBeNull();
    fireEvent.click(button);
    expect(current.confirm).toHaveBeenCalledWith({ tour_type: 'hike' }, { points: true });
  });

  it('FE-GPX-PREVIEW-008: not offered, as for a recording picked for a tour, the points stay out', () => {
    const current = gpxImport([track()], { points: 4, areas: 0, other: 0 });
    render(<TourGpxPreviewDialog gpxImport={current} initial={{ tour_type: 'hike' }} />);
    expect(screen.queryByTestId('gpx-preview-points')).toBeNull();
    expect(screen.getByTestId('gpx-preview-left-out')).toHaveTextContent(/tours\.import\.leftOutPoints|4 pins/);
    fireEvent.click(screen.getByTestId('gpx-preview-import'));
    expect(current.confirm).toHaveBeenCalledWith({ tour_type: 'hike' }, { points: false });
  });

  it('FE-GPX-PREVIEW-009: not offered, a file of known tracks has nothing to import, points or not', () => {
    const current = gpxImport([track({ duplicate: true })], { points: 2, areas: 0, other: 0 });
    render(<TourGpxPreviewDialog gpxImport={current} />);
    expect(screen.getByTestId('gpx-preview-import')).toBeDisabled();
    expect(screen.getByText(/tours\.import\.previewAllDuplicates|nothing to import/)).toBeInTheDocument();
  });
});
