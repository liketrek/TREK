// CW-08: the transit search between two city walks, opened from the day plan's
// connector with the first walk's end and the next one's start. The mocks are the
// ones TransitSearchPanel.test.tsx renders the panel with.
import userEvent from '@testing-library/user-event';
import { buildDay, buildPlace, buildUser } from '../../../tests/helpers/factories';
import { render, screen, waitFor } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import type { WalkTransitContext } from '../Tours/walk/walkTransit';
import TransitSearchPanel from './TransitSearchPanel';

const { transitApiMock } = vi.hoisted(() => ({ transitApiMock: { geocode: vi.fn(), plan: vi.fn() } }));

vi.mock('../../api/client', async (importOriginal) => {
  const actual = (await importOriginal()) as object;
  return { ...actual, transitApi: transitApiMock };
});

vi.mock('../shared/Toast', () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }));

const day = buildDay({ id: 10, trip_id: 1, date: '2025-06-01', title: 'Berlin Day' });
const OLD_BRIDGE = { name: 'Old bridge', lat: 52.51, lng: 13.42 };
const FISH_MARKET = { name: 'Fish market', lat: 52.5, lng: 13.45 };
const WALK: WalkTransitContext = {
  dayId: 10,
  fromWalk: 'Old town',
  toWalk: 'Harbour',
  ends: '12:15',
  endsNextDay: false,
  endsAtLeast: false,
  nextStarts: '13:00',
};

// Berlin, summer time (UTC+2): a tram that departs 12:20 and arrives at `arrives` (UTC).
function itinerary(arrives: string) {
  const at = (time: string) => ({ lat: 52.505, lng: 13.43, time, scheduledTime: null, track: null });
  return {
    startTime: '2025-06-01T10:20:00Z',
    endTime: `2025-06-01T${arrives}:00Z`,
    duration: 1800,
    transfers: 0,
    walkSeconds: 240,
    legs: [
      {
        mode: 'TRAM',
        from: { ...at('2025-06-01T10:20:00Z'), name: 'START' },
        to: { ...at(`2025-06-01T${arrives}:00Z`), name: 'END' },
        duration: 1800,
        distance: null,
        headsign: 'Harbour',
        line: 'M1',
        lineColor: null,
        lineTextColor: null,
        agency: 'BVG',
        intermediateStops: 4,
      },
    ],
  };
}

function renderPanel(walk: WalkTransitContext | null, initialTime: string | null = walk?.ends ?? null) {
  const onAdd = vi.fn().mockResolvedValue({});
  render(
    <TransitSearchPanel
      day={day}
      days={[day]}
      places={[buildPlace({ id: 1, name: 'Old town', lat: 52.52, lng: 13.4 })]}
      onAdd={onAdd}
      initialFrom={OLD_BRIDGE}
      initialTo={FISH_MARKET}
      initialTime={initialTime}
      walk={walk}
    />
  );
  return { onAdd };
}

const timeField = () => screen.getByPlaceholderText('00:00') as HTMLInputElement;
const searchButton = () => screen.getByRole('button', { name: /^Search$/ });

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  seedStore(useSettingsStore, { settings: { time_format: '24h' } } as never);
});

