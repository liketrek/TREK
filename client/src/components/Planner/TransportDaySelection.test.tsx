import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildAssignment, buildDay, buildPlace, buildTrip, buildUser } from '../../../tests/helpers/factories';
import { buildPlanner } from '../../../tests/helpers/mobileTrip';
import { act, fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useTranslation } from '../../i18n';
import MTransportFormSheet from '../../mobile/screens/trip/sheets/MTransportFormSheet';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import type { Accommodation, AssignmentsMap, Day, Place } from '../../types';
import type { TransitPrefill } from './transitLeg';
import { TransportModal } from './TransportModal';

// Keep the real day selectors, wrappers and shared stop picker. Only the external
// geocoder is controlled: a saved private place need not exist in that service.
const { geocode, plan } = vi.hoisted(() => ({ geocode: vi.fn(), plan: vi.fn() }));
vi.mock('../../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/client')>()),
  transitApi: { geocode, plan },
}));

type Surface = 'desktop' | 'phone';
interface Fixture {
  days: Day[];
  places: Place[];
  assignments: AssignmentsMap;
  accommodations: Accommodation[];
  transitPrefill?: TransitPrefill;
  selectedDayId?: number;
}

function fixture(): Fixture {
  const days = [
    buildDay({ id: 101, trip_id: 1, day_number: 1, date: '2027-06-01', title: 'First day' }),
    buildDay({ id: 205, trip_id: 1, day_number: 2, date: '2027-06-02', title: 'Second day' }),
    buildDay({ id: 309, trip_id: 1, day_number: 3, date: '2027-06-03', title: 'Empty day' }),
  ];
  const places = ['First private stop', 'Second private stop', 'Shared private stop'].map((name, i) =>
    buildPlace({ id: 11 + i, trip_id: 1, name, lat: 52.5 + i / 100, lng: 13.4 })
  );
  const visit = (dayId: number, p: Place, order: number) =>
    buildAssignment({ day_id: dayId, place_id: p.id, place: p, order_index: order });
  return {
    days,
    places,
    assignments: {
      '101': [visit(101, places[0], 0), visit(101, places[2], 1)],
      '205': [visit(205, places[1], 0), visit(205, places[2], 1)],
      '309': [],
    },
    accommodations: [],
  };
}

function buildStay(id: number, name: string, start: number, end: number): Accommodation {
  return {
    id,
    trip_id: 1,
    place_id: 1000 + id,
    start_day_id: start,
    end_day_id: end,
    place_name: name,
    place_lat: 52 + id / 1000,
    place_lng: 13,
  } as Accommodation;
}

function longTripFixture(): Fixture {
  const days = Array.from({ length: 30 }, (_, i) =>
    buildDay({
      id: 5000 - i * 97,
      trip_id: 1,
      day_number: i + 1,
      date: new Date(Date.UTC(2027, 2, i + 1)).toISOString().slice(0, 10),
      title: `Day ${i + 1}`,
    })
  );
  days[28] = { ...days[28], date: null };
  const stay = (id: number, name: string, start: number, end: number) =>
    buildStay(id, name, days[start - 1].id, days[end - 1].id);
  const nearby = Array.from({ length: 4 }, (_, i) => [
    stay(10 + i * 2, `Nearby before ${i + 1}`, 18 - i, 20 - i),
    stay(11 + i * 2, `Nearby after ${i + 1}`, 22 + i, 24 + i),
  ]).flat();
  return {
    days,
    places: [],
    assignments: {},
    selectedDayId: days[20].id,
    accommodations: [
      stay(1, 'First-week hotel created first', 1, 7),
      stay(2, 'Undated hotel', 29, 30),
      ...nearby.slice().reverse(),
      { ...nearby[0], id: 99 },
      stay(100, 'Morning hotel', 20, 21),
      stay(101, 'Evening hotel', 21, 22),
      ...Array.from({ length: 10 }, (_, i) => stay(200 + i, `Current stay ${i + 1}`, 19, 23)),
    ],
  };
}

