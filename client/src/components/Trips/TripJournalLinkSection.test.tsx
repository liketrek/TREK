// FE-TJL-SECTION-001 to FE-TJL-SECTION-007

/**
 * The Journal part of the trip's Settings, rendered: what someone sees with no
 * journal linked, with one linked, while picking, and the warning that names
 * the people a save would let in for the first time.
 */
import userEvent from '@testing-library/user-event';
import type { TripJournalCandidate, TripJournalLinkResponse } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildUser } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { render, screen, waitFor } from '../../../tests/helpers/render';
import { seedStore } from '../../../tests/helpers/store';
import { useAddonStore } from '../../store/addonStore';
import { useAuthStore } from '../../store/authStore';
import { useTripJournalLinkStore } from '../../store/tripJournalLinkStore';
import { LinkedJournalIcon } from './LinkedJournalIcon';
import { TripJournalLinkSection } from './TripJournalLinkSection';

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));

const TRIP = 4;
const EMPTY: TripJournalLinkResponse = { link: null, can_link: true, can_unlink: false, can_edit_members: false };
const LINKED: TripJournalLinkResponse = {
  link: {
    journey_id: 9,
    title: 'Japan',
    subtitle: null,
    cover_image: 'covers/j.jpg',
    owner_id: 1,
    linked_by: 1,
    created_at: 1,
    my_role: 'owner',
    members: [{ user_id: 2, role: 'editor', username: 'lena', avatar_url: null }],
  },
  can_link: true,
  can_unlink: true,
  can_edit_members: true,
};
const CANDIDATES: TripJournalCandidate[] = [
  { user_id: 2, username: 'lena', avatar_url: null, is_trip_owner: true, access: 'editor' },
  { user_id: 3, username: 'tom', avatar_url: null, is_trip_owner: false, access: null },
];

let answer: TripJournalLinkResponse = EMPTY;
let deletes = 0;

beforeEach(() => {
  answer = EMPTY;
  deletes = 0;
  vi.clearAllMocks();
  useTripJournalLinkStore.setState({ byTrip: {} });
  seedStore(useAuthStore, { user: buildUser({ id: 1 }) });
  useAddonStore.setState({
    loaded: true,
    addons: [{ id: 'journey', name: 'Journey', type: 'global', icon: 'BookOpen', enabled: true }],
  });
  server.use(
    http.get('/api/trips/:tripId/journal', () => HttpResponse.json(answer)),
    http.get('/api/trips/:tripId/journal/candidates', () => HttpResponse.json({ candidates: CANDIDATES })),
    http.get('/api/journeys', () => HttpResponse.json({ journeys: [{ id: 9, user_id: 1, title: 'Japan' }] })),
    http.delete('/api/trips/:tripId/journal', () => {
      deletes += 1;
      return HttpResponse.json(EMPTY);
    })
  );
});

describe('TripJournalLinkSection', () => {
  it('FE-TJL-SECTION-001: renders nothing with the Journey addon off', async () => {
    useAddonStore.setState({ addons: [] });
    const { container } = render(<TripJournalLinkSection tripId={TRIP} />);
    await new Promise((r) => setTimeout(r, 30));
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-TJL-SECTION-002: with no journal linked it offers to link one, in its own card', async () => {
    render(<TripJournalLinkSection tripId={TRIP} />);
    expect(await screen.findByText('Link a journal')).toBeInTheDocument();
    expect(screen.getByText('Journal')).toBeInTheDocument();
  });

  it('FE-TJL-SECTION-003: picking a journal lists the trip and warns about who gets in for the first time', async () => {
    const user = userEvent.setup();
    render(<TripJournalLinkSection tripId={TRIP} framed={false} />);
    await user.click(await screen.findByText('Link a journal'));
    await user.click(await screen.findByText('Choose a journal'));
    // The select opens its list in a portal, one button per journal.
    await user.click(await screen.findByRole('button', { name: 'Japan' }));

    expect(await screen.findByText('tom')).toBeInTheDocument();
    expect(screen.getByText('Has access')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('tom will get access to this journal for the first time');

    await user.click(screen.getAllByRole('radio', { name: 'No access' })[1]);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    await user.click(screen.getByText('Everyone can read'));
    expect(screen.getByRole('note')).toBeInTheDocument();
    await user.click(screen.getByText('Nobody'));
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    await user.click(screen.getByText('Cancel'));
    expect(screen.getByText('Link a journal')).toBeInTheDocument();
  });

  it('FE-TJL-SECTION-004: a linked journal shows its cover, my role and who it is open to', async () => {
    answer = LINKED;
    render(<TripJournalLinkSection tripId={TRIP} />);
    expect(await screen.findByText('Japan')).toBeInTheDocument();
    expect(screen.getByText('Your journal')).toBeInTheDocument();
    expect(screen.getByText('Linked')).toBeInTheDocument();
    expect(screen.getByText('lena')).toBeInTheDocument();
    expect(document.querySelector('img[src="/uploads/covers/j.jpg"]')).not.toBeNull();
  });

  it('FE-TJL-SECTION-005: unlinking asks first, then takes it off', async () => {
    const user = userEvent.setup();
    answer = LINKED;
    render(<TripJournalLinkSection tripId={TRIP} />);
    await user.click(await screen.findByRole('button', { name: 'Unlink' }));
    expect(screen.getByText('Unlink this journal?')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: 'Unlink' });
    await user.click(buttons[buttons.length - 1]);
    await waitFor(() => expect(deletes).toBe(1));
    expect(await screen.findByText('Link a journal')).toBeInTheDocument();
  });

  it('FE-TJL-SECTION-006: editing access lists the trip with each one as the link holds them', async () => {
    const user = userEvent.setup();
    answer = { ...LINKED, link: LINKED.link && { ...LINKED.link, members: [] } };
    render(<TripJournalLinkSection tripId={TRIP} />);
    expect(await screen.findByText('Nobody else from this trip has access yet.')).toBeInTheDocument();
    await user.click(screen.getByText('Edit access'));
    expect(await screen.findByText('tom')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(
      screen.getAllByRole('radio', { name: 'No access' }).every((r) => r.getAttribute('aria-checked') === 'true')
    ).toBe(true);
  });

  it('FE-TJL-SECTION-007: the linked-journal icon draws a book with the link on its corner', () => {
    const { container } = render(<LinkedJournalIcon size={20} className="x" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('dir')).toBe('ltr');
    expect(root.style.width).toBe('20px');
    expect(container.querySelectorAll('svg')).toHaveLength(2);
  });
});
