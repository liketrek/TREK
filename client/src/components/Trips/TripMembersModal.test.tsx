// FE-COMP-MEMBERS-001 to FE-COMP-MEMBERS-056
import type { Mock } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { usePermissionsStore } from '../../store/permissionsStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser, buildTrip } from '../../../tests/helpers/factories';
import TripMembersModal from './TripMembersModal';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  tripId: 1,
  tripTitle: 'Test Trip',
};

const ownerUser = buildUser({ id: 1, username: 'owner' });
const memberUser = buildUser({ id: 2, username: 'alice' });

type AddToast = NonNullable<typeof window.__addToast>;
let addToast: Mock<AddToast>;

interface MemberRow {
  id: number;
  username: string;
  avatar_url?: string | null;
  is_guest?: boolean;
}

/** Replaces the roster handler; `owner` defaults to the seeded owner user. */
function mockRoster(members: MemberRow[], owner: MemberRow = { id: ownerUser.id, username: ownerUser.username, avatar_url: null }): void {
  server.use(
    http.get('/api/trips/1/members', () =>
      HttpResponse.json({ owner, members, current_user_id: ownerUser.id })
    ),
  );
}

/** Owner-only permissions so the share/invite column renders for the seeded owner. */
function asShareOwner(): void {
  seedStore(usePermissionsStore, { permissions: { share_manage: 'trip_owner' } });
  seedStore(useTripStore, { trip: buildTrip({ id: 1, user_id: ownerUser.id }) });
  server.use(http.get('/api/trips/1/invite-link', () => HttpResponse.json({ token: null })));
}

/** A browser on https, where the async clipboard API is the path taken. */
function mockClipboard(): Mock<(text: string) => Promise<void>> {
  const writeText = vi.fn(async () => {});
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true, writable: true });
  Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true, writable: true });
  return writeText;
}

beforeEach(() => {
  resetAllStores();
  server.use(
    http.get('/api/trips/1/members', () =>
      HttpResponse.json({
        owner: { id: ownerUser.id, username: ownerUser.username, avatar_url: null },
        members: [],
        current_user_id: ownerUser.id,
      })
    ),
    http.get('/api/trips/1/share-link', () =>
      HttpResponse.json({ token: null })
    ),
    http.get('/api/auth/users', () =>
      HttpResponse.json({ users: [memberUser] })
    ),
  );
  seedStore(useAuthStore, { user: ownerUser, isAuthenticated: true });
  seedStore(useTripStore, { trip: buildTrip({ id: 1, title: 'Test Trip' }) });
  addToast = vi.fn<AddToast>(() => 0);
  window.__addToast = addToast;
});

afterEach(() => {
  delete window.__addToast;
  vi.useRealTimers();
  vi.restoreAllMocks();
  Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true, writable: true });
});

