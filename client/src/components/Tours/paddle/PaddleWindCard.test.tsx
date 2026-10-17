// FE-PADDLE-WIND-001 to FE-PADDLE-WIND-016: the wind card of a paddle tour (PAD-08) and the section that feeds it.
// FE-PADDLE-FIGURE-001 to FE-PADDLE-FIGURE-002: the figure badge the card shows its values in.
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Day, WindForecastResponse, WindHour } from '@trek/shared';

import { fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import { formatDate } from '../../../utils/formatters';
import type { TourDay } from '../tourDays';
import { FigureBadge } from './FigureBadge';
import { PaddleWindCard, PaddleWindSection } from './PaddleWindCard';
import type { TourWind, TourWindState } from './useTourWind';

const hook = vi.hoisted(() => ({
  useTourWind: vi.fn<(placeId: number | null, start: { lat: number; lng: number } | null) => TourWind>(),
}));
vi.mock('./useTourWind', () => ({ useTourWind: hook.useTourWind }));

/** The dash a figure the source left out reads as, never a zero. */
const NONE = '–';

/** The notices as shared/src/i18n/en/tours.ts words them. */
const SAYS = {
  noDay: 'Put the tour on a day of the trip to see the wind forecast for that day.',
  noDate: 'This day of the trip has no date, so there is no forecast for it.',
  noPlace: 'The tour has no start point yet to ask the forecast for.',
  offline: 'Without a connection there is no wind forecast.',
  error: 'The wind forecast cannot be fetched right now.',
  past: 'This day has passed. A forecast exists only for days to come.',
};

const HINTS = [
  'Headwind costs time and strength.',
  'Crosswind pushes the boat off course.',
  'Open crossings are more exposed than the shore.',
  'Gusts are stronger than the mean and come suddenly.',
  'No figure is an all-clear. Check the conditions on site.',
];

const FETCHED_AT = '2026-07-07T09:45:00Z';
const FETCHED_CLOCK = new Date(FETCHED_AT).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
/** When the forecast was asked, with the spaces the DOM queries read (ICU puts a narrow one before AM). */
const FETCHED_TIME = FETCHED_CLOCK.replace(/\s/g, ' ');

const dayOf = (id: number, date: string | null): Day => ({ id, trip_id: 3, date });
const JULY_8: TourDay = { day: dayOf(11, '2026-07-08'), index: 1 };
const JULY_9: TourDay = { day: dayOf(12, '2026-07-09'), index: 3 };
const UNDATED: TourDay = { day: dayOf(13, null), index: 2 };

const hourOf = (hour: number, speed: number | null, gusts: number | null, direction: number | null): WindHour => ({
  hour,
  speed_kmh: speed,
  gusts_kmh: gusts,
  direction_deg: direction,
});

/** A day on the water: an hour either side of the strip, a calm one and one the source left out. */
const HOURS: WindHour[] = [
  hourOf(5, 30, 50, 90),
  hourOf(6, 8, 14, 200),
  hourOf(7, 0, 0, 0),
  hourOf(9, null, null, null),
  hourOf(10, 10, null, null),
  hourOf(12, 20, 40, 270),
  hourOf(21, 4, 6, 180),
  hourOf(22, 60, 80, 90),
];

function forecastOf(overrides: Partial<WindForecastResponse> = {}): WindForecastResponse {
  return {
    status: 'forecast',
    date: '2026-07-08',
    lat: 47.05,
    lng: 8.31,
    timezone: 'Europe/Zurich',
    source: 'Open-Meteo',
    fetched_at: FETCHED_AT,
    horizon_days: 16,
    hours: [],
    day: { speed_max_kmh: 18, gusts_max_kmh: 32, direction_dominant_deg: 225 },
    ...overrides,
  };
}

const ready = (forecast: WindForecastResponse): TourWindState => ({ kind: 'ready', forecast });

const retry = vi.fn<TourWind['retry']>();
const chooseDay = vi.fn<TourWind['chooseDay']>();

/** What useTourWind hands the card: a state, the tour's days and the one shown. */
function windOf(
  state: TourWindState,
  tourDays: TourDay[] = [JULY_8],
  day: TourDay | null = tourDays[0] ?? null
): TourWind {
  return { state, day, tourDays, chooseDay, retry };
}

const renderCard = (wind: TourWind) => render(<PaddleWindCard wind={wind} />);

/** A day as the card names it, with the spaces the DOM queries read. */
function dateLabel(date: string): string {
  const label = formatDate(date, 'en-US');
  if (!label) throw new Error(`no label for ${date}`);
  return label.replace(/\s/g, ' ');
}

/** What an element's tooltip says once it is hovered; the hover ends before it returns. */
async function tooltipOf(element: HTMLElement): Promise<string | null> {
  fireEvent.mouseEnter(element);
  const text = (await screen.findByRole('tooltip')).textContent;
  fireEvent.mouseLeave(element);
  return text;
}

/** The column of one hour in the strip, the element its tooltip hangs on. */
function hourColumn(hour: number): HTMLElement {
  const column = within(screen.getByTestId('paddle-wind-hours')).getByText(String(hour)).parentElement;
  if (!column) throw new Error(`no column for ${hour}:00`);
  return column;
}

/** The height of a column's bar for the mean or the gusts; undefined when the column has none. */
function barHeight(column: HTMLElement, bar: 'mean' | 'gusts'): string | undefined {
  return column.querySelector<HTMLElement>(bar === 'mean' ? '.bg-info' : '.bg-info-soft')?.style.height;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PaddleWindCard', () => {
  it('FE-PADDLE-WIND-001: a tour on no day asks to be put on one, names no day and still offers the hints', () => {
    renderCard(windOf({ kind: 'no_day' }, [], null));

    const card = screen.getByRole('region', { name: 'Wind' });
    expect(within(card).getByText(SAYS.noDay)).toBeInTheDocument();
    expect(within(card).queryByText(/^Day \d+$/)).not.toBeInTheDocument();
    expect(within(card).queryByTestId('paddle-wind-mean')).not.toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'What wind means for paddling' })).toBeInTheDocument();
  });

  it('FE-PADDLE-WIND-002: a day without a date says there is no forecast for it and is named by its number', () => {
    renderCard(windOf({ kind: 'no_date' }, [UNDATED]));

    expect(screen.getByText(SAYS.noDate)).toBeInTheDocument();
    expect(screen.getByText('Day 3')).toBeInTheDocument();
    // One day is a label, not a choice.
    expect(screen.queryByRole('button', { name: 'Day 3' })).not.toBeInTheDocument();
  });

  it('FE-PADDLE-WIND-003: a tour without a start point says so, under the date of its day', () => {
    renderCard(windOf({ kind: 'no_place' }));

    expect(screen.getByText(SAYS.noPlace)).toBeInTheDocument();
    expect(screen.getByText(dateLabel('2026-07-08'))).toBeInTheDocument();
  });

  it('FE-PADDLE-WIND-004: while the forecast loads it holds a placeholder and no figures', () => {
    renderCard(windOf({ kind: 'loading' }));

    expect(screen.getByTestId('paddle-wind-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('paddle-wind-mean')).not.toBeInTheDocument();
    expect(screen.queryByTestId('paddle-wind-hours')).not.toBeInTheDocument();
  });

  it('FE-PADDLE-WIND-005: offline it says there is no forecast without a connection and offers no retry', () => {
    renderCard(windOf({ kind: 'offline' }));

    expect(screen.getByText(SAYS.offline)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('paddle-wind-loading')).not.toBeInTheDocument();
  });

  it('FE-PADDLE-WIND-006: a failed request is a warning whose Try again asks once more', () => {
    renderCard(windOf({ kind: 'error' }));

    const notice = screen.getByText(SAYS.error);
    expect(notice.closest('.bg-warning-soft')).not.toBeNull();
    fireEvent.click(within(notice).getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('FE-PADDLE-WIND-007: a day already gone says a forecast exists only for days to come and shows no figures', () => {
    renderCard(windOf(ready(forecastOf({ status: 'past', timezone: null, day: null }))));

    expect(screen.getByText(SAYS.past)).toBeInTheDocument();
    expect(screen.queryByTestId('paddle-wind-mean')).not.toBeInTheDocument();
    expect(screen.queryByTestId('paddle-wind-hours')).not.toBeInTheDocument();
  });

  it('FE-PADDLE-WIND-008: a day beyond the forecast names the first day its forecast can be had', () => {
    const later = forecastOf({ status: 'beyond_horizon', date: '2027-03-20', timezone: null, day: null });
    renderCard(windOf(ready(later)));

    // Sixteen days, today included, reach the 20th from the 5th on.
    const notice = `No forecast for this day yet. It comes from ${dateLabel('2027-03-05')}.`;
    expect(screen.getByText(notice)).toBeInTheDocument();
    expect(screen.queryByTestId('paddle-wind-mean')).not.toBeInTheDocument();
  });

  it('FE-PADDLE-WIND-009: a forecast shows the direction, the mean and the gusts of the day, the legend and its source', async () => {
    renderCard(windOf(ready(forecastOf())));

    const direction = screen.getByTestId('paddle-wind-direction');
    expect(direction).toHaveTextContent(/^SW$/);
    // From the south west, so the arrow turns half round and points the way the wind blows.
    expect(direction.querySelector('svg')?.style.transform).toBe('rotate(405deg)');
    const mean = screen.getByTestId('paddle-wind-mean');
    expect(within(mean).getByText('Mean')).toBeInTheDocument();
    expect(within(mean).getByText('18 km/h')).toBeInTheDocument();
    const gusts = screen.getByTestId('paddle-wind-gusts');
    expect(within(gusts).getByText('Gusts')).toBeInTheDocument();
    expect(within(gusts).getByText('32 km/h')).toBeInTheDocument();
    expect(screen.getByText('Mean wind')).toBeInTheDocument();
    expect(screen.getByText(`Open-Meteo, ${FETCHED_TIME}, forecast at the start`)).toBeInTheDocument();
    expect(screen.queryByTestId('paddle-wind-loading')).not.toBeInTheDocument();

    expect(await tooltipOf(direction)).toBe('Wind from SW, the direction it blows from most of the day');
    expect(await tooltipOf(mean)).toBe('The strongest hourly mean wind of the day');
    expect(await tooltipOf(gusts)).toBe('The strongest gust of the day');
  });

  it('FE-PADDLE-WIND-010: the hours from 6 to 21 are columns, scaled to the strongest gust among them', async () => {
    renderCard(windOf(ready(forecastOf({ hours: HOURS }))));

    const strip = screen.getByTestId('paddle-wind-hours');
    expect(Array.from(strip.children, (column) => column.textContent)).toEqual(['6', '7', '9', '10', '12', '21']);

    // The 40 km/h gusts at noon set the scale; the 80 at 22:00 lie outside the strip and do not.
    const noon = hourColumn(12);
    expect(barHeight(noon, 'mean')).toBe('50%');
    expect(barHeight(noon, 'gusts')).toBe('100%');
    // From the west, so the arrow points east.
    expect(noon.querySelector('svg')?.style.transform).toBe('rotate(450deg)');
    expect(await tooltipOf(noon)).toBe('12:00: 20 km/h, gusts 40 km/h, from W');

    // A mean without gusts or a direction draws its bar alone and says what it lacks.
    const meanOnly = hourColumn(10);
    expect(barHeight(meanOnly, 'mean')).toBe('25%');
    expect(barHeight(meanOnly, 'gusts')).toBeUndefined();
    expect(meanOnly.querySelector('svg')).toBeNull();
    expect(await tooltipOf(meanOnly)).toBe(`10:00: 10 km/h, gusts ${NONE} km/h, from ${NONE}`);
  });

  it('FE-PADDLE-WIND-011: an hour the source left out stays an empty column, while a calm hour is a figure', async () => {
    renderCard(windOf(ready(forecastOf({ hours: HOURS }))));

    const unknown = hourColumn(9);
    expect(barHeight(unknown, 'mean')).toBeUndefined();
    expect(barHeight(unknown, 'gusts')).toBeUndefined();
    expect(unknown.querySelector('.border-dashed')).not.toBeNull();
    expect(unknown.querySelector('svg')).toBeNull();
    expect(await tooltipOf(unknown)).toBe('9:00: no value');

    // 0 km/h from the north is a measured calm: a sliver of a bar and an arrow, no dashed outline.
    const calm = hourColumn(7);
    expect(barHeight(calm, 'mean')).toBe('4%');
    expect(barHeight(calm, 'gusts')).toBe('4%');
    expect(calm.querySelector('.border-dashed')).toBeNull();
    expect(calm.querySelector('svg')?.style.transform).toBe('rotate(180deg)');
    expect(await tooltipOf(calm)).toBe('7:00: 0 km/h, gusts 0 km/h, from N');
  });

  it('FE-PADDLE-WIND-012: a light day is drawn against 10 km/h at least, so a breeze never fills its column', () => {
    renderCard(windOf(ready(forecastOf({ hours: [hourOf(8, 5, null, 90)] }))));

    expect(barHeight(hourColumn(8), 'mean')).toBe('50%');
  });

  it('FE-PADDLE-WIND-013: a day figure the source left out reads as a dash, never as calm; a real calm reads 0 km/h', () => {
    const blank = forecastOf({
      day: { speed_max_kmh: null, gusts_max_kmh: null, direction_dominant_deg: null },
      hours: [hourOf(9, null, null, null)],
    });
    const { rerender } = renderCard(windOf(ready(blank)));

    expect(within(screen.getByTestId('paddle-wind-mean')).getByText(NONE)).toBeInTheDocument();
    expect(within(screen.getByTestId('paddle-wind-gusts')).getByText(NONE)).toBeInTheDocument();
    expect(screen.queryByTestId('paddle-wind-direction')).not.toBeInTheDocument();
    expect(screen.getByTestId('paddle-wind-card')).not.toHaveTextContent('km/h');

    // A forecast without day figures at all reads the same.
    rerender(<PaddleWindCard wind={windOf(ready(forecastOf({ day: null })))} />);
    expect(within(screen.getByTestId('paddle-wind-mean')).getByText(NONE)).toBeInTheDocument();
    expect(within(screen.getByTestId('paddle-wind-gusts')).getByText(NONE)).toBeInTheDocument();
    expect(screen.getByTestId('paddle-wind-card')).not.toHaveTextContent('km/h');

    const calm = forecastOf({ day: { speed_max_kmh: 0, gusts_max_kmh: 0, direction_dominant_deg: 0 } });
    rerender(<PaddleWindCard wind={windOf(ready(calm))} />);
    expect(within(screen.getByTestId('paddle-wind-mean')).getByText('0 km/h')).toBeInTheDocument();
    expect(within(screen.getByTestId('paddle-wind-gusts')).getByText('0 km/h')).toBeInTheDocument();
    expect(screen.getByTestId('paddle-wind-direction')).toHaveTextContent(/^N$/);
  });

  it('FE-PADDLE-WIND-014: a tour on two days offers each as a button, marks the one shown and asks for the other', () => {
    const { rerender } = renderCard(windOf(ready(forecastOf()), [JULY_8, JULY_9], JULY_9));

    const second = screen.getByRole('button', { name: 'Day 2' });
    expect(second).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Day 4' })).toHaveAttribute('aria-pressed', 'true');
    // The buttons stand in for the date pill a single day gets.
    expect(screen.queryByText(dateLabel('2026-07-09'))).not.toBeInTheDocument();

    fireEvent.click(second);
    expect(chooseDay).toHaveBeenCalledTimes(1);
    expect(chooseDay).toHaveBeenCalledWith(11);

    // The card follows the day the hook shows.
    rerender(<PaddleWindCard wind={windOf(ready(forecastOf()), [JULY_8, JULY_9], JULY_8)} />);
    expect(screen.getByRole('button', { name: 'Day 2' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Day 4' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('FE-PADDLE-WIND-015: the hints for paddlers fold out and back in', () => {
    renderCard(windOf({ kind: 'offline' }));

    const toggle = screen.getByRole('button', { name: 'What wind means for paddling' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(HINTS);

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});

describe('PaddleWindSection', () => {
  it('FE-PADDLE-WIND-016: asks the wind for its tour and start and shows the card for the answer', () => {
    hook.useTourWind.mockReturnValue(windOf({ kind: 'offline' }));

    render(<PaddleWindSection placeId={7} start={{ lat: 47.05, lng: 8.31 }} />);

    expect(hook.useTourWind).toHaveBeenCalledWith(7, { lat: 47.05, lng: 8.31 });
    expect(screen.getByRole('region', { name: 'Wind' })).toHaveTextContent(SAYS.offline);
  });
});

describe('FigureBadge', () => {
  it('FE-PADDLE-FIGURE-001: holds a label and a value; the warning tone colours the value alone', () => {
    const { rerender } = render(<FigureBadge testId="figure" label="Height" value="1.2 m" tone="warning" />);

    expect(within(screen.getByTestId('figure')).getByText('Height')).not.toHaveClass('text-warning');
    expect(screen.getByText('1.2 m').parentElement).toHaveClass('text-warning');

    // Without a label the badge holds its value alone, in the neutral tone.
    rerender(<FigureBadge testId="figure" value="Private" />);
    expect(screen.getByTestId('figure')).toHaveTextContent(/^Private$/);
    expect(screen.getByText('Private').parentElement).toHaveClass('text-content');
    expect(screen.getByText('Private').parentElement).not.toHaveClass('text-warning');
  });

  it('FE-PADDLE-FIGURE-002: only a badge with an info opens a tooltip', async () => {
    render(
      <>
        <FigureBadge testId="plain" value="Private" />
        <FigureBadge testId="explained" label="Access" value="No" info="Recorded as private on OpenStreetMap" />
      </>
    );

    // Both are hovered: had the plain badge a tooltip of its own, it would still be open afterwards.
    fireEvent.mouseEnter(screen.getByTestId('plain'));
    expect(await tooltipOf(screen.getByTestId('explained'))).toBe('Recorded as private on OpenStreetMap');
    expect(screen.queryAllByRole('tooltip')).toHaveLength(0);
  });
});
