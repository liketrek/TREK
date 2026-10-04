// FE-PLANNER-BKTIMELINEVIEW-001 to FE-PLANNER-BKTIMELINEVIEW-016
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '../../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { buildDay, buildReservation } from '../../../../tests/helpers/factories';
import { useSettingsStore } from '../../../store/settingsStore';
import type { Day, Reservation, ReservationEndpoint } from '../../../types';
import { bookingFacts } from './bookingFacts';
import BookingsTimeline, { type BookingsTimelineProps } from './BookingsTimeline';

function ep(over: Partial<ReservationEndpoint>): ReservationEndpoint {
  return { role: 'from', sequence: 0, name: 'Stop', code: null, lat: 1, lng: 1, timezone: null, local_time: null, local_date: null, ...over };
}

// The lanes are laid out from the width the observer reports; jsdom has no layout, so this one reports a wide screen.
let reportedWidth = 1400;
class WideObserver {
  constructor(private cb: ResizeObserverCallback) {}
  observe() { this.cb([{ contentRect: { width: reportedWidth } } as ResizeObserverEntry], this as unknown as ResizeObserver); }
  unobserve() {}
  disconnect() {}
}

const d1 = buildDay({ id: 801, day_number: 1, date: '2025-06-01', title: 'Arrival' });
const d2 = buildDay({ id: 802, day_number: 2, date: '2025-06-02', title: null });
const d3 = buildDay({ id: 803, day_number: 3, date: '2025-06-03', title: null });
const days: Day[] = [d1, d2, d3];

const flight = buildReservation({
  id: 8801, type: 'flight', title: 'LH 716', status: 'confirmed', reservation_time: '2025-06-01T08:00', reservation_end_time: '2025-06-01T12:00',
  location: 'Frankfurt',
  endpoints: [ep({ role: 'from', name: 'Frankfurt', code: 'FRA' }), ep({ role: 'to', sequence: 1, name: 'Haneda', code: 'HND' })],
});
const train = buildReservation({ id: 8802, type: 'train', title: 'Shinkansen', status: 'pending', reservation_time: '2025-06-02T09:00', reservation_end_time: '2025-06-02T11:30' });
const early = buildReservation({ id: 8803, type: 'restaurant', title: 'Farewell dinner', reservation_time: '2025-05-20T19:00' });
const late = buildReservation({ id: 8804, type: 'tour', title: 'Bonus tour', status: 'pending', reservation_time: '2025-07-01T10:00' });
const loose = buildReservation({ id: 8805, type: 'transit', title: 'Metro ride' });

const factsOf = (r: Reservation) => bookingFacts(r, {
  t: (k, p) => (p && 'n' in p ? `Day ${p.n}` : k), locale: 'en-US', timeFormat: '24h', days, assignmentLookup: {}, tripCurrency: 'EUR', hasLinkedCost: false,
});

const onSelect = vi.fn();
const onZoom = vi.fn();

function renderTimeline(props: Partial<BookingsTimelineProps> = {}) {
  return render(
    <BookingsTimeline
      items={[flight, train]}
      context={[]}
      contextLabel="Bookings"
      days={days}
      zoom="trip"
      onZoom={onZoom}
      byType
      showContext
      selectedId={null}
      onSelect={onSelect}
      factsOf={factsOf}
      {...props}
    />,
  );
}

