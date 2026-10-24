import { HORSE_ROUTES_ATTRIBUTION, type HorseRoute } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '../../../../tests/helpers/render';
import { hikePlannerDefaults } from '../../../../tests/helpers/tourPlannerStub';
import { OnlineOnlyError } from '../../../repo/onlineOnly';
import { publishTourMapViewport } from '../../../store/tourMapViewportStore';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { HorseRoutesCard } from './HorseRoutesCard';

const repo = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('../../../repo/horseRouteRepo', () => ({ horseRouteRepo: repo }));
vi.mock('../../Map/MapViewAuto', () => ({
  MapViewAuto: ({ route, plannerWaypoints }: { route?: unknown[]; plannerWaypoints?: Array<{ label?: string }> }) => (
    <div data-testid="horse-map-stub" data-lines={route?.length ?? 0}>
      {plannerWaypoints?.map((pin) => pin.label).join('')}
    </div>
  ),
}));

// FE-HORSE-CARD-001 to FE-HORSE-CARD-008

const VIEW = { south: 47.1, west: 11.2, north: 47.3, east: 11.5 };
const ROUTE: HorseRoute = {
  id: 'relation/42',
  name: 'Reitweg Isartal',
  ref: 'R1',
  osmUrl: 'https://www.openstreetmap.org/relation/42',
  continues: true,
  sections: [
    {
      number: 1,
      geometry: [
        [47.15, 11.25],
        [47.16, 11.25],
      ],
      length_m: 1112,
      access: [
        { value: 'designated', length_m: 800 },
        { value: 'private', length_m: 312 },
      ],
      signposted: 'with',
    },
    {
      number: 2,
      geometry: [
        [47.17, 11.25],
        [47.18, 11.25],
      ],
      length_m: 1112,
      access: [],
      signposted: null,
    },
  ],
};
const reply = (routes: HorseRoute[]) => ({
  routes,
  truncated: false,
  source: 'openstreetmap' as const,
  attribution: HORSE_ROUTES_ATTRIBUTION,
});

function planner(overrides: Partial<TourPlannerController> = {}) {
  return {
    ...hikePlannerDefaults(),
    tourType: 'horse',
    isHorse: true,
    mode: { type: 'new-draft' },
    waypoints: [] as TourPlannerWaypoint[],
    canEdit: true,
    isSaving: false,
    route: null,
    editWaypoints: vi.fn(),
    ...overrides,
  } as unknown as TourPlannerController;
}

async function openRoute(stub: TourPlannerController) {
  repo.list.mockResolvedValue(reply([ROUTE]));
  render(<HorseRoutesCard planner={stub} />);
  fireEvent.click(screen.getByRole('button', { name: 'Find in map view' }));
  fireEvent.click(await screen.findByTestId('horse-route-relation/42'));
  return screen.getByRole('dialog');
}

beforeEach(() => {
  repo.list.mockReset();
  publishTourMapViewport(VIEW);
  localStorage.clear();
});