function Harness({ surface, data }: { surface: Surface; data: Fixture }) {
  const { t } = useTranslation();
  if (surface === 'phone') {
    const planner = buildPlanner({
      t,
      trip: buildTrip({ id: 1 }),
      days: data.days,
      places: data.places,
      assignments: data.assignments,
      storedAssignments: data.assignments,
      tripAccommodations: data.accommodations,
      showTransportModal: true,
      transportModalDayId: data.selectedDayId ?? 101,
      transportModalAutomated: true,
      transitPrefill: data.transitPrefill ?? null,
    });
    return <MTransportFormSheet planner={planner} onOpenExpense={vi.fn()} />;
  }
  return (
    <TransportModal
      isOpen
      onClose={vi.fn()}
      onSave={vi.fn()}
      reservation={null}
      days={data.days}
      selectedDayId={data.selectedDayId ?? 101}
      initialAutomated
      places={data.places}
      assignments={data.assignments}
      accommodations={data.accommodations}
      transitPrefill={data.transitPrefill}
    />
  );
}

const inputs = () => screen.getAllByPlaceholderText('Search stop or station…');
async function switchDay(user: ReturnType<typeof userEvent.setup>, current: string, next: string) {
  await user.click(screen.getByText(current));
  await user.click(screen.getByRole('button', { name: new RegExp(`^${next}`) }));
}
const pickNames = () => screen.queryAllByRole('button', { name: /private stop/ }).map((b) => b.textContent);

beforeEach(() => {
  resetAllStores();
  geocode.mockReset().mockResolvedValue({ results: [] });
  plan.mockReset();
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  seedStore(useTripStore, { trip: buildTrip({ id: 1 }), reservations: [] });
});