beforeEach(() => {
  resetAllStores();
  seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, time_format: '24h', language: 'en' } });
  reportedWidth = 1400;
  vi.stubGlobal('ResizeObserver', WideObserver);
  onSelect.mockClear();
  onZoom.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('BookingsTimeline: trip view', () => {
  it('FE-PLANNER-BKTIMELINEVIEW-001: states the trip\'s range and length, with one lane per type', () => {
    renderTimeline();
    expect(screen.getByText('Jun 1 → Jun 3')).toBeInTheDocument();
    expect(screen.getByText('3 days')).toBeInTheDocument();
    expect(screen.getByText('Flight')).toBeInTheDocument();
    expect(screen.getByText('Train')).toBeInTheDocument();
  });

  it('FE-PLANNER-BKTIMELINEVIEW-002: a bar is a button named by its booking that selects it', async () => {
    renderTimeline();
    await userEvent.click(screen.getByRole('button', { name: 'LH 716' }));
    expect(onSelect).toHaveBeenCalledWith(flight);
  });

  it('FE-PLANNER-BKTIMELINEVIEW-003: without lanes per type everything shares one lane', () => {
    renderTimeline({ byType: false });
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.queryByText('Flight')).toBeNull();
    expect(screen.getByRole('button', { name: 'Shinkansen' })).toBeInTheDocument();
  });

  it('FE-PLANNER-BKTIMELINEVIEW-004: a day head opens that day by the hour', async () => {
    renderTimeline();
    await userEvent.click(screen.getByRole('button', { name: /Day 2/ }));
    expect(onZoom).toHaveBeenCalledWith('day');
  });

  it('FE-PLANNER-BKTIMELINEVIEW-005: the zoom switch reports trip and day', async () => {
    renderTimeline();
    const zoom = screen.getByRole('group', { name: 'Zoom' });
    expect(within(zoom).getByRole('button', { name: 'Trip' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(within(zoom).getByRole('button', { name: 'Day' }));
    await userEvent.click(within(zoom).getByRole('button', { name: 'Trip' }));
    expect(onZoom.mock.calls).toEqual([['day'], ['trip']]);
  });

  it('FE-PLANNER-BKTIMELINEVIEW-006: what the axis cannot place waits below, grouped, and selects on click', async () => {
    renderTimeline({ items: [flight, early, late, loose], selectedId: 8805 });
    expect(screen.getByText('Before the trip')).toBeInTheDocument();
    expect(screen.getByText('After the trip')).toBeInTheDocument();
    expect(screen.getByText('No date')).toBeInTheDocument();
    const metro = screen.getByRole('button', { name: /Metro ride/ });
    expect(metro).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Bonus tour/ })).toHaveTextContent('Tour, Pending');
    expect(screen.getByRole('button', { name: /Farewell dinner/ })).toHaveTextContent('Restaurant, Confirmed');
    await userEvent.click(screen.getByRole('button', { name: /Farewell dinner/ }));
    expect(onSelect).toHaveBeenCalledWith(early);
  });

  it('FE-PLANNER-BKTIMELINEVIEW-007: nothing dated says so', () => {
    renderTimeline({ items: [loose] });
    expect(screen.getByText('None of these has a date yet.')).toBeInTheDocument();
  });

  it('FE-PLANNER-BKTIMELINEVIEW-008: the other tab shows as a dimmed lane, only while asked for', () => {
    const hotel = buildReservation({ id: 8806, type: 'hotel', title: 'Ryokan', accommodation_start_day_id: 801, accommodation_end_day_id: 803 });
    const { rerender } = renderTimeline({ context: [hotel], contextLabel: 'Bookings' });
    expect(screen.getByText('Bookings')).toBeInTheDocument();
    expect(screen.getByText('Ryokan')).toBeInTheDocument();
    rerender(
      <BookingsTimeline items={[flight]} context={[hotel]} contextLabel="Bookings" days={days} zoom="trip" onZoom={onZoom}
        byType showContext={false} selectedId={null} onSelect={onSelect} factsOf={factsOf} />,
    );
    expect(screen.queryByText('Ryokan')).toBeNull();
  });

  it('FE-PLANNER-BKTIMELINEVIEW-009: resting on a bar shows what it holds, leaving hides it', async () => {
    renderTimeline();
    const bar = screen.getByRole('button', { name: 'LH 716' });
    fireEvent.mouseEnter(bar);
    const card = screen.getByRole('tooltip');
    expect(card).toHaveTextContent('LH 716');
    expect(card).toHaveTextContent('Flight, Confirmed');
    expect(card).toHaveTextContent('08:00 → 12:00');
    expect(card).toHaveTextContent('FRA → HND');
    expect(card).toHaveTextContent('Frankfurt');
    fireEvent.mouseLeave(bar);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('FE-PLANNER-BKTIMELINEVIEW-010: the focus shows the same card, near the bottom of the window above the bar', () => {
    renderTimeline();
    const bar = screen.getByRole('button', { name: 'Shinkansen' });
    vi.spyOn(bar, 'getBoundingClientRect').mockReturnValue({ top: 700, bottom: 740, left: 5000, right: 5100, width: 100, height: 40, x: 5000, y: 700, toJSON: () => ({}) } as DOMRect);
    fireEvent.focus(bar);
    const card = screen.getByRole('tooltip');
    expect(card).toHaveTextContent('Train, Pending');
    expect(card.style.transform).toBe('translateY(-100%)');
    fireEvent.blur(bar);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('FE-PLANNER-BKTIMELINEVIEW-011: on a trip without dates the days are counted, not dated', () => {
    const a = buildDay({ id: 811, day_number: 1, date: null });
    const b = buildDay({ id: 812, day_number: 2, date: null });
    const bus = buildReservation({ id: 8807, type: 'bus', title: 'Night bus', reservation_time: '21:00', day_id: 812 });
    reportedWidth = 0;
    renderTimeline({ days: [a, b], items: [bus] });
    expect(screen.queryByText(/days$/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Night bus' })).toBeInTheDocument();
    // Too narrow for "Day 2", so the head keeps only the number.
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
  });
});

describe('BookingsTimeline: day view', () => {
  it('FE-PLANNER-BKTIMELINEVIEW-012: opens on the first day with something on it, and walks the days', async () => {
    renderTimeline({ zoom: 'day', items: [train] });
    expect(screen.getByText('Day 2')).toBeInTheDocument();
    expect(screen.getByText('Mon, Jun 2')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    expect(screen.getByText('Arrival')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous day' })).toBeDisabled();
    expect(screen.getByText('Nothing on this day.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next day' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next day' }));
    expect(screen.getByRole('button', { name: 'Next day' })).toBeDisabled();
  });

  it('FE-PLANNER-BKTIMELINEVIEW-013: a detailed bar carries its times and route', () => {
    renderTimeline({ zoom: 'day', items: [flight] });
    const bar = screen.getByRole('button', { name: 'LH 716' });
    expect(bar).toHaveTextContent('LH 716');
    expect(bar).toHaveTextContent('08:00 → 12:00 FRA → HND');
  });

  it('FE-PLANNER-BKTIMELINEVIEW-014: a bar running past the day in view marks the cut', () => {
    const rental = buildReservation({ id: 8808, type: 'car', title: 'Rental', reservation_time: '2025-06-01T10:00', reservation_end_time: '2025-06-03T10:00' });
    renderTimeline({ zoom: 'day', items: [rental] });
    expect(screen.getByRole('button', { name: 'Rental' }).querySelectorAll('svg').length).toBeGreaterThanOrEqual(2);
  });

  it('FE-PLANNER-BKTIMELINEVIEW-015: during the trip the day view opens on today, marks now and offers a way back', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2025, 5, 3, 14, 30));
    renderTimeline({ zoom: 'day', items: [flight, train] });
    expect(screen.getByText('now')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    await userEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(screen.getByText('now')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
  });

  it('FE-PLANNER-BKTIMELINEVIEW-016: a long trip scrolls in the trip view, and Today scrolls to now', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2025, 5, 20, 9, 0));
    const many = Array.from({ length: 30 }, (_, i) => buildDay({ id: 900 + i, day_number: i + 1, date: `2025-06-${String(i + 1).padStart(2, '0')}` }));
    reportedWidth = 600;
    const original = Element.prototype.scrollTo;
    const scrollTo = vi.fn();
    Element.prototype.scrollTo = scrollTo as unknown as typeof Element.prototype.scrollTo;
    try {
      renderTimeline({ days: many, items: [flight] });
      await userEvent.click(screen.getByRole('button', { name: 'Today' }));
      expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }));
    } finally {
      Element.prototype.scrollTo = original;
    }
  });
});
