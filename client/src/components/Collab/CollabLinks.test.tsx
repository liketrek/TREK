// FE-COMP-LINKS-001 to FE-COMP-LINKS-013

vi.mock('../../api/websocket', () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  getSocketId: vi.fn(() => null),
  setRefetchCallback: vi.fn(),
  setPreReconnectHook: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
}));

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, render, screen, waitFor, within } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { usePermissionsStore } from '../../store/permissionsStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser, buildTrip } from '../../../tests/helpers/factories';
import CollabLinks from './CollabLinks';

const currentUser = buildUser({ id: 1, username: 'testuser' });

const buildLink = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  title: 'Ferry timetable',
  url: 'https://ferries.example/timetable',
  pinned: 0,
  ...overrides,
});

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  server.use(
    http.get('/api/trips/1/collab/links', () => HttpResponse.json({ links: [] })),
  );
  seedStore(useAuthStore, { user: currentUser, isAuthenticated: true });
  seedStore(useTripStore, { trip: buildTrip({ id: 1, user_id: 1 }) });
});

describe('CollabLinks', () => {
  it('FE-COMP-LINKS-001: empty list shows the mascot state, not a bare line of text', async () => {
    render(<CollabLinks tripId={1} />);
    expect(await screen.findByText(/no shared links yet|collab\.links\.empty/i)).toBeInTheDocument();
    // The mascot carries the scene class; it is what makes this panel match its siblings.
    await waitFor(() => expect(document.querySelector('.trek--links')).toBeInTheDocument());
  });

  it('FE-COMP-LINKS-002: the header names the panel and carries the add button', async () => {
    render(<CollabLinks tripId={1} />);
    const heading = await screen.findByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent(/links/i);
    expect(heading).toHaveStyle({ textTransform: 'uppercase' });
    expect(screen.getByRole('button', { name: /add link|collab\.links\.add/i })).toBeInTheDocument();
  });

  it('FE-COMP-LINKS-003: renders a link with its title and url', async () => {
    server.use(
      http.get('/api/trips/1/collab/links', () => HttpResponse.json({ links: [buildLink()] })),
    );
    render(<CollabLinks tripId={1} />);
    expect(await screen.findByText('Ferry timetable')).toBeInTheDocument();
    // The chip shows the host, not the whole address, and links to the address itself.
    expect(screen.getByText('ferries.example')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ferry timetable/i })).toHaveAttribute('href', 'https://ferries.example/timetable');
  });

  it('FE-COMP-LINKS-004: the add button opens the form in a dialog, not inside the list', async () => {
    const user = userEvent.setup();
    render(<CollabLinks tripId={1} />);
    await user.click(await screen.findByRole('button', { name: /add link|collab\.links\.add/i }));
    expect(await screen.findByLabelText(/link title|collab\.links\.titlePlaceholder/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/https|collab\.links\.urlPlaceholder/i)).toBeInTheDocument();
  });

  it('FE-COMP-LINKS-005: saving posts the link and closes the form', async () => {
    const user = userEvent.setup();
    let posted: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/trips/1/collab/links', async ({ request }) => {
        posted = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ link: buildLink({ id: 7, title: 'Ferry timetable' }) });
      }),
    );
    render(<CollabLinks tripId={1} />);
    await user.click(await screen.findByRole('button', { name: /add link|collab\.links\.add/i }));
    await user.type(await screen.findByLabelText(/link title|collab\.links\.titlePlaceholder/i), 'Ferry timetable');
    await user.type(screen.getByLabelText(/https|collab\.links\.urlPlaceholder/i), 'https://ferries.example/timetable');
    await user.click(screen.getByRole('button', { name: /save link|collab\.links\.save/i }));

    await waitFor(() => expect(posted).toEqual({ title: 'Ferry timetable', url: 'https://ferries.example/timetable' }));
    await waitFor(() => expect(screen.queryByLabelText(/link title|collab\.links\.titlePlaceholder/i)).not.toBeInTheDocument());
    expect(await screen.findByText('Ferry timetable')).toBeInTheDocument();
  });

  it('FE-COMP-LINKS-006: a failed save keeps the form open so the input is not lost', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/trips/1/collab/links', () => new HttpResponse(null, { status: 500 })),
    );
    render(<CollabLinks tripId={1} />);
    await user.click(await screen.findByRole('button', { name: /add link|collab\.links\.add/i }));
    await user.type(await screen.findByLabelText(/link title|collab\.links\.titlePlaceholder/i), 'Ferry timetable');
    await user.type(screen.getByLabelText(/https|collab\.links\.urlPlaceholder/i), 'https://ferries.example/timetable');
    await user.click(screen.getByRole('button', { name: /save link|collab\.links\.save/i }));

    expect(await screen.findByLabelText(/link title|collab\.links\.titlePlaceholder/i)).toHaveValue('Ferry timetable');
  });

  it('FE-COMP-LINKS-007: pin and delete are offered on a link', async () => {
    server.use(
      http.get('/api/trips/1/collab/links', () => HttpResponse.json({ links: [buildLink()] })),
    );
    render(<CollabLinks tripId={1} />);
    expect(await screen.findByRole('button', { name: /pin link|collab\.links\.pin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete link|collab\.links\.delete/i })).toBeInTheDocument();
  });

  it('FE-COMP-LINKS-009: a link can be edited in place, title and address alike', async () => {
    // #2414: a link used to be delete-and-add once it needed a correction.
    const user = userEvent.setup();
    let put: Record<string, unknown> | null = null;
    server.use(
      http.get('/api/trips/1/collab/links', () => HttpResponse.json({ links: [buildLink()] })),
      http.put('/api/trips/1/collab/links/1', async ({ request }) => {
        put = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ link: buildLink({ title: 'Ferry timetable 2026', url: 'https://ferries.example/2026' }) });
      }),
    );
    render(<CollabLinks tripId={1} />);
    await user.click(await screen.findByRole('button', { name: /edit link|collab\.links\.edit/i }));
    const title = await screen.findByLabelText(/link title|collab\.links\.titlePlaceholder/i);
    expect(title).toHaveValue('Ferry timetable');
    await user.clear(title);
    await user.type(title, 'Ferry timetable 2026');
    const url = screen.getByLabelText(/https|collab\.links\.urlPlaceholder/i);
    expect(url).toHaveValue('https://ferries.example/timetable');
    await user.clear(url);
    await user.type(url, 'https://ferries.example/2026');
    await user.click(screen.getByRole('button', { name: /save link|collab\.links\.save/i }));

    await waitFor(() => expect(put).toEqual({ title: 'Ferry timetable 2026', url: 'https://ferries.example/2026' }));
    await waitFor(() => expect(screen.queryByLabelText(/link title|collab\.links\.titlePlaceholder/i)).not.toBeInTheDocument());
    expect(await screen.findByText('Ferry timetable 2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ferry timetable 2026/i })).toHaveAttribute('href', 'https://ferries.example/2026');
  });

  it('FE-COMP-LINKS-010: the chip is the link and opens the address in a new tab', async () => {
    server.use(
      http.get('/api/trips/1/collab/links', () => HttpResponse.json({ links: [buildLink()] })),
    );
    render(<CollabLinks tripId={1} />);
    const open = await screen.findByRole('link', { name: /ferry timetable/i });
    expect(open).toHaveAttribute('href', 'https://ferries.example/timetable');
    expect(open).toHaveAttribute('target', '_blank');
    // The host stands beside the title; the whole address would not fit a chip.
    expect(screen.getByText('ferries.example')).toBeInTheDocument();
  });

  it('FE-COMP-LINKS-011: deleting asks first, and the DELETE goes out only once confirmed', async () => {
    // The link goes for every member, and on the phone the button is a thumb's
    // width from pin: the notes panel guards the same way.
    const user = userEvent.setup();
    let deleted = false;
    server.use(
      http.get('/api/trips/1/collab/links', () => HttpResponse.json({ links: [buildLink()] })),
      http.delete('/api/trips/1/collab/links/1', () => { deleted = true; return HttpResponse.json({ success: true }); }),
    );
    render(<CollabLinks tripId={1} />);
    await user.click(await screen.findByRole('button', { name: /delete link|collab\.links\.delete/i }));
    expect(await screen.findByText(/delete link\?|collab\.links\.confirmDeleteTitle/i)).toBeInTheDocument();
    expect(deleted).toBe(false);
    expect(screen.getByText('Ferry timetable')).toBeInTheDocument();

    // The confirm button of the question itself, found by its role rather than a colour class.
    const question = screen.getByText(/delete link\?|collab\.links\.confirmDeleteTitle/i).closest('.trek-modal-enter') as HTMLElement;
    await user.click(within(question).getByRole('button', { name: /^(delete|common\.delete)$/i }));
    await waitFor(() => expect(deleted).toBe(true));
    await waitFor(() => expect(screen.queryByText('Ferry timetable')).not.toBeInTheDocument());
  });

  it('FE-COMP-LINKS-012: a corrected address gets a fresh favicon attempt', async () => {
    // The icon remembers a favicon that failed, and an edit keeps the chip's id,
    // so the corrected address kept the generic glyph until the panel remounted.
    const user = userEvent.setup();
    server.use(
      http.get('/api/trips/1/collab/links', () => HttpResponse.json({ links: [buildLink({ url: 'https://old.example/page' })] })),
      http.put('/api/trips/1/collab/links/1', () => HttpResponse.json({ link: buildLink({ url: 'https://new.example/page' }) })),
    );
    render(<CollabLinks tripId={1} />);
    const chip = await screen.findByRole('link', { name: /ferry timetable/i });
    fireEvent.error(chip.querySelector('img') as HTMLImageElement);
    await waitFor(() => expect(chip.querySelector('img')).toBeNull());

    await user.click(screen.getByRole('button', { name: /edit link|collab\.links\.edit/i }));
    const url = await screen.findByLabelText(/https|collab\.links\.urlPlaceholder/i);
    await user.clear(url);
    await user.type(url, 'https://new.example/page');
    await user.click(screen.getByRole('button', { name: /save link|collab\.links\.save/i }));

    await waitFor(() => expect(screen.getByRole('link', { name: /ferry timetable/i }).querySelector('img'))
      .toHaveAttribute('src', 'https://new.example/favicon.ico'));
  });

  it('FE-COMP-LINKS-013: on touch the chip actions are finger-sized and apart', () => {
    // jsdom lays nothing out, so the rule is the assertion. The phone Collab tab
    // mounts this chip; 22px buttons a pixel apart put delete one slip from pin.
    const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
    const at = css.indexOf('@media (hover: none) {\n  .collab-link-chip__actions');
    expect(at, 'touch rules for the chip actions missing from index.css').toBeGreaterThan(-1);
    const touch = css.slice(at, css.indexOf('\n}', at));
    expect(touch).toMatch(/\.collab-link-chip__actions \{[^}]*gap:\s*4px/);
    const action = /\.collab-link-chip__action \{([^}]*)\}/.exec(touch)?.[1] ?? '';
    for (const side of ['width', 'height']) {
      expect(Number(new RegExp(`${side}:\\s*(\\d+)px`).exec(action)?.[1]), side).toBeGreaterThanOrEqual(24);
    }
    // The height comes back through the margin, so the chip itself stays 36px.
    expect(action).toMatch(/margin:\s*-4px 0/);
  });

  it('FE-COMP-LINKS-008: a viewer without edit rights gets no add button', async () => {
    // collab_edit reserved for the owner, on somebody else's trip.
    seedStore(usePermissionsStore, { permissions: { collab_edit: 'trip_owner' } });
    seedStore(useTripStore, { trip: buildTrip({ id: 1, user_id: 99 }) });
    render(<CollabLinks tripId={1} />);
    expect(await screen.findByText(/no shared links yet|collab\.links\.empty/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add link|collab\.links\.add/i })).not.toBeInTheDocument();
  });
});