describe.each<Surface>(['desktop', 'phone'])('Automated transport day selection: %s', (surface) => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: surface === 'phone' ? 390 : 1440 });
    fireEvent(window, new Event('resize'));
  });

  it('scopes both pickers by day id and keeps a shared place when switching back and forth', async () => {
    const user = userEvent.setup();
    render(<Harness surface={surface} data={fixture()} />);
    await user.click(inputs()[0]);
    expect(pickNames()).toEqual(['First private stop', 'Shared private stop']);
    await switchDay(user, 'First day', 'Second day');
    await user.click(inputs()[1]);
    expect(pickNames()).toEqual(['Second private stop', 'Shared private stop']);
    await switchDay(user, 'Second day', 'First day');
    await user.click(inputs()[0]);
    expect(pickNames()).toEqual(['First private stop', 'Shared private stop']);
  });

  it('keeps all nine eligible day places available in the dropdown', async () => {
    const user = userEvent.setup();
    const data = fixture();
    const stops = Array.from({ length: 9 }, (_, i) => buildPlace({ id: 50 + i, name: `Day stop ${i + 1}` }));
    data.places.push(...stops);
    data.assignments['101'] = stops.map((p, i) =>
      buildAssignment({ day_id: 101, place_id: p.id, place: p, order_index: i })
    );
    render(<Harness surface={surface} data={data} />);
    await user.click(inputs()[0]);
    expect(screen.queryAllByRole('button', { name: /^Day stop/ }).map((b) => b.textContent)).toEqual(
      stops.map((p) => p.name)
    );
    expect(screen.queryByRole('button', { name: 'Second private stop' })).not.toBeInTheDocument();
  });

  it('finds an assigned private place when the geocoder has no result', async () => {
    const user = userEvent.setup();
    render(<Harness surface={surface} data={fixture()} />);
    await user.click(inputs()[0]);
    await user.type(inputs()[0], 'First private');
    await waitFor(() => expect(geocode).toHaveBeenCalled());
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByRole('button', { name: 'First private stop' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Second private stop' })).not.toBeInTheDocument();
  });

  it('ranks matching saved places before external matches and deduplicates by name and both coordinates', async () => {
    const user = userEvent.setup();
    const data = fixture();
    const saved = data.places[0];
    const other = { name: 'External private stop', lat: 52.8, lng: 13.8, area: 'Berlin' };
    geocode.mockResolvedValue({
      results: [
        other,
        { name: saved.name.toUpperCase(), lat: saved.lat, lng: saved.lng, area: 'Duplicate' },
        { ...other },
        { name: saved.name, lat: saved.lat, lng: 13.9, area: 'Other longitude' },
      ],
    });
    render(<Harness surface={surface} data={data} />);
    await user.type(inputs()[0], 'private');
    await screen.findByRole('button', { name: /External private stop/ });
    const rows = screen.getAllByRole('button', { name: /private stop/i });
    expect(rows.map((row) => row.textContent)).toEqual([
      'First private stop',
      'Shared private stop',
      'External private stopBerlin',
      'First private stopOther longitude',
    ]);
    expect(geocode).toHaveBeenCalledTimes(1);
    await user.click(rows[0]);
    expect(inputs()[0]).toHaveValue(saved.name);
  });

  it('limits only other-day stays, keeping current hotels, terminals and every selected-day place first', async () => {
    const user = userEvent.setup();
    const data = fixture();
    const stops = Array.from({ length: 12 }, (_, i) => buildPlace({ id: 50 + i, name: `Day stop ${i + 1}` }));
    // A same-name stop at a different longitude must not be dropped as a duplicate.
    stops.push(buildPlace({ id: 62, name: stops[0].name, lat: stops[0].lat, lng: 10 }));
    data.places.push(...stops);
    data.assignments['101'] = stops.map((p, i) =>
      buildAssignment({ day_id: 101, place_id: p.id, place: p, order_index: i })
    );
    data.accommodations = Array.from(
      { length: 12 },
      (_, i) =>
        ({
          id: 70 + i,
          trip_id: 1,
          place_id: 70 + i,
          start_day_id: i === 0 ? 101 : 205,
          end_day_id: i === 0 ? 101 : 205,
          place_name: i === 0 ? 'Current hotel' : `Other hotel ${i}`,
          place_lat: 52 + i / 100,
          place_lng: 13,
        }) as Accommodation
    );
    // Duplicate stays must not consume another slot of the other-day allowance.
    data.accommodations.splice(2, 0, { ...data.accommodations[1], id: 90 });
    seedStore(useTripStore, {
      reservations: [
        {
          id: 81,
          trip_id: 1,
          type: 'train',
          day_id: 101,
          end_day_id: 101,
          endpoints: [{ role: 'from', name: 'Current terminal', lat: 52, lng: 13, local_date: '2027-06-01' }],
        },
      ] as ReturnType<typeof useTripStore.getState>['reservations'],
    });
    render(<Harness surface={surface} data={data} />);
    for (const input of inputs()) {
      await user.click(input);
      const rows = screen.getAllByRole('button', { name: /Current hotel|Current terminal|Day stop|Other hotel/ });
      expect(rows.map((row) => row.textContent)).toEqual([
        'Current hotel',
        'Current terminal',
        ...stops.map((p) => p.name),
        ...Array.from({ length: 8 }, (_, i) => `Other hotel ${i + 1}`),
      ]);
      expect(screen.queryByRole('button', { name: 'Second private stop' })).not.toBeInTheDocument();
    }
  });

  it('keeps more than eight current-day hotels selectable and searchable despite earlier other-day stays', async () => {
    const user = userEvent.setup();
    const data = fixture();
    const current = Array.from({ length: 12 }, (_, i) => buildStay(200 + i, `Current day hotel ${i + 1}`, 101, 101));
    const other = Array.from({ length: 9 }, (_, i) => buildStay(100 + i, `Other day hotel ${i + 1}`, 205, 205));
    data.accommodations = [
      ...other,
      ...current,
      { ...current[8], id: 999 },
      { ...buildStay(300, 'Unlocated current hotel', 101, 101), place_lat: null },
    ];
    render(<Harness surface={surface} data={data} />);
    for (const input of inputs()) {
      await user.click(input);
      expect(screen.getAllByRole('button', { name: /^Current day hotel/ }).map((b) => b.textContent)).toEqual(
        current.map((a) => a.place_name)
      );
      expect(screen.getAllByRole('button', { name: /^Other day hotel/ }).map((b) => b.textContent)).toEqual(
        other.slice(0, 8).map((a) => a.place_name)
      );
      expect(screen.queryByRole('button', { name: 'Unlocated current hotel' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'First private stop' })).toBeInTheDocument();
    }
    await user.type(inputs()[1], 'current day hotel 12');
    await user.click(screen.getByRole('button', { name: 'Current day hotel 12' }));
    expect(inputs()[1]).toHaveValue('Current day hotel 12');
  });

  it('offers Hotel 09 on Day 3 for the manual-review booking pattern without using mirrored day places', async () => {
    const user = userEvent.setup();
    const data = fixture();
    const a = buildStay(1, 'Hotel A — first night', 101, 205);
    const b = buildStay(2, 'Hotel B — second night', 205, 309);
    const sameDay = Array.from({ length: 9 }, (_, i) =>
      buildStay(3 + i, `Other night hotel ${String(i + 1).padStart(2, '0')}`, 309, 309)
    );
    data.accommodations = [a, b, ...sameDay];
    // Days hides accommodation-owned mirror assignments: hotels must come from the stays themselves.
    data.assignments['309'] = [];
    render(<Harness surface={surface} data={data} />);
    await switchDay(user, 'First day', 'Empty day');
    for (const input of inputs()) {
      await user.click(input);
      expect(
        screen.getAllByRole('button', { name: /Hotel A|Hotel B|Other night hotel/ }).map((row) => row.textContent)
      ).toEqual([b.place_name, ...sameDay.map((stay) => stay.place_name), a.place_name]);
    }
    await user.click(screen.getByRole('button', { name: 'Other night hotel 09' }));
    expect(inputs()[1]).toHaveValue('Other night hotel 09');
  });

  it('keeps multi-night stays and checkout-day stays uncapped, with bookends before the other current stays', async () => {
    const user = userEvent.setup();
    const data = fixture();
    const other = Array.from({ length: 9 }, (_, i) => buildStay(100 + i, `Future hotel ${i + 1}`, 309, 309));
    const spanning = Array.from({ length: 10 }, (_, i) => buildStay(200 + i, `Multi-night hotel ${i + 1}`, 101, 309));
    const checkout = buildStay(300, 'Checks out today', 101, 205);
    const checkin = buildStay(301, 'Checks in today', 205, 309);
    data.accommodations = [...other, ...spanning, checkout, checkin];
    render(<Harness surface={surface} data={data} />);
    await switchDay(user, 'First day', 'Second day');
    await user.click(inputs()[0]);
    expect(
      screen
        .getAllByRole('button', { name: /Multi-night hotel|Checks (in|out) today|Future hotel/ })
        .map((row) => row.textContent)
    ).toEqual([
      spanning[0].place_name,
      checkin.place_name,
      ...spanning.slice(1).map((stay) => stay.place_name),
      checkout.place_name,
      ...other.slice(0, 8).map((stay) => stay.place_name),
    ]);
    expect(screen.queryByRole('button', { name: 'Future hotel 9' })).not.toBeInTheDocument();
  });

  it('does not let a first-week hotel take a Day 21 slot from eight closer stays on a 30-day trip', async () => {
    const user = userEvent.setup();
    render(<Harness surface={surface} data={longTripFixture()} />);
    for (const input of inputs()) {
      await user.click(input);
      expect(screen.queryByRole('button', { name: 'First-week hotel created first' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Undated hotel' })).not.toBeInTheDocument();
      expect(
        screen
          .getAllByRole('button', { name: /Morning hotel|Evening hotel|Current stay|Nearby/ })
          .map((row) => row.textContent)
      ).toEqual([
        'Morning hotel',
        'Evening hotel',
        ...Array.from({ length: 10 }, (_, i) => `Current stay ${i + 1}`),
        ...Array.from({ length: 4 }, (_, i) => [`Nearby before ${i + 1}`, `Nearby after ${i + 1}`]).flat(),
      ]);
    }
  });

  it('puts undated stays last and orders identical dated intervals by stay id independently of input order', async () => {
    const user = userEvent.setup();
    const data = longTripFixture();
    const dated = data.accommodations.find((stay) => stay.place_name === 'Nearby after 1');
    if (!dated) throw new Error('Missing dated fixture');
    const undated = data.accommodations.find((stay) => stay.place_name === 'Undated hotel');
    if (!undated) throw new Error('Missing undated fixture');
    data.accommodations = [
      undated,
      { ...dated, id: 90, place_name: 'Same dates higher id', place_lng: 14 },
      { ...dated, id: 80, place_name: 'Same dates lower id', place_lng: 15 },
    ];
    const view = render(<Harness surface={surface} data={data} />);
    await user.click(inputs()[0]);
    const names = () =>
      screen.getAllByRole('button', { name: /Same dates|Undated hotel/ }).map((row) => row.textContent);
    expect(names()).toEqual(['Same dates lower id', 'Same dates higher id', 'Undated hotel']);
    view.rerender(
      <Harness surface={surface} data={{ ...data, accommodations: data.accommodations.slice().reverse() }} />
    );
    expect(names()).toEqual(['Same dates lower id', 'Same dates higher id', 'Undated hotel']);
  });

  it('refreshes an open dropdown after places are added, removed and reordered', async () => {
    const user = userEvent.setup();
    const data = fixture();
    const view = render(<Harness surface={surface} data={data} />);
    await user.click(inputs()[0]);
    expect(pickNames()).toEqual(['First private stop', 'Shared private stop']);
    const added = buildPlace({ id: 99, name: 'Added private stop' });
    const next = {
      ...data,
      places: [...data.places, added],
      assignments: {
        ...data.assignments,
        '101': [
          { ...data.assignments['101'][1], order_index: 2 },
          buildAssignment({ day_id: 101, place_id: added.id, place: added, order_index: 0 }),
        ],
      },
    };
    view.rerender(<Harness surface={surface} data={next} />);
    expect(pickNames()).toEqual(['Added private stop', 'Shared private stop']);
  });

  it('keeps place membership tied to ids when days and their dates are reordered', async () => {
    const user = userEvent.setup();
    const data = fixture();
    const view = render(<Harness surface={surface} data={data} />);
    const reordered = {
      ...data,
      days: [
        { ...data.days[1], day_number: 1, date: data.days[0].date },
        { ...data.days[0], day_number: 2, date: data.days[1].date },
        data.days[2],
      ],
    };
    view.rerender(<Harness surface={surface} data={reordered} />);
    await user.click(inputs()[0]);
    expect(pickNames()).toEqual(['First private stop', 'Shared private stop']);
    await switchDay(user, 'First day', 'Second day');
    await user.click(inputs()[0]);
    expect(pickNames()).toEqual(['Second private stop', 'Shared private stop']);
  });

  it('does not retain endpoints from an unrelated day after selecting from and to', async () => {
    const user = userEvent.setup();
    const data = fixture();
    // Make the first day's two endpoints exclusive to that day.
    data.assignments['205'] = [data.assignments['205'][0]];
    render(<Harness surface={surface} data={data} />);
    await user.click(inputs()[0]);
    await user.click(screen.getByRole('button', { name: 'First private stop' }));
    await user.click(inputs()[1]);
    await user.click(screen.getByRole('button', { name: 'Shared private stop' }));
    await switchDay(user, 'First day', 'Second day');
    expect(inputs().map((i) => (i as HTMLInputElement).value)).toEqual(['', '']);
  });

  it('clears search state when changing days so the next day offers its own places', async () => {
    const user = userEvent.setup();
    geocode.mockResolvedValue({ results: [{ name: 'Old external station', lat: 52, lng: 13, area: null }] });
    render(<Harness surface={surface} data={fixture()} />);
    await user.type(inputs()[0], 'Old station');
    await screen.findByRole('button', { name: 'Old external station' });
    await switchDay(user, 'First day', 'Second day');
    await user.click(inputs()[0]);
    expect(screen.queryByRole('button', { name: 'Old external station' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Second private stop' })).toBeInTheDocument();
    expect(inputs().map((i) => (i as HTMLInputElement).value)).toEqual(['', '']);
  });

  it('scopes day-plan endpoint, time and walk prefills to the opening day', async () => {
    const user = userEvent.setup();
    const data = fixture();
    data.transitPrefill = {
      from: { name: 'Walk end', lat: 52.5, lng: 13.4 },
      to: { name: 'Next walk start', lat: 52.6, lng: 13.5 },
      time: '12:15',
      walk: {
        dayId: 101,
        fromWalk: 'Old town',
        toWalk: 'Harbour',
        ends: '12:15',
        endsNextDay: false,
        endsAtLeast: false,
        nextStarts: '13:00',
      },
    };
    render(<Harness surface={surface} data={data} />);
    expect(inputs().map((i) => (i as HTMLInputElement).value)).toEqual(['Walk end', 'Next walk start']);
    expect(screen.getByTestId('transit-walk-end')).toHaveTextContent('Old town');
    expect(screen.getByDisplayValue('12:15')).toBeInTheDocument();
    await switchDay(user, 'First day', 'Second day');
    expect(inputs().map((i) => (i as HTMLInputElement).value)).toEqual(['', '']);
    expect(screen.queryByTestId('transit-walk-end')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('12:15')).not.toBeInTheDocument();
    await switchDay(user, 'Second day', 'First day');
    expect(inputs().map((i) => (i as HTMLInputElement).value)).toEqual(['Walk end', 'Next walk start']);
    expect(screen.getByTestId('transit-walk-end')).toHaveTextContent('Old town');
  });

  it('drops old itineraries when changing the day', async () => {
    const user = userEvent.setup();
    const data = fixture();
    const stop = (name: string, time: string) => ({
      name,
      lat: 52.5,
      lng: 13.4,
      time,
      scheduledTime: null,
      track: null,
    });
    plan.mockResolvedValue({
      itineraries: [
        {
          startTime: '2027-06-01T07:00:00Z',
          endTime: '2027-06-01T07:30:00Z',
          duration: 1800,
          transfers: 0,
          walkSeconds: 0,
          legs: [
            {
              mode: 'SUBWAY',
              from: stop('A', '2027-06-01T07:00:00Z'),
              to: stop('B', '2027-06-01T07:30:00Z'),
              duration: 1800,
              distance: null,
              headsign: null,
              line: 'U88',
              lineColor: null,
              lineTextColor: null,
              agency: null,
              intermediateStops: 0,
            },
          ],
        },
      ],
    });
    render(<Harness surface={surface} data={data} />);
    await user.click(inputs()[0]);
    await user.click(screen.getByRole('button', { name: 'First private stop' }));
    await user.click(inputs()[1]);
    await user.click(screen.getByRole('button', { name: 'Shared private stop' }));
    await user.click(screen.getByRole('button', { name: /^Search$/ }));
    await screen.findByText('U88');
    await switchDay(user, 'First day', 'Second day');
    expect(screen.queryByText('U88')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add to day' })).not.toBeInTheDocument();
    expect(inputs().map((i) => (i as HTMLInputElement).value)).toEqual(['', '']);
  });

  it('ignores an old geocoder response after the day changes', async () => {
    const user = userEvent.setup();
    let finish: (value: { results: { name: string; lat: number; lng: number; area: null }[] }) => void = () => {
      throw new Error('lookup not started');
    };
    geocode.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    render(<Harness surface={surface} data={fixture()} />);
    await user.type(inputs()[0], 'Old station');
    await waitFor(() => expect(geocode).toHaveBeenCalledTimes(1));
    await switchDay(user, 'First day', 'Second day');
    await user.click(inputs()[0]);
    await act(async () => {
      finish({ results: [{ name: 'Late old station', lat: 52, lng: 13, area: null }] });
    });
    expect(screen.queryByRole('button', { name: 'Late old station' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Second private stop' })).toBeInTheDocument();
    expect(inputs()[0]).toHaveValue('');
  });

  it('keeps the newest search results when an older lookup answers last', async () => {
    type Answer = { results: { name: string; lat: number; lng: number; area: null }[] };
    const pending: ((value: Answer) => void)[] = [];
    geocode.mockImplementation(() => new Promise<Answer>((resolve) => pending.push(resolve)));
    render(<Harness surface={surface} data={fixture()} />);
    fireEvent.focus(inputs()[0]);
    fireEvent.change(inputs()[0], { target: { value: 'Old' } });
    await waitFor(() => expect(geocode).toHaveBeenCalledTimes(1));
    fireEvent.change(inputs()[0], { target: { value: 'New' } });
    await waitFor(() => expect(geocode).toHaveBeenCalledTimes(2));
    await act(async () => {
      pending[1]({ results: [{ name: 'New station', lat: 52.5, lng: 13.4, area: null }] });
    });
    await act(async () => {
      pending[0]({ results: [{ name: 'Old station', lat: 52.6, lng: 13.5, area: null }] });
    });
    expect(screen.getByRole('button', { name: 'New station' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Old station' })).not.toBeInTheDocument();
  });

  it('ignores a superseded geocoder response after a saved place is picked', async () => {
    const user = userEvent.setup();
    let finish: (value: { results: { name: string; lat: number; lng: number; area: null }[] }) => void = () => {
      throw new Error('lookup not started');
    };
    geocode.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    render(<Harness surface={surface} data={fixture()} />);
    fireEvent.change(inputs()[0], { target: { value: 'Old' } });
    await waitFor(() => expect(geocode).toHaveBeenCalledTimes(1));
    fireEvent.change(inputs()[0], { target: { value: 'First private' } });
    fireEvent.focus(inputs()[0]);
    fireEvent.click(screen.getByRole('button', { name: 'First private stop' }));
    await act(async () => {
      finish({ results: [{ name: 'Superseded station', lat: 52, lng: 13, area: null }] });
    });
    await user.clear(inputs()[0]);
    expect(screen.queryByRole('button', { name: 'Superseded station' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'First private stop' })).toBeInTheDocument();
    expect(geocode).toHaveBeenCalledTimes(1);
  });

  it('offers no unrelated regular places on an empty day', async () => {
    const user = userEvent.setup();
    render(<Harness surface={surface} data={fixture()} />);
    await switchDay(user, 'First day', 'Empty day');
    await user.click(inputs()[0]);
    expect(pickNames()).toEqual([]);
  });

  it('offers the active stay and other trip stays intentionally, even on a booking-only day', async () => {
    const user = userEvent.setup();
    const data = fixture();
    data.assignments['101'] = [];
    const stay = (id: number, name: string, dayId: number): Accommodation =>
      ({
        id,
        trip_id: 1,
        place_id: id,
        start_day_id: dayId,
        end_day_id: dayId,
        place_name: name,
        place_lat: 52 + id / 100,
        place_lng: 13,
      }) as Accommodation;
    data.accommodations = [stay(70, 'Current hotel', 101), stay(71, 'Later hotel', 205)];
    render(<Harness surface={surface} data={data} />);
    await user.click(inputs()[0]);
    expect(screen.getByRole('button', { name: 'Current hotel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Later hotel' })).toBeInTheDocument();
    expect(pickNames()).toEqual([]);
  });

  it('offers only the selected day transport terminals on a transport-only day', async () => {
    const user = userEvent.setup();
    const data = fixture();
    data.assignments['101'] = [];
    const endpoint = (role: 'from' | 'to', name: string, date: string) => ({
      role,
      name,
      lat: 52,
      lng: 13,
      local_date: date,
    });
    seedStore(useTripStore, {
      reservations: [
        {
          id: 81,
          trip_id: 1,
          type: 'train',
          day_id: 101,
          end_day_id: 205,
          endpoints: [
            endpoint('from', 'First terminal', '2027-06-01'),
            endpoint('to', 'Second terminal', '2027-06-02'),
          ],
        },
      ] as ReturnType<typeof useTripStore.getState>['reservations'],
    });
    render(<Harness surface={surface} data={data} />);
    await user.click(inputs()[0]);
    expect(screen.getByRole('button', { name: 'First terminal' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Second terminal' })).not.toBeInTheDocument();
    await switchDay(user, 'First day', 'Second day');
    await user.click(inputs()[0]);
    expect(screen.getByRole('button', { name: 'Second terminal' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'First terminal' })).not.toBeInTheDocument();
  });
});
