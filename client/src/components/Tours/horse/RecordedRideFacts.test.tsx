import type { TourListItem } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { hikePlannerDefaults } from '../../../../tests/helpers/tourPlannerStub';
import { useSettingsStore } from '../../../store/settingsStore';
import { analyzeRouteGeometry } from '../../../utils/routeGeometry';
import { TourPlannerRail } from '../planner/TourPlannerPanels';
import type { TourPlannerController } from '../planner/useTourPlanner';
import TourGpxPreviewDialog from '../TourGpxPreviewDialog';
import type { TourGpxImport } from '../useTourGpxImport';
import { RecordedRideFacts } from './RecordedRideFacts';

// FE-HORSE-IMPORT-002 to FE-HORSE-IMPORT-006 (HOR-02: a ride taken from a GPX file)

vi.mock('../../Map/MapViewAuto', () => ({ MapViewAuto: () => <div data-testid="gpx-preview-map-stub" /> }));

beforeEach(() => {
  resetAllStores();
  seedStore(useSettingsStore, { settings: { distance_unit: 'metric' } });
});

const ride: TourListItem = {
  place_id: 42,
  name: 'Ausritt an der Isar',
  tour_type: 'horse',
  distance: 1.1,
  elevation_gain: null,
  elevation_loss: null,
  duration: null,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: 0.3,
  max_hiking_difficulty: null,
  planned: false,
  caution: true,
  origin: 'gpx',
  has_waypoints: false,
};

function viewing(tour: TourListItem, line: number[][]): TourPlannerController {
  return {
    ...hikePlannerDefaults(),
    mode: { type: 'view-gpx', placeId: tour.place_id, tour },
    tripId: 1,
    canEdit: true,
    canAssign: true,
    isSaving: false,
    hasUnsavedChanges: false,
    readOnlyGpxTour: { tour },
    readOnlyGpxAnalysis: analyzeRouteGeometry(JSON.stringify(line)),
    returnToNeutral: vi.fn(),
    startNewTour: vi.fn(),
    newTourConfirmationOpen: false,
    cancelNewTour: vi.fn(),
    elevationProfileExpanded: true,
    toggleElevationProfile: vi.fn(),
    routeProfileFocus: null,
    setRouteProfileFocus: vi.fn(),
  } as unknown as TourPlannerController;
}

function previewing(): TourGpxImport {
  const file = new File(['<gpx/>'], 'ride.gpx', { type: 'application/gpx+xml' });
  return {
    importing: false,
    importFiles: vi.fn(),
    pick: vi.fn(),
    preview: [
      {
        file,
        tracks: [
          {
            name: 'Ride',
            geometry: [
              [48, 11],
              [48.01, 11],
            ],
            point_count: 2,
            distance_km: 1.1,
            elevation_gain_m: null,
            elevation_loss_m: null,
            duplicate: false,
          },
        ],
      },
    ],
    confirm: vi.fn().mockResolvedValue(undefined),
    cancel: vi.fn(),
  };
}

describe('a ride taken from a GPX file (HOR-02)', () => {
  it('FE-HORSE-IMPORT-002: says the line stays as recorded, gets no riding time and is not checked for access', () => {
    render(<RecordedRideFacts />);
    const facts = screen.getByTestId('recorded-ride-facts');
    expect(facts).toHaveTextContent('As recorded');
    expect(facts).toHaveTextContent('No riding time');
    expect(facts).toHaveTextContent('Access not checked');
    // Each reason is the badge's description, reachable without a pointer.
    const access = screen.getByText('Access not checked').closest('[tabindex="0"]') as HTMLElement;
    expect(access).toHaveAccessibleDescription(
      'The import does not check whether the ways may be ridden. The signs on site count.'
    );
    expect(facts).not.toHaveTextContent('No heights in the file');
  });

  it('FE-HORSE-IMPORT-003: names heights the file did not carry instead of showing zero', () => {
    render(<RecordedRideFacts heightsMissing />);
    expect(screen.getByTestId('recorded-ride-facts')).toHaveTextContent('No heights in the file');
  });

  it('FE-HORSE-IMPORT-004: the preview says so once a ride is chosen, and imports nothing until confirmed', () => {
    const gpxImport = previewing();
    render(<TourGpxPreviewDialog gpxImport={gpxImport} />);
    expect(screen.queryByTestId('gpx-preview-horse')).toBeNull();

    fireEvent.click(screen.getByTestId('tour-type-select'));
    fireEvent.click(screen.getByTestId('tour-type-option-horse'));
    expect(within(screen.getByTestId('gpx-preview-horse')).getByText('Access not checked')).toBeInTheDocument();
    expect(gpxImport.confirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('gpx-preview-import'));
    expect(gpxImport.confirm).toHaveBeenCalledWith({ tour_type: 'horse' });
  });

  it('FE-HORSE-IMPORT-005: a recorded ride in view carries the card, with the heights its file lacks named', () => {
    render(
      <TourPlannerRail
        planner={viewing(ride, [
          [48, 11],
          [48.01, 11],
        ])}
      />
    );
    const card = screen.getByRole('region', { name: 'Recorded ride' });
    expect(card).toHaveTextContent('No riding time');
    expect(card).toHaveTextContent('No heights in the file');
    // Nothing of a time is shown: an import of a ride gets none worked out.
    expect(screen.queryByText('Riding time')).toBeNull();
  });

  it('FE-HORSE-IMPORT-006: heights the file has need no word, and a recorded hike gets no ride card', () => {
    const line = [
      [48, 11, 500],
      [48.01, 11, 540],
    ];
    const { unmount } = render(<TourPlannerRail planner={viewing(ride, line)} />);
    expect(screen.getByRole('region', { name: 'Recorded ride' })).not.toHaveTextContent('No heights in the file');
    unmount();

    render(<TourPlannerRail planner={viewing({ ...ride, tour_type: 'hike' }, line)} />);
    expect(screen.queryByRole('region', { name: 'Recorded ride' })).toBeNull();
  });
});