describe('HorseRoutesCard (HOR-01)', () => {
  it('FE-HORSE-CARD-001: is there only while a ride is edited', () => {
    const { rerender } = render(<HorseRoutesCard planner={planner({ isHorse: false })} />);
    expect(screen.queryByTestId('horse-routes-card')).not.toBeInTheDocument();
    rerender(<HorseRoutesCard planner={planner({ mode: { type: 'neutral' } })} />);
    expect(screen.queryByTestId('horse-routes-card')).not.toBeInTheDocument();
    rerender(<HorseRoutesCard planner={planner()} />);
    expect(screen.getByTestId('horse-routes-card')).toBeInTheDocument();
    expect(repo.list).not.toHaveBeenCalled();
  });

  it('FE-HORSE-CARD-002: lists the routes of the view with their length, sections and where they go on', async () => {
    repo.list.mockResolvedValue(reply([ROUTE]));
    render(<HorseRoutesCard planner={planner()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Find in map view' }));
    const row = await screen.findByTestId('horse-route-relation/42');
    expect(row).toHaveTextContent('Reitweg Isartal');
    expect(row).toHaveTextContent('2.2 km');
    expect(row).toHaveTextContent('R1');
    expect(row).toHaveTextContent('Goes on beyond the view');
    expect(within(row).getByText('Sections: 2')).toBeInTheDocument();
    expect(screen.getByText(HORSE_ROUTES_ATTRIBUTION)).toBeInTheDocument();
    // The map moved: the routes shown are from another view, and can be looked for again.
    act(() => publishTourMapViewport({ ...VIEW, north: 47.31 }));
    expect(await screen.findByRole('button', { name: 'Search this view' })).toBeInTheDocument();
    expect(screen.getByText('The list shows the view you searched. Search again for this one.')).toBeInTheDocument();
  });

  it('FE-HORSE-CARD-003: says why it found nothing, and lets a failed search be asked again', async () => {
    repo.list.mockResolvedValueOnce(reply([])).mockRejectedValueOnce(new Error('502'));
    render(<HorseRoutesCard planner={planner()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Find in map view' }));
    expect(await screen.findByText('No signposted horse routes in this view.')).toBeInTheDocument();
    act(() => publishTourMapViewport({ ...VIEW, north: 47.31 }));
    fireEvent.click(await screen.findByRole('button', { name: 'Search this view' }));
    expect(await screen.findByText('Horse routes could not be read. Your ride is unchanged.')).toBeInTheDocument();
    act(() => publishTourMapViewport({ south: 46, west: 11, north: 47, east: 11.4 }));
    fireEvent.click(screen.getByRole('button', { name: 'Search this view' }));
    expect(await screen.findByText('Zoom in further to look for horse routes.')).toBeInTheDocument();
  });

  it('FE-HORSE-CARD-004: takes a section as the first leg of an empty ride, in one step', async () => {
    const stub = planner();
    const dialog = await openRoute(stub);
    expect(within(dialog).getByTestId('horse-map-stub')).toHaveAttribute('data-lines', '3');
    expect(within(dialog).getByTestId('horse-map-stub')).toHaveTextContent('AB');
    expect(within(dialog).getByText('Starts your ride')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByTestId('horse-section-adopt'));
    expect(stub.editWaypoints).toHaveBeenCalledTimes(1);
    type Change = (points: TourPlannerWaypoint[]) => TourPlannerWaypoint[];
    const change = vi.mocked(stub.editWaypoints).mock.calls[0]?.[0] as Change;
    const points = change([]);
    expect(points.map((point) => point.fixedLeg?.kind ?? null)).toEqual(['horse_route', null]);
    expect(points[0].fixedLeg).toMatchObject({ ref: 'relation/42', name: 'Reitweg Isartal', signposted: 'with' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('FE-HORSE-CARD-005: shows what the tags say, and says a closed part and the other signposted way', async () => {
    const dialog = await openRoute(planner());
    const access = within(dialog).getByTestId('horse-section-access');
    expect(access).toHaveTextContent('Designated for riders');
    expect(access).toHaveTextContent('800 m');
    expect(access).toHaveTextContent('Private');
    const closed = 'Part of this section is tagged as closed or private for horses.';
    expect(within(dialog).getByText(closed)).toBeInTheDocument();
    expect(within(dialog).getByText('Signposted this way')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reversed' }));
    expect(within(dialog).getByText('This section is signposted the other way.')).toBeInTheDocument();
    // A section the data says nothing about reads as unknown, not as open.
    fireEvent.click(within(dialog).getByTestId('horse-section-2'));
    expect(within(dialog).queryByText('Signposted this way')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'As mapped' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('FE-HORSE-CARD-006: never closes a gap by itself: the manual join has to be switched on first', async () => {
    const stub = planner({ waypoints: [{ id: 'a', lat: 47.1, lng: 11.25, role: 'start' }] });
    const dialog = await openRoute(stub);
    expect(within(dialog).getByTestId('horse-section-gap')).toHaveTextContent('5.6 km');
    const adopt = within(dialog).getByTestId('horse-section-adopt');
    expect(adopt).toBeDisabled();
    expect(adopt).toHaveAttribute(
      'title',
      'Join the gap with a manual section first, or pick a section that starts where your ride ends.'
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Join with a manual section' }));
    expect(adopt).toBeEnabled();
    // Another direction is another gap: the switch goes off again.
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reversed' }));
    expect(adopt).toBeDisabled();
  });

  it('FE-HORSE-CARD-007: goes on from the end of the ride where the section starts there', async () => {
    const stub = planner({ waypoints: [{ id: 'a', lat: 47.15, lng: 11.25, role: 'start' }] });
    const dialog = await openRoute(stub);
    expect(within(dialog).getByText('Joins the end of your ride')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(stub.editWaypoints).not.toHaveBeenCalled();
  });

  it('FE-HORSE-CARD-008: a search without a connection can be asked again on the view found before', async () => {
    repo.list.mockResolvedValueOnce(reply([ROUTE])).mockRejectedValueOnce(new OnlineOnlyError());
    render(<HorseRoutesCard planner={planner()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Find in map view' }));
    await screen.findByTestId('horse-route-relation/42');
    act(() => publishTourMapViewport({ ...VIEW, north: 47.31 }));
    fireEvent.click(await screen.findByRole('button', { name: 'Search this view' }));
    expect(await screen.findByText('Horse routes need a connection.')).toBeInTheDocument();
    act(() => publishTourMapViewport(VIEW));
    expect(screen.getByRole('button', { name: 'Search this view' })).toBeEnabled();
  });
});
