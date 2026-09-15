// FE-COMP-LINKS-001 to FE-COMP-LINKS-008

vi.mock('../../api/websocket', () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  getSocketId: vi.fn(() => null),
  setRefetchCallback: vi.fn(),
  setPreReconnectHook: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
}));

import { render, screen, waitFor } from '../../../tests/helpers/render';
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
    expect(screen.getByText('https://ferries.example/timetable')).toBeInTheDocument();
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

  it('FE-COMP-LINKS-008: a viewer without edit rights gets no add button', async () => {
    // collab_edit reserved for the owner, on somebody else's trip.
    seedStore(usePermissionsStore, { permissions: { collab_edit: 'trip_owner' } });
    seedStore(useTripStore, { trip: buildTrip({ id: 1, user_id: 99 }) });
    render(<CollabLinks tripId={1} />);
    expect(await screen.findByText(/no shared links yet|collab\.links\.empty/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add link|collab\.links\.add/i })).not.toBeInTheDocument();
  });
});