describe('TransitSearchPanel between two city walks (CW-08)', () => {
  it('says when the first walk ends and the next starts, and departs from the last stop then', async () => {
    const user = userEvent.setup();
    transitApiMock.plan.mockResolvedValueOnce({ itineraries: [] });
    renderPanel(WALK);

    expect(screen.getByTestId('transit-walk-end')).toHaveTextContent('Old town ends at about 12:15.');
    expect(screen.getByTestId('transit-walk-next')).toHaveTextContent('Harbour starts at 13:00.');
    const [from, to] = screen.getAllByPlaceholderText('Search stop or station…') as HTMLInputElement[];
    expect(from?.value).toBe('Old bridge');
    expect(to?.value).toBe('Fish market');
    expect(timeField().value).toBe('12:15');

    await user.click(searchButton());
    await waitFor(() => expect(transitApiMock.plan).toHaveBeenCalled());
    // 12:15 in Berlin (UTC+2), from the walk's end and to the next one's start.
    expect(transitApiMock.plan.mock.calls[0]?.[0]).toMatchObject({
      from: '52.51,13.42',
      to: '52.5,13.45',
      time: '2025-06-01T10:15:00.000Z',
    });
  });

  it('marks a connection that arrives after the next walk starts, and only that one', async () => {
    const user = userEvent.setup();
    transitApiMock.plan.mockResolvedValueOnce({ itineraries: [itinerary('11:10'), itinerary('10:50')] });
    renderPanel(WALK);

    await user.click(searchButton());
    await screen.findByText(/12:20\D+13:10/);
    const late = screen.getAllByTestId('transit-walk-late');
    expect(late).toHaveLength(1);
    expect(late[0]).toHaveTextContent('Arrives after Harbour starts at 13:00');
    expect(screen.getByText(/12:20\D+13:10/).closest('button')).toContainElement(late[0] ?? null);
  });

  it('says an end that leaves a time out is the earliest', () => {
    renderPanel({ ...WALK, endsAtLeast: true });
    expect(screen.getByTestId('transit-walk-end')).toHaveTextContent(
      'Old town ends at 12:15 at the earliest; not all of its times are known yet.'
    );
  });

  it('says a walk that ends after midnight does so, and makes up no time on this day', () => {
    renderPanel({ ...WALK, ends: null, endsNextDay: true, endsAtLeast: true });
    expect(screen.getByTestId('transit-walk-end')).toHaveTextContent(
      'Old town only ends after midnight, so choose a departure time.'
    );
    expect(timeField().value).toBe('');
  });

  it('makes up no time without an end, and waits for one to be chosen', async () => {
    const user = userEvent.setup();
    transitApiMock.plan.mockResolvedValueOnce({ itineraries: [] });
    renderPanel({ ...WALK, ends: null, nextStarts: null });

    expect(screen.getByTestId('transit-walk-end')).toHaveTextContent(
      'When Old town ends is not known yet, so choose a departure time.'
    );
    expect(screen.queryByTestId('transit-walk-next')).not.toBeInTheDocument();
    expect(timeField().value).toBe('');
    expect(searchButton()).toBeDisabled();

    await user.type(timeField(), '1230');
    await user.tab();
    expect(searchButton()).toBeEnabled();
    await user.click(searchButton());
    await waitFor(() => expect(transitApiMock.plan).toHaveBeenCalled());
    expect(transitApiMock.plan.mock.calls[0]?.[0]).toMatchObject({ time: '2025-06-01T10:30:00.000Z' });
  });

  it('on another day than the walks, speaks of them no more and departs at the usual time', () => {
    renderPanel({ ...WALK, dayId: 11 }, null);
    expect(screen.queryByTestId('transit-walk-end')).not.toBeInTheDocument();
    expect(timeField().value).toBe('09:00');
  });

  it('adds a connection only once it is opened and taken, between the two stops', async () => {
    const user = userEvent.setup();
    transitApiMock.plan.mockResolvedValueOnce({ itineraries: [itinerary('10:50')] });
    const { onAdd } = renderPanel(WALK);

    await user.click(searchButton());
    await user.click(await screen.findByText(/12:20\D+12:50/));
    expect(onAdd).not.toHaveBeenCalled();
    await user.click(await screen.findByRole('button', { name: 'Add to day' }));

    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    const payload = onAdd.mock.calls[0]?.[0];
    expect(payload).toMatchObject({ type: 'transit', title: 'Old bridge → Fish market', day_id: 10 });
    expect(payload.endpoints.map((point: { name: string }) => point.name)).toEqual(['Old bridge', 'Fish market']);
  });
});
