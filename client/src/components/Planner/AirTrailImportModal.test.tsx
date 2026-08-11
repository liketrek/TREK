// FE-PLANNER-AIRTRAIL-001 to FE-PLANNER-AIRTRAIL-008
import { render, screen, waitFor } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser, buildTrip, buildReservation } from '../../../tests/helpers/factories';
import type { AirtrailFlight } from '@trek/shared';
import AirTrailImportModal, { detectConnections } from './AirTrailImportModal';

const flight = (over: Partial<AirtrailFlight> = {}): AirtrailFlight => ({
  id: '101',
  fromCode: 'BRU',
  fromName: 'Brussels',
  toCode: 'HEL',
  toName: 'Helsinki-Vantaa',
  date: '2026-08-01',
  departure: '2026-08-01T06:00:00.000+00:00',
  arrival: '2026-08-01T09:30:00.000+00:00',
  airline: 'Finnair',
  flightNumber: 'AY1502',
  aircraft: null,
  seatClass: 'economy',
  ...over,
});

const legHelJfk = (): AirtrailFlight =>
  flight({
    id: '102',
    fromCode: 'HEL',
    fromName: 'Helsinki-Vantaa',
    toCode: 'JFK',
    toName: 'John F. Kennedy Intl.',
    departure: '2026-08-01T11:00:00.000+00:00',
    arrival: '2026-08-01T19:00:00.000+00:00',
    flightNumber: 'AY15',
  });

const unrelatedFlight = (): AirtrailFlight =>
  flight({
    id: '103',
    fromCode: 'LHR',
    fromName: 'London Heathrow',
    toCode: 'JFK',
    toName: 'John F. Kennedy Intl.',
    date: '2026-08-05',
    departure: '2026-08-05T10:00:00.000+00:00',
    arrival: '2026-08-05T18:00:00.000+00:00',
    flightNumber: 'BA117',
  });

describe('detectConnections (#1535)', () => {
  it('FE-PLANNER-AIRTRAIL-001: chains flights that connect at the same airport within 24h', () => {
    const chains = detectConnections([legHelJfk(), flight(), unrelatedFlight()]);
    expect(chains).toHaveLength(1);
    expect(chains[0].map(f => f.id)).toEqual(['101', '102']);
  });

  it('FE-PLANNER-AIRTRAIL-002: does not chain when the layover exceeds 24h', () => {
    const late = { ...legHelJfk(), date: '2026-08-03', departure: '2026-08-03T11:00:00.000+00:00', arrival: '2026-08-03T19:00:00.000+00:00' };
    expect(detectConnections([flight(), late])).toHaveLength(0);
  });

  it('FE-PLANNER-AIRTRAIL-003: skips flights without instants instead of guessing', () => {
    expect(detectConnections([flight({ departure: null, arrival: null }), legHelJfk()])).toHaveLength(0);
  });

  it('FE-PLANNER-AIRTRAIL-009: does not chain an out-and-back return into a bogus connection', () => {
    const returnFlight = flight({
      id: '105',
      fromCode: 'HEL',
      fromName: 'Helsinki-Vantaa',
      toCode: 'BRU',
      toName: 'Brussels',
      departure: '2026-08-01T18:00:00.000+00:00',
      arrival: '2026-08-01T21:30:00.000+00:00',
      flightNumber: 'AY1503',
    });
    expect(detectConnections([flight(), returnFlight])).toHaveLength(0);
  });
});

