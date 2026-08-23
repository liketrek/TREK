// FE-PLANNER-ADDRIN-001 to FE-PLANNER-ADDRIN-015
import { useState } from 'react';
import { delay, http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { render, screen, fireEvent, waitFor, act } from '../../../tests/helpers/render';
import { server } from '../../../tests/helpers/msw/server';
import AddressInput from './AddressInput';

interface SearchHit {
  name?: string;
  address?: string | null;
  osm_id?: string;
  google_place_id?: string;
}

const HOTEL = { name: 'Hotel Sacher', address: 'Philharmoniker Str. 4, Vienna', osm_id: 'n1' };
const CAFE = { name: 'Cafe Central', address: 'Herrengasse 14, Vienna', osm_id: 'n2' };

/** Let the debounce fire and any in-flight request settle. */
async function settle(ms = 450) {
  await act(async () => { await new Promise((r) => setTimeout(r, ms)); });
}

function searchRoute(places: SearchHit[] | (() => Response | Promise<Response>)) {
  return http.post('/api/maps/search', typeof places === 'function' ? places : () => HttpResponse.json({ places }));
}

// The typed text is authoritative (#1496): the parent owns it and every
// keystroke has to arrive there, so the host mirrors that wiring.
function Host({ initial = '', onText }: { initial?: string; onText?: (v: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <AddressInput
      value={value}
      onChange={(v) => { setValue(v); onText?.(v); }}
      placeholder="Street and number"
      className="addr"
    />
  );
}

describe('AddressInput', () => {
  it('FE-PLANNER-ADDRIN-001: renders the given value, placeholder and class', () => {
    render(<AddressInput value="Hauptstrasse 1" onChange={vi.fn()} placeholder="Address" className="addr" />);
    const input = screen.getByPlaceholderText('Address');
    expect(input).toHaveValue('Hauptstrasse 1');
    expect(input).toHaveClass('addr');
  });

  it('FE-PLANNER-ADDRIN-002: every keystroke reaches the parent', async () => {
    const user = userEvent.setup();
    const onText = vi.fn();
    server.use(searchRoute([]));

    render(<Host onText={onText} />);
    await user.type(screen.getByPlaceholderText('Street and number'), 'Ab');

    expect(onText).toHaveBeenNthCalledWith(1, 'A');
    expect(onText).toHaveBeenNthCalledWith(2, 'Ab');
  });

  it('FE-PLANNER-ADDRIN-003: focusing a prefilled field does not search', async () => {
    const user = userEvent.setup();
    let calls = 0;
    server.use(searchRoute(() => { calls++; return HttpResponse.json({ places: [HOTEL] }); }));

    render(<Host initial="Philharmoniker Str. 4" />);
    await user.click(screen.getByPlaceholderText('Street and number'));

    await settle();
    expect(calls).toBe(0);
    expect(screen.queryByText('Hotel Sacher')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-ADDRIN-004: fewer than three characters never reach the API', async () => {
    const user = userEvent.setup();
    let calls = 0;
    server.use(searchRoute(() => { calls++; return HttpResponse.json({ places: [HOTEL] }); }));

    render(<Host />);
    await user.type(screen.getByPlaceholderText('Street and number'), 'He');

    await settle();
    expect(calls).toBe(0);
  });

  it('FE-PLANNER-ADDRIN-005: typing three characters opens the suggestion list', async () => {
    const user = userEvent.setup();
    server.use(searchRoute([HOTEL]));

    render(<Host />);
    await user.type(screen.getByPlaceholderText('Street and number'), 'Sacher');

    expect(await screen.findByText('Hotel Sacher')).toBeInTheDocument();
    expect(screen.getByText('Philharmoniker Str. 4, Vienna')).toBeInTheDocument();
  });

  it('FE-PLANNER-ADDRIN-006: deleting back below three characters closes the list again', async () => {
    const user = userEvent.setup();
    server.use(searchRoute([HOTEL]));

    render(<Host />);
    const input = screen.getByPlaceholderText('Street and number');
    await user.type(input, 'Sacher');
    await screen.findByText('Hotel Sacher');

    await user.clear(input);
    await user.type(input, 'Sa');

    await waitFor(() => expect(screen.queryByText('Hotel Sacher')).not.toBeInTheDocument());
  });

  it('FE-PLANNER-ADDRIN-007: shows the loading row while the request is in flight', async () => {
    const user = userEvent.setup();
    server.use(searchRoute(async () => { await delay(200); return HttpResponse.json({ places: [HOTEL] }); }));

    render(<Host />);
    await user.type(screen.getByPlaceholderText('Street and number'), 'Sacher');

    expect(await screen.findByText('Loading...')).toBeInTheDocument();
    expect(await screen.findByText('Hotel Sacher')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-ADDRIN-008: picking a suggestion writes its address into the field', async () => {
    const user = userEvent.setup();
    const onText = vi.fn();
    server.use(searchRoute([HOTEL]));

    render(<Host onText={onText} />);
    await user.type(screen.getByPlaceholderText('Street and number'), 'Sacher');
    await user.click(await screen.findByText('Hotel Sacher'));

    expect(onText).toHaveBeenLastCalledWith('Philharmoniker Str. 4, Vienna');
    expect(screen.getByPlaceholderText('Street and number')).toHaveValue('Philharmoniker Str. 4, Vienna');
    expect(screen.queryByText('Hotel Sacher')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-ADDRIN-009: a suggestion without an address falls back to its name', async () => {
    const user = userEvent.setup();
    const onText = vi.fn();
    server.use(searchRoute([{ name: 'Stephansplatz', address: null, osm_id: 'n5' }]));

    render(<Host onText={onText} />);
    await user.type(screen.getByPlaceholderText('Street and number'), 'Stephans');
    await user.click(await screen.findByText('Stephansplatz'));

    expect(onText).toHaveBeenLastCalledWith('Stephansplatz');
  });

  it('FE-PLANNER-ADDRIN-010: a suggestion without name or address clears the field', async () => {
    const user = userEvent.setup();
    const onText = vi.fn();
    server.use(searchRoute([HOTEL, { osm_id: 'n6' }]));

    render(<Host onText={onText} />);
    await user.type(screen.getByPlaceholderText('Street and number'), 'Sacher');
    await screen.findByText('Hotel Sacher');

    const rows = screen.getAllByRole('button');
    await user.click(rows[rows.length - 1]);

    expect(onText).toHaveBeenLastCalledWith('');
  });

  it('FE-PLANNER-ADDRIN-011: ArrowDown/ArrowUp move the highlight and Enter picks it', async () => {
    const user = userEvent.setup();
    const onText = vi.fn();
    server.use(searchRoute([HOTEL, CAFE]));

    render(<Host onText={onText} />);
    await user.type(screen.getByPlaceholderText('Street and number'), 'Vienna');
    await screen.findByText('Hotel Sacher');

    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onText).toHaveBeenLastCalledWith('Herrengasse 14, Vienna');
  });

  it('FE-PLANNER-ADDRIN-012: hovering a row moves the highlight so Enter picks it', async () => {
    const user = userEvent.setup();
    const onText = vi.fn();
    server.use(searchRoute([HOTEL, CAFE]));

    render(<Host onText={onText} />);
    await user.type(screen.getByPlaceholderText('Street and number'), 'Vienna');
    const cafe = await screen.findByText('Cafe Central');

    fireEvent.mouseEnter(cafe.closest('button')!);
    await user.keyboard('{ArrowUp}{Enter}');

    expect(onText).toHaveBeenLastCalledWith('Philharmoniker Str. 4, Vienna');
  });

  it('FE-PLANNER-ADDRIN-013: Escape closes the list and keeps the typed text', async () => {
    const user = userEvent.setup();
    server.use(searchRoute([HOTEL]));

    render(<Host />);
    const input = screen.getByPlaceholderText('Street and number');
    await user.type(input, 'Sacher');
    await screen.findByText('Hotel Sacher');

    await user.keyboard('{Escape}');

    expect(screen.queryByText('Hotel Sacher')).not.toBeInTheDocument();
    expect(input).toHaveValue('Sacher');
  });

  it('FE-PLANNER-ADDRIN-015: a slow earlier search cannot overwrite the newer results', async () => {
    // The debounce only cancels the timer; a request already on its way keeps
    // going, and this one answers last.
    server.use(http.post('/api/maps/search', async ({ request }) => {
      const { query } = await request.json() as { query: string };
      if (query === 'Sacher') { await delay(600); return HttpResponse.json({ places: [HOTEL] }); }
      return HttpResponse.json({ places: [CAFE] });
    }));

    render(<Host />);
    const input = screen.getByPlaceholderText('Street and number');
    fireEvent.change(input, { target: { value: 'Sacher' } });
    await settle(350);
    fireEvent.change(input, { target: { value: 'Cafe Central' } });

    expect(await screen.findByText('Cafe Central')).toBeInTheDocument();
    // Now let the first request land.
    await settle(500);
    expect(screen.getByText('Cafe Central')).toBeInTheDocument();
    expect(screen.queryByText('Hotel Sacher')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-ADDRIN-014: a mousedown outside closes the list and a failing search empties it', async () => {
    const user = userEvent.setup();
    server.use(searchRoute([HOTEL]));

    render(<Host />);
    const input = screen.getByPlaceholderText('Street and number');
    await user.type(input, 'Sacher');
    await screen.findByText('Hotel Sacher');

    fireEvent.mouseDown(document.body);
    await waitFor(() => expect(screen.queryByText('Hotel Sacher')).not.toBeInTheDocument());

    server.use(searchRoute(() => HttpResponse.json({ error: 'upstream down' }, { status: 500 })));
    await user.type(input, 'torte');

    await settle();
    expect(screen.queryByText('Hotel Sacher')).not.toBeInTheDocument();
  });
});