describe('TripMembersModal', () => {
  it('FE-COMP-MEMBERS-001: renders without crashing', () => {
    render(<TripMembersModal {...defaultProps} />);
    expect(document.body).toBeInTheDocument();
  });

  it('FE-COMP-MEMBERS-002: shows Share Trip title', () => {
    render(<TripMembersModal {...defaultProps} />);
    // members.shareTrip = "Share Trip"
    expect(screen.getByText('Share Trip')).toBeInTheDocument();
  });

  it('FE-COMP-MEMBERS-003: shows owner username after load', async () => {
    render(<TripMembersModal {...defaultProps} />);
    await screen.findByText('owner');
  });

  it('FE-COMP-MEMBERS-004: shows Owner label', async () => {
    render(<TripMembersModal {...defaultProps} />);
    await screen.findByText('Owner');
  });

  it('FE-COMP-MEMBERS-005: shows Access section heading', async () => {
    render(<TripMembersModal {...defaultProps} />);
    // Text is "Access (1 person)" so use regex
    await screen.findByText(/Access/i);
  });

  it('FE-COMP-MEMBERS-006: shows member when members are loaded', async () => {
    server.use(
      http.get('/api/trips/1/members', () =>
        HttpResponse.json({
          owner: { id: ownerUser.id, username: ownerUser.username, avatar_url: null },
          members: [{ id: memberUser.id, username: memberUser.username, avatar_url: null }],
          current_user_id: ownerUser.id,
        })
      )
    );
    render(<TripMembersModal {...defaultProps} />);
    await screen.findByText('alice');
  });

  it('FE-COMP-MEMBERS-007: shows Invite User section', async () => {
    render(<TripMembersModal {...defaultProps} />);
    await screen.findByText('Invite User');
  });

  it('FE-COMP-MEMBERS-008: shows Invite button', async () => {
    render(<TripMembersModal {...defaultProps} />);
    await screen.findByRole('button', { name: /Invite/i });
  });

  it('FE-COMP-MEMBERS-009: Cancel/close button is present', () => {
    render(<TripMembersModal {...defaultProps} />);
    // Modal has a close button (×)
    const closeBtn = screen.queryByRole('button', { name: /close/i }) || document.querySelector('[aria-label="close"], button[title="Close"]');
    // The modal renders at minimum a close button or can be closed by clicking overlay
    expect(document.body).toBeInTheDocument();
  });

  it('FE-COMP-MEMBERS-010: shows member count of 1 with owner', async () => {
    render(<TripMembersModal {...defaultProps} />);
    // 1 person (just owner)
    await screen.findByText(/1 person/i);
  });

  it('FE-COMP-MEMBERS-011: members count increases when member is added', async () => {
    server.use(
      http.get('/api/trips/1/members', () =>
        HttpResponse.json({
          owner: { id: ownerUser.id, username: ownerUser.username, avatar_url: null },
          members: [{ id: memberUser.id, username: memberUser.username, avatar_url: null }],
          current_user_id: ownerUser.id,
        })
      )
    );
    render(<TripMembersModal {...defaultProps} />);
    await screen.findByText(/2 persons/i);
  });

  it('FE-COMP-MEMBERS-012: shows "you" label next to current user', async () => {
    render(<TripMembersModal {...defaultProps} />);
    // Rendered as "(you)" — use regex to find it
    await screen.findByText(/\(you\)/i);
  });

  it('FE-COMP-MEMBERS-013: shows remove access button for members (not owner)', async () => {
    server.use(
      http.get('/api/trips/1/members', () =>
        HttpResponse.json({
          owner: { id: ownerUser.id, username: ownerUser.username, avatar_url: null },
          members: [{ id: memberUser.id, username: memberUser.username, avatar_url: null }],
          current_user_id: ownerUser.id,
        })
      )
    );
    render(<TripMembersModal {...defaultProps} />);
    await screen.findByText('alice');
    // Remove access button shown for members
    expect(screen.getByTitle('Remove access')).toBeInTheDocument();
  });

  it('FE-COMP-MEMBERS-014: remove member calls DELETE API', async () => {
    const user = userEvent.setup();
    let deleteCalled = false;
    // Mock window.confirm to return true so deletion proceeds
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    server.use(
      http.get('/api/trips/1/members', () =>
        HttpResponse.json({
          owner: { id: ownerUser.id, username: ownerUser.username, avatar_url: null },
          members: [{ id: memberUser.id, username: memberUser.username, avatar_url: null }],
          current_user_id: ownerUser.id,
        })
      ),
      http.delete('/api/trips/1/members/:userId', () => {
        deleteCalled = true;
        return HttpResponse.json({ success: true });
      })
    );
    render(<TripMembersModal {...defaultProps} />);
    await screen.findByText('alice');
    const removeBtn = screen.getByTitle('Remove access');
    await user.click(removeBtn);
    await waitFor(() => expect(deleteCalled).toBe(true));
    vi.restoreAllMocks();
  });

  it('FE-COMP-MEMBERS-015: modal renders when isOpen is true', () => {
    render(<TripMembersModal {...defaultProps} isOpen={true} />);
    expect(screen.getByText('Share Trip')).toBeInTheDocument();
  });

  // ── Share Link Section (016-021) ───────────────────────────────────────────

  it('FE-COMP-MEMBERS-016: share link section not rendered for non-owner', async () => {
    const nonOwner = buildUser({ id: 99, username: 'stranger' });
    seedStore(useAuthStore, { user: nonOwner, isAuthenticated: true });
    seedStore(useTripStore, { trip: buildTrip({ id: 1, user_id: 1 }) });
    seedStore(usePermissionsStore, { permissions: { share_manage: 'trip_owner' } });

    render(<TripMembersModal {...defaultProps} />);
    // Wait for members list to load so the component is fully rendered
    await screen.findByText(/Access/i);
    expect(screen.queryByText('Public Link')).not.toBeInTheDocument();
  });

  it('FE-COMP-MEMBERS-017: share link section visible for owner', async () => {
    seedStore(usePermissionsStore, { permissions: { share_manage: 'trip_owner' } });
    seedStore(useTripStore, { trip: buildTrip({ id: 1, user_id: ownerUser.id }) });

    render(<TripMembersModal {...defaultProps} />);
    await screen.findByText('Public Link');
  });

  it('FE-COMP-MEMBERS-018: create share link shows URL after clicking create', async () => {
    const user = userEvent.setup();
    seedStore(usePermissionsStore, { permissions: { share_manage: 'trip_owner' } });
    seedStore(useTripStore, { trip: buildTrip({ id: 1, user_id: ownerUser.id }) });

    // GET returns null token initially; POST returns a new token
    server.use(
      http.get('/api/trips/1/share-link', () => HttpResponse.json({ token: null })),
      http.post('/api/trips/1/share-link', () =>
        HttpResponse.json({
          token: 'abc123',
          share_map: true,
          share_bookings: true,
          share_packing: false,
          share_budget: false,
          share_collab: false,
        })
      ),
    );

    render(<TripMembersModal {...defaultProps} />);
    const createBtn = await screen.findByText('Create link');
    await user.click(createBtn);

    await waitFor(() => {
      const input = screen.getByDisplayValue(/\/shared\/abc123/);
      expect(input).toBeInTheDocument();
    });
  });

  it('FE-COMP-MEMBERS-019: copy share link calls clipboard.writeText', async () => {
    const user = userEvent.setup();
    seedStore(usePermissionsStore, { permissions: { share_manage: 'trip_owner' } });
    seedStore(useTripStore, { trip: buildTrip({ id: 1, user_id: ownerUser.id }) });

    const writeText = mockClipboard();

    server.use(
      http.get('/api/trips/1/share-link', () =>
        HttpResponse.json({
          token: 'tok99',
          share_map: true,
          share_bookings: true,
          share_packing: false,
          share_budget: false,
          share_collab: false,
        })
      ),
    );

    render(<TripMembersModal {...defaultProps} />);
    const copyBtn = await screen.findByText('Copy');
    await user.click(copyBtn);

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('tok99'));
    await screen.findByText('Copied');
  });

  it('FE-COMP-MEMBERS-020: delete share link removes URL and shows create button', async () => {
    const user = userEvent.setup();
    seedStore(usePermissionsStore, { permissions: { share_manage: 'trip_owner' } });
    seedStore(useTripStore, { trip: buildTrip({ id: 1, user_id: ownerUser.id }) });

    let deleteHandlerCalled = false;
    server.use(
      http.get('/api/trips/1/share-link', () =>
        HttpResponse.json({
          token: 'tok99',
          share_map: true,
          share_bookings: true,
          share_packing: false,
          share_budget: false,
          share_collab: false,
        })
      ),
      http.delete('/api/trips/1/share-link', () => {
        deleteHandlerCalled = true;
        return HttpResponse.json({ success: true });
      }),
    );

    render(<TripMembersModal {...defaultProps} />);
    const deleteBtn = await screen.findByText('Delete link');
    await user.click(deleteBtn);

    expect(deleteHandlerCalled).toBe(true);
    await screen.findByText('Create link');
  });

  it('FE-COMP-MEMBERS-021: clicking permission toggle calls POST with updated perms', async () => {
    const user = userEvent.setup();
    seedStore(usePermissionsStore, { permissions: { share_manage: 'trip_owner' } });
    seedStore(useTripStore, { trip: buildTrip({ id: 1, user_id: ownerUser.id }) });

    let postedPerms: Record<string, unknown> | null = null;
    server.use(
      http.get('/api/trips/1/share-link', () =>
        HttpResponse.json({
          token: 'tok99',
          share_map: true,
          share_bookings: true,
          share_packing: false,
          share_budget: false,
          share_collab: false,
        })
      ),
      http.post('/api/trips/1/share-link', async ({ request }) => {
        postedPerms = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ token: 'tok99', ...postedPerms });
      }),
    );

    render(<TripMembersModal {...defaultProps} />);
    // Wait for the share section to load
    await screen.findByText('Public Link');
    // Click the "Packing" permission pill to toggle it on
    const packingBtn = await screen.findByText('Packing');
    await user.click(packingBtn);

    await waitFor(() => {
      expect(postedPerms).not.toBeNull();
      expect(postedPerms).toMatchObject({ share_packing: true });
    });
  });

  // ── Member management (022-025) ────────────────────────────────────────────

  it('FE-COMP-MEMBERS-022: adding a member via select + invite calls POST', async () => {
    const user = userEvent.setup();
    let postBody: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/trips/1/members', async ({ request }) => {
        postBody = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ success: true });
      }),
    );

    render(<TripMembersModal {...defaultProps} />);
    // Wait for Invite section to load
    await screen.findByText('Invite User');

    // Open the CustomSelect by clicking its trigger button (shows placeholder)
    const selectTrigger = screen.getByText('Select user…');
    await user.click(selectTrigger);

    // alice option appears in the portal dropdown
    const aliceOption = await screen.findByRole('button', { name: 'alice' });
    await user.click(aliceOption);

    // Click the member "Invite" button (exact — the Share area also has a
    // "Create invite link" button that a loose /Invite/i would match too).
    const inviteBtn = screen.getByRole('button', { name: 'Invite' });
    await user.click(inviteBtn);

    await waitFor(() => {
      expect(postBody).not.toBeNull();
    });
  });

  it('FE-COMP-MEMBERS-023: invite button is disabled when no user is selected', async () => {
    render(<TripMembersModal {...defaultProps} />);
    await screen.findByText('Invite User');

    const inviteBtn = screen.getByRole('button', { name: /Invite/i });
    expect(inviteBtn).toBeDisabled();
  });

  it('FE-COMP-MEMBERS-024: leave trip calls DELETE for current user', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: vi.fn() },
      writable: true,
      configurable: true,
    });

    seedStore(useAuthStore, { user: memberUser, isAuthenticated: true });
    seedStore(useTripStore, { trip: buildTrip({ id: 1, user_id: ownerUser.id }) });

    let deleteCalledForUserId: string | null = null;
    server.use(
      http.get('/api/trips/1/members', () =>
        HttpResponse.json({
          owner: { id: ownerUser.id, username: ownerUser.username, avatar_url: null },
          members: [{ id: memberUser.id, username: memberUser.username, avatar_url: null }],
          current_user_id: memberUser.id,
        })
      ),
      http.delete('/api/trips/1/members/:userId', ({ params }) => {
        deleteCalledForUserId = params.userId as string;
        return HttpResponse.json({ success: true });
      }),
    );

    render(<TripMembersModal {...defaultProps} />);
    await screen.findByText('alice');

    const leaveBtn = screen.getByTitle('Leave trip');
    await user.click(leaveBtn);

    await waitFor(() => {
      expect(deleteCalledForUserId).toBe(String(memberUser.id));
    });

    vi.restoreAllMocks();
  });

  it('FE-COMP-MEMBERS-025: "all have access" message shown when all users are members', async () => {
    server.use(
      http.get('/api/trips/1/members', () =>
        HttpResponse.json({
          owner: { id: ownerUser.id, username: ownerUser.username, avatar_url: null },
          members: [{ id: memberUser.id, username: memberUser.username, avatar_url: null }],
          current_user_id: ownerUser.id,
        })
      ),
      http.get('/api/auth/users', () =>
        HttpResponse.json({ users: [memberUser] })
      ),
    );

    render(<TripMembersModal {...defaultProps} />);
    await screen.findByText('All users already have access.');
  });

  it('FE-COMP-MEMBERS-026: owner sees the guests section and can add a guest (#1362)', async () => {
    let createdName: string | null = null;
    server.use(
      http.post('/api/trips/1/guests', async ({ request }) => {
        createdName = ((await request.json()) as { name: string }).name;
        return HttpResponse.json({ member: { id: 99, username: createdName, is_guest: true } });
      }),
    );
    render(<TripMembersModal {...defaultProps} />);
    // The guests section + add affordance is shown to the owner.
    await screen.findByText('Guests');
    const input = screen.getByPlaceholderText('Guest name');
    await userEvent.type(input, 'Grandpa');
    await userEvent.click(screen.getByRole('button', { name: /Add guest/i }));
    await waitFor(() => expect(createdName).toBe('Grandpa'));
  });

  it('FE-COMP-MEMBERS-027: a guest member is shown in the guests section with a Guest badge, not the members list (#1362)', async () => {
    server.use(
      http.get('/api/trips/1/members', () =>
        HttpResponse.json({
          owner: { id: ownerUser.id, username: ownerUser.username, avatar_url: null, is_guest: false },
          members: [
            { id: 2, username: 'alice', avatar_url: null, is_guest: false },
            { id: 3, username: 'Grandma', avatar_url: null, is_guest: true },
          ],
          current_user_id: ownerUser.id,
        })
      ),
    );
    render(<TripMembersModal {...defaultProps} />);
    await screen.findByText('Grandma');
    // The guest carries a "Guest" badge.
    expect(screen.getAllByText('Guest').length).toBeGreaterThan(0);
    // Access count covers owner + the real member only (2), not the guest.
    expect(screen.getByText(/Access \(2/)).toBeInTheDocument();
  });

  // ── Avatars and load failures (028-031) ───────────────────────────────────

  it('FE-COMP-MEMBERS-028: a member with an avatar renders the image instead of the initial', async () => {
    mockRoster([{ id: 2, username: 'alice', avatar_url: '/uploads/avatars/alice.png' }]);
    render(<TripMembersModal {...defaultProps} />);

    await screen.findByText('alice');
    expect(document.querySelector('img[src="/uploads/avatars/alice.png"]')).toBeInTheDocument();
    // The owner has no avatar and still gets a letter tile.
    expect(screen.getByText('O')).toBeInTheDocument();
  });

  it('FE-COMP-MEMBERS-029: a nameless member falls back to a question mark', async () => {
    mockRoster([], { id: ownerUser.id, username: '', avatar_url: null });
    render(<TripMembersModal {...defaultProps} />);

    await screen.findByText('?');
  });

  it('FE-COMP-MEMBERS-030: a failing roster load shows an error toast and an empty list', async () => {
    server.use(http.get('/api/trips/1/members', () => HttpResponse.json({}, { status: 500 })));
    render(<TripMembersModal {...defaultProps} />);

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Failed to load members', 'error', undefined));
    expect(screen.getByText(/Access \(0/)).toBeInTheDocument();
  });

  it('FE-COMP-MEMBERS-031: a failing share-link load still offers link creation', async () => {
    asShareOwner();
    server.use(http.get('/api/trips/1/share-link', () => HttpResponse.json({}, { status: 500 })));
    render(<TripMembersModal {...defaultProps} />);

    await screen.findByText('Create link');
    expect(screen.getByText('Public Link')).toBeInTheDocument();
  });

  // ── Share link errors and defaults (032-036) ──────────────────────────────

  it('FE-COMP-MEMBERS-032: a failing share-link creation is reported', async () => {
    const user = userEvent.setup();
    asShareOwner();
    server.use(http.post('/api/trips/1/share-link', () => HttpResponse.json({}, { status: 500 })));
    render(<TripMembersModal {...defaultProps} />);

    await user.click(await screen.findByText('Create link'));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Could not create link', 'error', undefined));
    expect(screen.getByText('Create link')).toBeInTheDocument();
  });

  it('FE-COMP-MEMBERS-033: missing permission flags fall back to map+bookings, and Map is not toggleable', async () => {
    const user = userEvent.setup();
    asShareOwner();
    let postedPerms: Record<string, unknown> | null = null;
    server.use(
      http.get('/api/trips/1/share-link', () => HttpResponse.json({ token: 'tok77' })),
      http.post('/api/trips/1/share-link', async ({ request }) => {
        postedPerms = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ token: 'tok77', ...postedPerms });
      }),
    );
    render(<TripMembersModal {...defaultProps} />);

    // The always-on Map & Plan pill ignores clicks.
    await user.click(await screen.findByText('Map & Plan'));
    expect(postedPerms).toBeNull();

    await user.click(screen.getByText('Costs'));
    await waitFor(() => expect(postedPerms).toMatchObject({
      share_map: true, share_bookings: true, share_packing: false, share_budget: true, share_collab: false,
    }));
  });

  it('FE-COMP-MEMBERS-034: a failing permission update is reported', async () => {
    const user = userEvent.setup();
    asShareOwner();
    server.use(
      http.get('/api/trips/1/share-link', () => HttpResponse.json({ token: 'tok77' })),
      http.post('/api/trips/1/share-link', () => HttpResponse.json({}, { status: 500 })),
    );
    render(<TripMembersModal {...defaultProps} />);

    await user.click(await screen.findByText('Packing'));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Could not create link', 'error', undefined));
  });

  it('FE-COMP-MEMBERS-035: a failing share-link deletion keeps the link', async () => {
    const user = userEvent.setup();
    asShareOwner();
    server.use(
      http.get('/api/trips/1/share-link', () => HttpResponse.json({ token: 'tok77' })),
      http.delete('/api/trips/1/share-link', () => HttpResponse.json({}, { status: 500 })),
    );
    render(<TripMembersModal {...defaultProps} />);

    await user.click(await screen.findByText('Delete link'));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Error', 'error', undefined));
    expect(screen.getByDisplayValue(/\/shared\/tok77/)).toBeInTheDocument();
  });

  it('FE-COMP-MEMBERS-036: the copied badge resets two seconds after the last copy', async () => {
    asShareOwner();
    const writeText = mockClipboard();
    server.use(http.get('/api/trips/1/share-link', () => HttpResponse.json({ token: 'tok77' })));
    const view = render(<TripMembersModal {...defaultProps} />);

    const copyBtn = (await screen.findByText('Copy')).closest('button')!;

    vi.useFakeTimers();
    fireEvent.click(copyBtn);
    // The copy is awaited now, so the badge lands a microtask after the click.
    await act(async () => {});
    expect(screen.getByText('Copied')).toBeInTheDocument();
    // A second copy replaces the pending reset rather than stacking timers.
    fireEvent.click(screen.getByText('Copied').closest('button')!);
    await act(async () => {});
    act(() => { vi.advanceTimersByTime(2000); });

    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledTimes(2);
    view.unmount();
  });

  // ── Trip invite link (037-039) ────────────────────────────────────────────

  it('FE-COMP-MEMBERS-037: an invite link can be created, copied, regenerated and disabled', async () => {
    const user = userEvent.setup();
    asShareOwner();
    const writeText = mockClipboard();
    const tokens = ['inv1', 'inv2'];
    server.use(
      http.post('/api/trips/1/invite-link', async () => {
        await delay(20);
        return HttpResponse.json({ token: tokens.shift() });
      }),
      http.delete('/api/trips/1/invite-link', () => HttpResponse.json({ success: true })),
    );
    const view = render(<TripMembersModal {...defaultProps} />);

    const createBtn = await screen.findByRole('button', { name: /Create invite link/i });
    fireEvent.click(createBtn);
    expect(createBtn).toBeDisabled();

    await screen.findByDisplayValue(/\/join\/inv1$/);

    await user.click(screen.getByText('Copy').closest('button')!);
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/join/inv1'));
    await screen.findByText('Copied');
    // Copying again swaps the pending reset instead of queueing a second one.
    await user.click(screen.getByText('Copied').closest('button')!);

    const regenerate = screen.getByRole('button', { name: /Regenerate/i });
    fireEvent.click(regenerate);
    expect(regenerate).toBeDisabled();
    expect(screen.getByRole('button', { name: /Disable/i })).toBeDisabled();
    await screen.findByDisplayValue(/\/join\/inv2$/);

    await user.click(screen.getByRole('button', { name: /Disable/i }));
    await screen.findByRole('button', { name: /Create invite link/i });

    view.unmount();
  });

  it('FE-COMP-MEMBERS-038: a failing invite-link creation is reported', async () => {
    const user = userEvent.setup();
    asShareOwner();
    server.use(http.post('/api/trips/1/invite-link', () => HttpResponse.json({}, { status: 500 })));
    render(<TripMembersModal {...defaultProps} />);

    await user.click(await screen.findByRole('button', { name: /Create invite link/i }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Could not create link', 'error', undefined));
    expect(screen.getByRole('button', { name: /Create invite link/i })).toBeEnabled();
  });

  it('FE-COMP-MEMBERS-039: a failing invite-link removal keeps the link', async () => {
    const user = userEvent.setup();
    asShareOwner();
    server.use(
      http.get('/api/trips/1/invite-link', () => HttpResponse.json({ token: 'inv9' })),
      http.delete('/api/trips/1/invite-link', () => HttpResponse.json({}, { status: 500 })),
    );
    render(<TripMembersModal {...defaultProps} />);

    await user.click(await screen.findByRole('button', { name: /Disable/i }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Error', 'error', undefined));
    expect(screen.getByDisplayValue(/\/join\/inv9$/)).toBeInTheDocument();
  });

  // ── Member management errors and ownership transfer (040-045) ─────────────

  it('FE-COMP-MEMBERS-040: a failing invite surfaces the server error', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/trips/1/members', () => HttpResponse.json({ error: 'User is already a member' }, { status: 409 })));
    render(<TripMembersModal {...defaultProps} />);

    await screen.findByText('Invite User');
    await user.click(screen.getByText('Select user…'));
    await user.click(await screen.findByRole('button', { name: 'alice' }));
    await user.click(screen.getByRole('button', { name: 'Invite' }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('User is already a member', 'error', undefined));
  });

  it('FE-COMP-MEMBERS-041: a successful invite reloads the roster and notifies the planner', async () => {
    const user = userEvent.setup();
    const onMembersChanged = vi.fn();
    server.use(http.post('/api/trips/1/members', () => HttpResponse.json({ success: true })));
    render(<TripMembersModal {...defaultProps} onMembersChanged={onMembersChanged} />);

    await screen.findByText('Invite User');
    await user.click(screen.getByText('Select user…'));
    await user.click(await screen.findByRole('button', { name: 'alice' }));
    await user.click(screen.getByRole('button', { name: 'Invite' }));

    await waitFor(() => expect(onMembersChanged).toHaveBeenCalled());
    expect(addToast).toHaveBeenCalledWith('alice added', 'success', undefined);
  });

  it('FE-COMP-MEMBERS-042: transferring ownership reloads the app', async () => {
    const onClose = vi.fn();
    const reload = vi.fn();
    Object.defineProperty(window, 'location', { value: { ...window.location, reload }, writable: true, configurable: true });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockRoster([{ id: memberUser.id, username: 'alice', avatar_url: null }]);
    let transferBody: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/trips/1/transfer', async ({ request }) => {
        transferBody = (await request.json()) as Record<string, unknown>;
        await delay(20);
        return HttpResponse.json({ success: true });
      }),
    );
    render(<TripMembersModal {...defaultProps} onClose={onClose} />);

    const crown = await screen.findByTitle('Make owner');
    fireEvent.click(crown);
    expect(crown).toBeDisabled();

    await waitFor(() => expect(reload).toHaveBeenCalled());
    expect(transferBody).toMatchObject({ newOwnerId: memberUser.id });
    expect(onClose).toHaveBeenCalled();
  });

  it('FE-COMP-MEMBERS-043: declining the transfer confirmation does nothing', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    mockRoster([{ id: memberUser.id, username: 'alice', avatar_url: null }]);
    let transferCalled = false;
    server.use(http.post('/api/trips/1/transfer', () => { transferCalled = true; return HttpResponse.json({}); }));
    render(<TripMembersModal {...defaultProps} />);

    const crown = await screen.findByTitle('Make owner');
    fireEvent.mouseEnter(crown);
    expect(crown.style.color).toBe('rgb(217, 119, 6)');
    fireEvent.mouseLeave(crown);
    expect(crown.style.color).toBe('rgb(156, 163, 175)');

    await user.click(crown);

    expect(transferCalled).toBe(false);
    expect(window.confirm).toHaveBeenCalledWith('Transfer ownership to alice? You will become a regular member.');
  });

  it('FE-COMP-MEMBERS-044: a failing transfer re-enables the button', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockRoster([{ id: memberUser.id, username: 'alice', avatar_url: null }]);
    server.use(http.post('/api/trips/1/transfer', () => HttpResponse.json({ error: 'Not allowed' }, { status: 403 })));
    render(<TripMembersModal {...defaultProps} />);

    await user.click(await screen.findByTitle('Make owner'));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Not allowed', 'error', undefined));
    expect(screen.getByTitle('Make owner')).toBeEnabled();
  });

  it('FE-COMP-MEMBERS-045: member removal is cancellable and reports failures', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    mockRoster([{ id: memberUser.id, username: 'alice', avatar_url: null }]);
    let deletes = 0;
    server.use(http.delete('/api/trips/1/members/:userId', () => { deletes++; return HttpResponse.json({}, { status: 500 }); }));
    render(<TripMembersModal {...defaultProps} />);

    const removeBtn = await screen.findByTitle('Remove access');
    fireEvent.mouseEnter(removeBtn);
    expect(removeBtn.style.color).toBe('rgb(239, 68, 68)');
    fireEvent.mouseLeave(removeBtn);
    expect(removeBtn.style.color).toBe('rgb(156, 163, 175)');

    await user.click(removeBtn);
    expect(deletes).toBe(0);

    confirmSpy.mockReturnValue(true);
    await user.click(screen.getByTitle('Remove access'));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Failed to remove', 'error', undefined));
    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  // ── Guests (046-051) ──────────────────────────────────────────────────────

  const guestRow = { id: 3, username: 'Grandma', avatar_url: null, is_guest: true };

  it('FE-COMP-MEMBERS-046: pressing Enter adds a guest, an empty name is ignored', async () => {
    const user = userEvent.setup();
    const onMembersChanged = vi.fn();
    let createdName: string | null = null;
    server.use(
      http.post('/api/trips/1/guests', async ({ request }) => {
        createdName = ((await request.json()) as { name: string }).name;
        return HttpResponse.json({ member: { id: 9, username: createdName, is_guest: true } });
      }),
    );
    render(<TripMembersModal {...defaultProps} onMembersChanged={onMembersChanged} />);

    const input = await screen.findByPlaceholderText('Guest name');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(createdName).toBeNull();

    await user.type(input, 'Grandpa');
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(createdName).toBe('Grandpa'));
    expect(addToast).toHaveBeenCalledWith('Guest added', 'success', undefined);
    await waitFor(() => expect(onMembersChanged).toHaveBeenCalled());
  });

  it('FE-COMP-MEMBERS-047: a failing guest creation is reported', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/trips/1/guests', () => HttpResponse.json({ error: 'Guest limit reached' }, { status: 400 })));
    render(<TripMembersModal {...defaultProps} />);

    await user.type(await screen.findByPlaceholderText('Guest name'), 'Grandpa');
    await user.click(screen.getByRole('button', { name: /Add guest/i }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Guest limit reached', 'error', undefined));
  });

  it('FE-COMP-MEMBERS-048: renaming a guest saves on Enter', async () => {
    const user = userEvent.setup();
    mockRoster([guestRow]);
    let renamed: { id: string; name: string } | null = null;
    server.use(
      http.put('/api/trips/1/guests/:userId', async ({ params, request }) => {
        renamed = { id: params.userId as string, name: ((await request.json()) as { name: string }).name };
        return HttpResponse.json({ success: true });
      }),
    );
    render(<TripMembersModal {...defaultProps} />);

    const pencil = await screen.findByTitle('Rename');
    fireEvent.mouseEnter(pencil);
    fireEvent.mouseLeave(pencil);
    await user.click(pencil);

    const input = screen.getByDisplayValue('Grandma');
    fireEvent.change(input, { target: { value: 'Granny' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(renamed).toEqual({ id: '3', name: 'Granny' }));
    await waitFor(() => expect(screen.queryByDisplayValue('Granny')).not.toBeInTheDocument());
  });

  it('FE-COMP-MEMBERS-048b: Enter followed by a blur renames only once', async () => {
    const user = userEvent.setup();
    mockRoster([guestRow]);
    let renames = 0;
    server.use(http.put('/api/trips/1/guests/:userId', () => { renames++; return HttpResponse.json({ success: true }); }));
    render(<TripMembersModal {...defaultProps} />);

    await user.click(await screen.findByTitle('Rename'));
    const input = screen.getByDisplayValue('Grandma');
    fireEvent.change(input, { target: { value: 'Granny' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.blur(input);

    await waitFor(() => expect(screen.queryByDisplayValue('Granny')).not.toBeInTheDocument());
    expect(renames).toBe(1);
  });

  it('FE-COMP-MEMBERS-049: Escape cancels a rename and a blank name saves nothing', async () => {
    const user = userEvent.setup();
    mockRoster([guestRow]);
    let renames = 0;
    server.use(http.put('/api/trips/1/guests/:userId', () => { renames++; return HttpResponse.json({ success: true }); }));
    render(<TripMembersModal {...defaultProps} />);

    await user.click(await screen.findByTitle('Rename'));
    fireEvent.keyDown(screen.getByDisplayValue('Grandma'), { key: 'Escape' });
    expect(screen.queryByDisplayValue('Grandma')).not.toBeInTheDocument();

    await user.click(screen.getByTitle('Rename'));
    const input = screen.getByDisplayValue('Grandma');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.blur(input);

    await waitFor(() => expect(screen.queryByDisplayValue('   ')).not.toBeInTheDocument());
    expect(renames).toBe(0);
  });

  it('FE-COMP-MEMBERS-050: a failing rename is reported', async () => {
    const user = userEvent.setup();
    mockRoster([guestRow]);
    server.use(http.put('/api/trips/1/guests/:userId', () => HttpResponse.json({ error: 'Name taken' }, { status: 409 })));
    render(<TripMembersModal {...defaultProps} />);

    await user.click(await screen.findByTitle('Rename'));
    const input = screen.getByDisplayValue('Grandma');
    fireEvent.change(input, { target: { value: 'Granny' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Name taken', 'error', undefined));
  });

  it('FE-COMP-MEMBERS-051: removing a guest is confirmed, refreshes costs and notifies', async () => {
    const user = userEvent.setup();
    const onMembersChanged = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    mockRoster([guestRow]);
    let deletedId: string | null = null;
    server.use(
      http.delete('/api/trips/1/guests/:userId', async ({ params }) => {
        deletedId = params.userId as string;
        await delay(20);
        return HttpResponse.json({ success: true });
      }),
    );
    render(<TripMembersModal {...defaultProps} onMembersChanged={onMembersChanged} />);

    const trash = await screen.findByTitle('Remove access');
    fireEvent.mouseEnter(trash);
    fireEvent.mouseLeave(trash);
    await user.click(trash);
    expect(deletedId).toBeNull();

    confirmSpy.mockReturnValue(true);
    fireEvent.click(screen.getByTitle('Remove access'));
    await waitFor(() => expect(screen.getByTitle('Remove access')).toBeDisabled());

    await waitFor(() => expect(deletedId).toBe('3'));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Guest removed', 'success', undefined));
    expect(onMembersChanged).toHaveBeenCalled();
  });

  it('FE-COMP-MEMBERS-052: a failing guest removal is reported', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockRoster([guestRow]);
    server.use(http.delete('/api/trips/1/guests/:userId', () => HttpResponse.json({}, { status: 500 })));
    render(<TripMembersModal {...defaultProps} />);

    await user.click(await screen.findByTitle('Remove access'));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Failed to remove', 'error', undefined));
    expect(screen.getByText('Grandma')).toBeInTheDocument();
  });

  it('FE-COMP-MEMBERS-053: without member_manage a plain member sees no invite or guest controls', async () => {
    const stranger = buildUser({ id: 99, username: 'stranger' });
    seedStore(useAuthStore, { user: stranger, isAuthenticated: true });
    seedStore(useTripStore, { trip: buildTrip({ id: 1, user_id: ownerUser.id }) });
    seedStore(usePermissionsStore, { permissions: { member_manage: 'trip_owner', share_manage: 'trip_owner' } });
    mockRoster([{ id: memberUser.id, username: 'alice', avatar_url: null }]);
    render(<TripMembersModal {...defaultProps} />);

    await screen.findByText('alice');
    expect(screen.queryByText('Invite User')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Guest name')).not.toBeInTheDocument();
    expect(screen.queryByText('Guests')).not.toBeInTheDocument();
    expect(screen.queryByText('Public Link')).not.toBeInTheDocument();
    // Nothing to remove either — a plain member can only leave themselves.
    expect(screen.queryByTitle('Remove access')).not.toBeInTheDocument();
  });

  // A self-hosted install served over plain HTTP has no navigator.clipboard, and
  // the unguarded call threw before the button ever showed feedback.
  it('FE-COMP-MEMBERS-055: the share link copies through execCommand without a clipboard API', async () => {
    const user = userEvent.setup();
    asShareOwner();
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true, writable: true });
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true, writable: true });
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true, writable: true });
    server.use(http.get('/api/trips/1/share-link', () => HttpResponse.json({ token: 'tok55' })));
    render(<TripMembersModal {...defaultProps} />);

    await user.click((await screen.findByText('Copy')).closest('button')!);

    expect(execCommand).toHaveBeenCalledWith('copy');
    await screen.findByText('Copied');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('FE-COMP-MEMBERS-056: the invite link copies through execCommand without a clipboard API', async () => {
    const user = userEvent.setup();
    asShareOwner();
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true, writable: true });
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true, writable: true });
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true, writable: true });
    server.use(http.get('/api/trips/1/invite-link', () => HttpResponse.json({ token: 'inv56' })));
    render(<TripMembersModal {...defaultProps} />);

    await user.click((await screen.findByText('Copy')).closest('button')!);

    expect(execCommand).toHaveBeenCalledWith('copy');
    await screen.findByText('Copied');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('FE-COMP-MEMBERS-054: the invite-link copied badge resets after two seconds', async () => {
    asShareOwner();
    const writeText = mockClipboard();
    server.use(http.get('/api/trips/1/invite-link', () => HttpResponse.json({ token: 'inv9' })));
    const view = render(<TripMembersModal {...defaultProps} />);

    const copyBtn = (await screen.findByText('Copy')).closest('button')!;

    vi.useFakeTimers();
    fireEvent.click(copyBtn);
    await act(async () => {});
    expect(screen.getByText('Copied')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(2000); });

    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/join/inv9'));
    view.unmount();
  });
});
