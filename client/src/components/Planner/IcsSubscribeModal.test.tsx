// FE-PLANNER-ICS-001 to FE-PLANNER-ICS-012
import { render, screen, fireEvent, waitFor } from '../../../tests/helpers/render';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { IcsSubscribeModal } from './IcsSubscribeModal';

const ENDPOINT = '/api/trips/9/feed';
const TOKEN_URL = `${ENDPOINT}/token`;

const defaultProps = {
  endpoint: ENDPOINT,
  title: 'Subscribe to this trip',
  description: 'Keep the itinerary in your own calendar.',
  onClose: vi.fn(),
};

/** Register the token endpoint for every verb the modal can send. */
function tokenHandlers(handler: (method: string) => Response | Promise<Response>) {
  return [
    http.get(TOKEN_URL, () => handler('GET')),
    http.post(TOKEN_URL, () => handler('POST')),
    http.put(TOKEN_URL, () => handler('PUT')),
    http.delete(TOKEN_URL, () => handler('DELETE')),
  ];
}

describe('IcsSubscribeModal', () => {
  it('FE-PLANNER-ICS-001: shows the loading state until the token read resolves', async () => {
    let release: (() => void) | null = null;
    const gate = new Promise<void>(res => { release = res; });
    server.use(http.get(TOKEN_URL, async () => { await gate; return HttpResponse.json({ feed_url: null }); }));
    render(<IcsSubscribeModal {...defaultProps} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    release!();
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
  });

  it('FE-PLANNER-ICS-002: renders title and description in the header', async () => {
    server.use(http.get(TOKEN_URL, () => HttpResponse.json({ feed_url: null })));
    render(<IcsSubscribeModal {...defaultProps} />);
    expect(screen.getByText('Subscribe to this trip')).toBeInTheDocument();
    expect(screen.getByText('Keep the itinerary in your own calendar.')).toBeInTheDocument();
    await screen.findByRole('button', { name: /Enable calendar subscription/i });
  });

  it('FE-PLANNER-ICS-003: with no token yet it offers the enable button, no links', async () => {
    server.use(http.get(TOKEN_URL, () => HttpResponse.json({ feed_url: null })));
    render(<IcsSubscribeModal {...defaultProps} />);
    expect(await screen.findByRole('button', { name: /Enable calendar subscription/i })).toBeInTheDocument();
    expect(screen.getByText(/Creates a secret link/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Add to Google Calendar/i })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-ICS-004: enabling POSTs the token endpoint and swaps in the subscribe links', async () => {
    const seen: string[] = [];
    server.use(
      http.get(TOKEN_URL, () => { seen.push('GET'); return HttpResponse.json({ feed_url: null }); }),
      http.post(TOKEN_URL, () => { seen.push('POST'); return HttpResponse.json({ feed_url: 'https://trek.example/api/trips/9/feed/tok.ics' }); }),
    );
    render(<IcsSubscribeModal {...defaultProps} />);
    fireEvent.click(await screen.findByRole('button', { name: /Enable calendar subscription/i }));
    expect(await screen.findByRole('link', { name: /Add to Google Calendar/i })).toBeInTheDocument();
    expect(seen).toEqual(['GET', 'POST']);
    expect(screen.getByRole('button', { name: /Regenerate/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Turn off/i })).toBeInTheDocument();
  });

  it('FE-PLANNER-ICS-005: an absolute feed_url is handed to the links as https and webcal', async () => {
    server.use(http.get(TOKEN_URL, () => HttpResponse.json({ feed_url: 'https://trek.example/feed/tok.ics' })));
    render(<IcsSubscribeModal {...defaultProps} />);
    expect(await screen.findByText('https://trek.example/feed/tok.ics')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Add to Apple Calendar \/ Outlook/i }))
      .toHaveAttribute('href', 'webcal://trek.example/feed/tok.ics');
  });

  it('FE-PLANNER-ICS-006: a host-relative feed_url is resolved against the current origin', async () => {
    server.use(http.get(TOKEN_URL, () => HttpResponse.json({ feed_url: '/api/trips/9/feed/tok.ics' })));
    render(<IcsSubscribeModal {...defaultProps} />);
    const absolute = `${window.location.origin}/api/trips/9/feed/tok.ics`;
    expect(await screen.findByText(absolute)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Add to Apple Calendar \/ Outlook/i }))
      .toHaveAttribute('href', absolute.replace(/^https?:\/\//, 'webcal://'));
  });

  it('FE-PLANNER-ICS-012: a feed_url with neither scheme nor leading slash is used verbatim', async () => {
    server.use(http.get(TOKEN_URL, () => HttpResponse.json({ feed_url: 'trips/9/feed/tok.ics' })));
    render(<IcsSubscribeModal {...defaultProps} />);
    // Nothing to absolutize against, so the raw value reaches the copy rows and
    // the webcal handoff stays schemeless rather than being mangled.
    expect(await screen.findAllByText('trips/9/feed/tok.ics')).toHaveLength(2);
    expect(screen.getByRole('link', { name: /Add to Apple Calendar \/ Outlook/i }))
      .toHaveAttribute('href', 'trips/9/feed/tok.ics');
  });

  it('FE-PLANNER-ICS-007: Regenerate sends PUT and shows the new link', async () => {
    let method = '';
    server.use(
      http.get(TOKEN_URL, () => HttpResponse.json({ feed_url: 'https://trek.example/feed/old.ics' })),
      http.put(TOKEN_URL, () => { method = 'PUT'; return HttpResponse.json({ feed_url: 'https://trek.example/feed/new.ics' }); }),
    );
    render(<IcsSubscribeModal {...defaultProps} />);
    fireEvent.click(await screen.findByRole('button', { name: /Regenerate/i }));
    expect(await screen.findByText('https://trek.example/feed/new.ics')).toBeInTheDocument();
    expect(method).toBe('PUT');
  });

  it('FE-PLANNER-ICS-008: Turn off sends DELETE and drops back to the enable state', async () => {
    let method = '';
    server.use(
      http.get(TOKEN_URL, () => HttpResponse.json({ feed_url: 'https://trek.example/feed/tok.ics' })),
      http.delete(TOKEN_URL, () => { method = 'DELETE'; return HttpResponse.json({ feed_url: null }); }),
    );
    render(<IcsSubscribeModal {...defaultProps} />);
    fireEvent.click(await screen.findByRole('button', { name: /Turn off/i }));
    expect(await screen.findByRole('button', { name: /Enable calendar subscription/i })).toBeInTheDocument();
    expect(method).toBe('DELETE');
  });

  it('FE-PLANNER-ICS-009: a failing token read still leaves the dialog usable', async () => {
    server.use(http.get(TOKEN_URL, () => HttpResponse.error()));
    render(<IcsSubscribeModal {...defaultProps} />);
    // The catch swallows the error, loading clears, and the enable path is offered.
    expect(await screen.findByRole('button', { name: /Enable calendar subscription/i })).toBeInTheDocument();
  });

  it('FE-PLANNER-ICS-010: a non-ok mutate response leaves the current token untouched', async () => {
    server.use(
      ...tokenHandlers(m => (m === 'GET'
        ? HttpResponse.json({ feed_url: 'https://trek.example/feed/keep.ics' })
        : new HttpResponse(null, { status: 500 }))),
    );
    render(<IcsSubscribeModal {...defaultProps} />);
    const regenerate = await screen.findByRole('button', { name: /Regenerate/i });
    fireEvent.click(regenerate);
    await waitFor(() => expect(regenerate).not.toBeDisabled());
    expect(screen.getByText('https://trek.example/feed/keep.ics')).toBeInTheDocument();
  });

  it('FE-PLANNER-ICS-011: the close button and a backdrop click both call onClose, an inner click does not', async () => {
    const onClose = vi.fn();
    server.use(http.get(TOKEN_URL, () => HttpResponse.json({ feed_url: null })));
    render(<IcsSubscribeModal {...defaultProps} onClose={onClose} />);
    await screen.findByRole('button', { name: /Enable calendar subscription/i });

    const closeBtn = screen.getByText('Subscribe to this trip').closest('div')!.parentElement!
      .querySelector('button') as HTMLButtonElement;
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const backdrop = document.querySelector('[style*="position: fixed"]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByText('Keep the itinerary in your own calendar.'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