describe('AirTrailImportModal', () => {
  const defaultProps = { isOpen: true, onClose: vi.fn(), tripId: 1 };

  beforeEach(() => {
    resetAllStores();
    seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
    seedStore(useTripStore, {
      trip: buildTrip({ id: 1, start_date: '2026-08-01', end_date: '2026-08-10' }),
      reservations: [],
    });
    server.use(
      http.get('/api/integrations/airtrail/flights', () =>
        HttpResponse.json({ flights: [flight(), legHelJfk(), unrelatedFlight()] }),
      ),
      http.get('/api/trips/1/reservations', () => HttpResponse.json({ reservations: [] })),
    );
  });

  it('FE-PLANNER-AIRTRAIL-011: opens after being mounted closed (#1602)', async () => {
    // The modal stays mounted with isOpen=false until the AirTrail button is
    // clicked — every hook must run on the closed renders too, or the open
    // render throws "Rendered more hooks than during the previous render".
    const { rerender } = render(<AirTrailImportModal {...defaultProps} isOpen={false} />);
    rerender(<AirTrailImportModal {...defaultProps} isOpen={true} />);
    expect(await screen.findByText('Import from AirTrail')).toBeInTheDocument();
  });

  it('FE-PLANNER-AIRTRAIL-004: offers to join a detected connection, on by default', async () => {
    render(<AirTrailImportModal {...defaultProps} />);
    const joinRow = await screen.findByText(/one flight with a layover in HEL/i);
    expect(joinRow).toBeInTheDocument();
    // No join offer for the unrelated flight.
    expect(screen.queryByText(/layover in JFK/i)).not.toBeInTheDocument();
  });

  it('FE-PLANNER-AIRTRAIL-005: sends the chain as a connection on import', async () => {
    const user = userEvent.setup();
    let body: any = null;
    server.use(
      http.post('/api/trips/1/reservations/import/airtrail', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ imported: body.flightIds, skipped: [] });
      }),
    );
    render(<AirTrailImportModal {...defaultProps} />);
    await screen.findByText(/one flight with a layover in HEL/i);
    await user.click(screen.getByRole('button', { name: /Import 3/i }));
    await waitFor(() => expect(body).not.toBeNull());
    expect([...body.flightIds].sort()).toEqual(['101', '102', '103']);
    expect(body.connections).toEqual([['101', '102']]);
  });

  it('FE-PLANNER-AIRTRAIL-006: sends no connection when the join is toggled off', async () => {
    const user = userEvent.setup();
    let body: any = null;
    server.use(
      http.post('/api/trips/1/reservations/import/airtrail', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ imported: body.flightIds, skipped: [] });
      }),
    );
    render(<AirTrailImportModal {...defaultProps} />);
    await user.click(await screen.findByText(/one flight with a layover in HEL/i));
    await user.click(screen.getByRole('button', { name: /Import 3/i }));
    await waitFor(() => expect(body).not.toBeNull());
    expect(body.connections).toBeUndefined();
  });

  it('FE-PLANNER-AIRTRAIL-007: re-enabling the join selects all of its legs', async () => {
    const user = userEvent.setup();
    render(<AirTrailImportModal {...defaultProps} />);
    const joinRow = await screen.findByText(/one flight with a layover in HEL/i);
    // Deselect one member — the join reads unchecked, one click brings both back.
    await user.click(screen.getByText('Finnair AY15'));
    expect(screen.getByRole('button', { name: /Import 2/i })).toBeInTheDocument();
    await user.click(joinRow);
    expect(screen.getByRole('button', { name: /Import 3/i })).toBeInTheDocument();
  });

  it('FE-PLANNER-AIRTRAIL-010: a surviving sub-chain keeps its join offer when a later leg was already imported', async () => {
    const legJfkLax = flight({
      id: '106',
      fromCode: 'JFK',
      fromName: 'John F. Kennedy Intl.',
      toCode: 'LAX',
      toName: 'Los Angeles Intl.',
      departure: '2026-08-01T21:00:00.000+00:00',
      arrival: '2026-08-02T00:30:00.000+00:00',
      flightNumber: 'AY99',
    });
    seedStore(useTripStore, {
      trip: buildTrip({ id: 1, start_date: '2026-08-01', end_date: '2026-08-10' }),
      reservations: [
        buildReservation({ type: 'flight', external_source: 'airtrail', external_id: '106' }) as any,
      ],
    });
    server.use(
      http.get('/api/integrations/airtrail/flights', () =>
        HttpResponse.json({ flights: [flight(), legHelJfk(), legJfkLax] }),
      ),
    );
    render(<AirTrailImportModal {...defaultProps} />);
    // BRU→HEL→JFK still connects even though JFK→LAX is gone from the pool.
    expect(await screen.findByText(/one flight with a layover in HEL/i)).toBeInTheDocument();
    expect(screen.getByText(/^Imported$/)).toBeInTheDocument();
  });

  it('FE-PLANNER-AIRTRAIL-008: legs of a joined import are marked imported via metadata.airtrail_ids', async () => {
    seedStore(useTripStore, {
      trip: buildTrip({ id: 1, start_date: '2026-08-01', end_date: '2026-08-10' }),
      reservations: [
        buildReservation({
          type: 'flight',
          external_source: 'airtrail',
          external_id: '101',
          metadata: JSON.stringify({ airtrail_ids: ['101', '102'] }),
        }) as any,
      ],
    });
    render(<AirTrailImportModal {...defaultProps} />);
    await screen.findByText('Finnair AY1502');
    // Both legs disabled — including the one whose id only lives in the metadata.
    expect(screen.getAllByText(/^Imported$/)).toHaveLength(2);
    // A chain with an imported member cannot be joined again.
    expect(screen.queryByText(/one flight with a layover/i)).not.toBeInTheDocument();
  });
});
