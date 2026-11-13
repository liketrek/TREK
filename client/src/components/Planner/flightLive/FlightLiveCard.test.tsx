// FE-PLANNER-FLIGHTLIVE-001 to FE-PLANNER-FLIGHTLIVE-008
import type { FlightLiveLeg } from '@trek/shared';
import { beforeEach, describe, expect, it } from 'vitest';

import { render, screen } from '../../../../tests/helpers/render';
import MFlightLiveStrip, { MPlanFlightLine } from '../../../mobile/screens/trip/MFlightLiveStrip';
import MFlightLiveCard from '../../../mobile/screens/trip/sheets/MFlightLiveCard';
import { legKey, useFlightLiveStore } from '../../../store/flightLiveStore';
import type { Reservation } from '../../../types';
import FlightArc from './FlightArc';
import FlightLiveCard from './FlightLiveCard';
import FlightLiveStrip, { PlanFlightLiveLine } from './FlightLiveStrip';

const H = 3_600_000;

function leg(over: Partial<FlightLiveLeg> = {}): FlightLiveLeg {
  const now = Date.now();
  return {
    reservation_id: 6,
    leg_index: 0,
    callsign: 'DLH400',
    flight_number: 'LH 400',
    service_date: '2026-06-11',
    origin: { code: 'FRA', name: 'Frankfurt', lat: 50.03, lng: 8.57, timezone: 'Europe/Berlin' },
    destination: { code: 'JFK', name: 'New York JFK', lat: 40.64, lng: -73.78, timezone: 'America/New_York' },
    phase: 'airborne',
    scheduled_departure: new Date(now - 3 * H).toISOString(),
    scheduled_arrival: new Date(now + 5 * H).toISOString(),
    departed_at: new Date(now - 3 * H + 40 * 60_000).toISOString(),
    landed_at: null,
    estimated_arrival: new Date(now + 5 * H + 35 * 60_000).toISOString(),
    departure_delay_min: 40,
    arrival_delay_min: 35,
    progress: 0.4,
    distance_total_km: 6200,
    distance_remaining_km: 3720,
    position: {
      lat: 55,
      lng: -20,
      altitude_ft: 37000,
      ground_speed_kt: 470,
      track_deg: 285,
      vertical_rate_fpm: 0,
      on_ground: false,
    },
    aircraft: { registration: 'D-AIXA', type: 'A359' },
    last_seen_at: new Date(now - 60_000).toISOString(),
    fetched_at: new Date(now - 30_000).toISOString(),
    stale: false,
    source: 'adsb.lol',
    ...over,
  };
}

function seed(...legs: FlightLiveLeg[]) {
  useFlightLiveStore.setState({
    trips: {
      1: {
        enabled: true,
        attribution: 'Live positions: adsb.lol (ODbL)',
        legs: Object.fromEntries(legs.map((l) => [legKey(l.reservation_id, l.leg_index), l])),
      },
    },
  });
}

beforeEach(() => useFlightLiveStore.setState({ trips: {} }));

