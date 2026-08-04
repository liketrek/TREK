// FE-PLANNER-AIRPORTSEL-001 to FE-PLANNER-AIRPORTSEL-022
import { useState } from 'react';
import { delay, http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { render, screen, fireEvent, waitFor, act } from '../../../tests/helpers/render';
import { server } from '../../../tests/helpers/msw/server';
import AirportSelect, { type Airport } from './AirportSelect';

function buildAirport(overrides: Partial<Airport> = {}): Airport {
  return {
    iata: 'FRA',
    icao: 'EDDF',
    name: 'Frankfurt Airport',
    city: 'Frankfurt',
    country: 'DE',
    lat: 50.0333,
    lng: 8.5706,
    tz: 'Europe/Berlin',
    ...overrides,
  };
}

// The component is controlled: `value` feeds the input text and suppresses the
// search for the already-picked label. Driving it through a stateful host
// mirrors how ReservationModal/TransportModal use it.
function Host({ initial = null, onPick }: { initial?: Airport | null; onPick?: (a: Airport | null) => void }) {
  const [value, setValue] = useState<Airport | null>(initial);
  return (
    <AirportSelect
      value={value}
      onChange={(a) => { setValue(a); onPick?.(a); }}
    />
  );
}

/** Let the debounce fire and any in-flight request settle. */
async function settle(ms = 350) {
  await act(async () => { await new Promise((r) => setTimeout(r, ms)); });
}

function airportRoute(handler: (q: string) => Response | Promise<Response>) {
  return http.get('/api/airports/search', ({ request }) => {
    const q = new URL(request.url).searchParams.get('q') || '';
    return handler(q);
  });
}

describe('AirportSelect', () => {
  it('FE-PLANNER-AIRPORTSEL-001: falls back to the translated placeholder', () => {
    render(<AirportSelect value={null} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Airport code or city (e.g. FRA)')).toBeInTheDocument();
  });

  it('FE-PLANNER-AIRPORTSEL-002: an explicit placeholder wins over the default', () => {
    render(<AirportSelect value={null} onChange={vi.fn()} placeholder="Departure airport" />);
    expect(screen.getByPlaceholderText('Departure airport')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Airport code or city (e.g. FRA)')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-AIRPORTSEL-003: an initial value renders as "City (IATA)" with a clear button', () => {
    render(<AirportSelect value={buildAirport()} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('Frankfurt (FRA)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('FE-PLANNER-AIRPORTSEL-004: without a value there is no clear button', () => {
    render(<AirportSelect value={null} onChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-AIRPORTSEL-005: a single character does not reach the API', async () => {
    const user = userEvent.setup();
    const seen: string[] = [];
    server.use(airportRoute((q) => { seen.push(q); return HttpResponse.json([buildAirport()]); }));

    render(<Host />);
    await user.type(screen.getByRole('textbox'), 'F');

    await settle();
    expect(seen).toEqual([]);
    expect(screen.queryByText('Frankfurt Airport · Germany')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-AIRPORTSEL-006: two characters open the dropdown with code, city and country', async () => {
    const user = userEvent.setup();
    server.use(airportRoute(() => HttpResponse.json([buildAirport()])));

    render(<Host />);
    await user.type(screen.getByRole('textbox'), 'FRA');

    expect(await screen.findByText('FRA')).toBeInTheDocument();
    expect(screen.getByText('Frankfurt')).toBeInTheDocument();
    expect(screen.getByText('Frankfurt Airport · Germany')).toBeInTheDocument();
  });

  it('FE-PLANNER-AIRPORTSEL-007: an airport without a city falls back to its name and drops the country suffix', async () => {
    const user = userEvent.setup();
    server.use(airportRoute(() => HttpResponse.json([buildAirport({ city: '', country: '' })])));

    render(<Host />);
    await user.type(screen.getByRole('textbox'), 'FRA');

    // The heading falls back to `name`, and the subtitle carries no " · country" tail.
    const rows = await screen.findAllByText('Frankfurt Airport');
    expect(rows).toHaveLength(2);
  });

  it('FE-PLANNER-AIRPORTSEL-008: an unknown region code is shown verbatim', async () => {
    const user = userEvent.setup();
    server.use(airportRoute(() => HttpResponse.json([buildAirport({ country: 'XX' })])));

    render(<Host />);
    await user.type(screen.getByRole('textbox'), 'FRA');

    expect(await screen.findByText('Frankfurt Airport · XX')).toBeInTheDocument();
  });

  it('FE-PLANNER-AIRPORTSEL-009: shows the loading row while the request is in flight', async () => {
    const user = userEvent.setup();
    server.use(airportRoute(async () => { await delay(200); return HttpResponse.json([buildAirport()]); }));

    render(<Host />);
    await user.type(screen.getByRole('textbox'), 'FRA');

    expect(await screen.findByText('Loading...')).toBeInTheDocument();
    expect(await screen.findByText('Frankfurt Airport · Germany')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-AIRPORTSEL-010: picking a result reports it upwards and closes the dropdown', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    server.use(airportRoute(() => HttpResponse.json([buildAirport()])));

    render(<Host onPick={onPick} />);
    await user.type(screen.getByRole('textbox'), 'FRA');
    await user.click(await screen.findByText('Frankfurt Airport · Germany'));

    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ iata: 'FRA', tz: 'Europe/Berlin' }));
    expect(screen.getByDisplayValue('Frankfurt (FRA)')).toBeInTheDocument();
    expect(screen.queryByText('Frankfurt Airport · Germany')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-AIRPORTSEL-011: the picked label does not trigger a follow-up search', async () => {
    const user = userEvent.setup();
    const seen: string[] = [];
    server.use(airportRoute((q) => { seen.push(q); return HttpResponse.json([buildAirport()]); }));

    render(<Host />);
    await user.type(screen.getByRole('textbox'), 'FRA');
    await user.click(await screen.findByText('Frankfurt Airport · Germany'));

    await settle();
    expect(seen).toEqual(['FRA']);
  });

  it('FE-PLANNER-AIRPORTSEL-012: the clear button resets both the value and the text', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();

    render(<Host initial={buildAirport()} onPick={onPick} />);
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onPick).toHaveBeenCalledWith(null);
    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-AIRPORTSEL-013: typing over a picked airport drops the selection', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    server.use(airportRoute(() => HttpResponse.json([])));

    render(<Host initial={buildAirport()} onPick={onPick} />);
    await user.type(screen.getByRole('textbox'), 'X');

    expect(onPick).toHaveBeenCalledWith(null);
  });

  it('FE-PLANNER-AIRPORTSEL-014: ArrowDown then Enter picks the highlighted airport', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    server.use(airportRoute(() => HttpResponse.json([
      buildAirport(),
      buildAirport({ iata: 'MUC', name: 'Munich Airport', city: 'Munich' }),
    ])));

    render(<Host onPick={onPick} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'ger');
    await screen.findByText('Frankfurt Airport · Germany');

    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ iata: 'MUC' }));
    expect(input).toHaveValue('Munich (MUC)');
  });

  it('FE-PLANNER-AIRPORTSEL-015: ArrowUp cannot move the highlight above the first row', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    server.use(airportRoute(() => HttpResponse.json([
      buildAirport(),
      buildAirport({ iata: 'MUC', name: 'Munich Airport', city: 'Munich' }),
    ])));

    render(<Host onPick={onPick} />);
    await user.type(screen.getByRole('textbox'), 'ger');
    await screen.findByText('Frankfurt Airport · Germany');

    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}{ArrowUp}{ArrowUp}{Enter}');

    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ iata: 'FRA' }));
  });

  it('FE-PLANNER-AIRPORTSEL-016: Enter without a highlight keeps the dropdown open', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    server.use(airportRoute(() => HttpResponse.json([buildAirport()])));

    render(<Host onPick={onPick} />);
    await user.type(screen.getByRole('textbox'), 'FRA');
    await screen.findByText('Frankfurt Airport · Germany');

    await user.keyboard('{Enter}');

    expect(onPick).not.toHaveBeenCalled();
    expect(screen.getByText('Frankfurt Airport · Germany')).toBeInTheDocument();
  });

  it('FE-PLANNER-AIRPORTSEL-017: Escape closes the dropdown without clearing the text', async () => {
    const user = userEvent.setup();
    server.use(airportRoute(() => HttpResponse.json([buildAirport()])));

    render(<Host />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'FRA');
    await screen.findByText('Frankfurt Airport · Germany');

    await user.keyboard('{Escape}');

    expect(screen.queryByText('Frankfurt Airport · Germany')).not.toBeInTheDocument();
    expect(input).toHaveValue('FRA');
  });

  it('FE-PLANNER-AIRPORTSEL-018: hovering a row moves the highlight so Enter picks it', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    server.use(airportRoute(() => HttpResponse.json([
      buildAirport(),
      buildAirport({ iata: 'MUC', name: 'Munich Airport', city: 'Munich' }),
    ])));

    render(<Host onPick={onPick} />);
    await user.type(screen.getByRole('textbox'), 'ger');
    const munich = await screen.findByText('Munich Airport · Germany');

    fireEvent.mouseEnter(munich.closest('button')!);
    await user.keyboard('{Enter}');

    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ iata: 'MUC' }));
  });

  it('FE-PLANNER-AIRPORTSEL-019: a mousedown outside the field closes the dropdown', async () => {
    const user = userEvent.setup();
    server.use(airportRoute(() => HttpResponse.json([buildAirport()])));

    render(<Host />);
    await user.type(screen.getByRole('textbox'), 'FRA');
    await screen.findByText('Frankfurt Airport · Germany');

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText('Frankfurt Airport · Germany')).not.toBeInTheDocument();
    });
  });

  it('FE-PLANNER-AIRPORTSEL-020: a failing request drops the previous suggestions', async () => {
    const user = userEvent.setup();
    server.use(airportRoute((q) =>
      q === 'FRA'
        ? HttpResponse.json([buildAirport()])
        : HttpResponse.json({ error: 'lookup failed' }, { status: 500 }),
    ));

    render(<Host />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'FRA');
    await screen.findByText('Frankfurt Airport · Germany');

    await user.type(input, 'N');

    await waitFor(() => {
      expect(screen.queryByText('Frankfurt Airport · Germany')).not.toBeInTheDocument();
    });
  });

  it('FE-PLANNER-AIRPORTSEL-021: a non-array payload yields no rows', async () => {
    const user = userEvent.setup();
    server.use(airportRoute(() => HttpResponse.json({ airports: [buildAirport()] })));

    render(<Host />);
    await user.type(screen.getByRole('textbox'), 'FRA');

    await settle();
    expect(screen.queryByText('Frankfurt Airport · Germany')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-AIRPORTSEL-022: a superseded slow request must not clobber the newer rows', async () => {
    const user = userEvent.setup();
    server.use(airportRoute(async (q) => {
      if (q === 'Fra') {
        await delay(600);
        return HttpResponse.json([buildAirport({ iata: 'STL', name: 'Stale Airport', city: 'Stale' })]);
      }
      return HttpResponse.json([buildAirport({ iata: 'MUC', name: 'Munich Airport', city: 'Munich' })]);
    }));

    render(<Host />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'Fra');
    await settle(300);

    await user.clear(input);
    await user.type(input, 'Mun');
    expect(await screen.findByText('Munich Airport · Germany')).toBeInTheDocument();

    // The first request only lands now; its abort must keep the list untouched.
    await settle(600);
    expect(screen.getByText('Munich Airport · Germany')).toBeInTheDocument();
    expect(screen.queryByText('Stale Airport · Germany')).not.toBeInTheDocument();
  });
});