describe('FlightLiveCard', () => {
  it('FE-PLANNER-FLIGHTLIVE-001: shows the moment, both airports, the delay and the numbers in the air', () => {
    seed(leg());
    render(<FlightLiveCard tripId={1} reservationId={6} legIndex={0} />);
    expect(screen.getByText('In the air')).toBeInTheDocument();
    expect(screen.getByText('FRA')).toBeInTheDocument();
    expect(screen.getByText('JFK')).toBeInTheDocument();
    expect(screen.getByText('+35 min')).toBeInTheDocument();
    expect(screen.getByText('Altitude')).toBeInTheDocument();
    expect(screen.getByText('A359 D-AIXA')).toBeInTheDocument();
    expect(screen.getByText('Live positions: adsb.lol (ODbL)')).toBeInTheDocument();
  });

  it('FE-PLANNER-FLIGHTLIVE-002: renders nothing while TREK follows no state for the leg', () => {
    const { container } = render(<FlightLiveCard tripId={1} reservationId={6} legIndex={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-PLANNER-FLIGHTLIVE-003: counts down to departure and labels a leg of a longer booking', () => {
    const now = Date.now();
    seed(
      leg({
        phase: 'scheduled',
        scheduled_departure: new Date(now + 26 * H).toISOString(),
        departed_at: null,
        estimated_arrival: null,
        position: null,
        progress: null,
        departure_delay_min: null,
        arrival_delay_min: null,
        aircraft: null,
        last_seen_at: null,
      })
    );
    render(<FlightLiveCard tripId={1} reservationId={6} legIndex={0} legLabel="Flight 1 of 2" />);
    expect(screen.getByText(/Departs in 1 d 2 h/)).toBeInTheDocument();
    expect(screen.getByText('Flight 1 of 2')).toBeInTheDocument();
    expect(screen.queryByText('Altitude')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-FLIGHTLIVE-004: explains a flight the feed cannot find, and the missing gate only around boarding', () => {
    seed(
      leg({
        phase: 'unknown',
        position: null,
        progress: null,
        departure_delay_min: null,
        arrival_delay_min: null,
        last_seen_at: null,
      })
    );
    const { unmount } = render(<FlightLiveCard tripId={1} reservationId={6} legIndex={0} />);
    expect(screen.getByText('No live data')).toBeInTheDocument();
    expect(screen.queryByText(/Gate, terminal and baggage belt/)).not.toBeInTheDocument();
    // Nothing heard, so the feed is not credited either.
    expect(screen.queryByText('Live positions: adsb.lol (ODbL)')).not.toBeInTheDocument();
    unmount();
    const now = Date.now();
    seed(
      leg({
        phase: 'scheduled',
        scheduled_departure: new Date(now + H).toISOString(),
        departed_at: null,
        position: null,
        progress: null,
        departure_delay_min: null,
        arrival_delay_min: null,
        last_seen_at: null,
      })
    );
    render(<FlightLiveCard tripId={1} reservationId={6} legIndex={0} />);
    expect(screen.getByText(/Gate, terminal and baggage belt/)).toBeInTheDocument();
  });
});

describe('MFlightLiveCard', () => {
  it('FE-PLANNER-FLIGHTLIVE-005: lays out the same moment for the phone', () => {
    seed(leg());
    render(<MFlightLiveCard tripId={1} reservationId={6} legIndex={0} />);
    expect(screen.getByText('In the air')).toBeInTheDocument();
    expect(screen.getByText('+35 min')).toBeInTheDocument();
    expect(screen.getByText('JFK')).toBeInTheDocument();
  });
});

describe('strips and plan lines', () => {
  it('FE-PLANNER-FLIGHTLIVE-006: the card strips speak for the leg in the air in one line', () => {
    seed(leg());
    render(
      <>
        <FlightLiveStrip tripId={1} reservationId={6} />
        <MFlightLiveStrip tripId={1} reservationId={6} onOpen={() => {}} />
      </>
    );
    expect(screen.getAllByText(/^In the air, Lands in/)).toHaveLength(2);
  });

  it('FE-PLANNER-FLIGHTLIVE-007: strips and plan lines stay quiet far ahead, and the plan line skips other transports', () => {
    const now = Date.now();
    seed(
      leg({
        phase: 'scheduled',
        scheduled_departure: new Date(now + 26 * H).toISOString(),
        departed_at: null,
        position: null,
        progress: null,
        departure_delay_min: null,
        arrival_delay_min: null,
      })
    );
    const res = { id: 6, type: 'flight' } as Reservation;
    const { container } = render(
      <>
        <FlightLiveStrip tripId={1} reservationId={6} />
        <PlanFlightLiveLine tripId={1} res={res} />
        <MPlanFlightLine tripId={1} reservationId={6} legIndex={0} />
        <PlanFlightLiveLine tripId={1} res={{ ...res, type: 'train' }} />
      </>
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe('FlightArc', () => {
  it('FE-PLANNER-FLIGHTLIVE-008: draws the flown part only once under way, and the aircraft on request', () => {
    const { container, rerender } = render(
      <FlightArc progress={0} showPlane={false} track="#999" flown="#00f" plane="#00f" />
    );
    expect(container.querySelectorAll('path')).toHaveLength(1);
    rerender(<FlightArc progress={0.5} showPlane track="#999" flown="#00f" plane="#00f" />);
    expect(container.querySelectorAll('path')).toHaveLength(3);
  });
});
