import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MTripSettingsSheet from '../../../../src/mobile/screens/trip/sheets/MTripSettingsSheet';
import { useAuthStore } from '../../../../src/store/authStore';
import { usePermissionsStore } from '../../../../src/store/permissionsStore';
import { useTripStore } from '../../../../src/store/tripStore';
import { buildTrip, buildUser } from '../../../helpers/factories';
import { server } from '../../../helpers/msw/server';
import { render, screen, waitFor, within } from '../../../helpers/render';
import { resetAllStores, seedStore } from '../../../helpers/store';

// FE-MOB-TSET-001 to FE-MOB-TSET-008: the phone's trip settings, on useTripShare.

const owner = buildUser({ id: 1, username: 'owner' });
const alice = buildUser({ id: 2, username: 'alice' });

interface Row {
  id: number;
  username: string;
  avatar_url?: string | null;
  is_guest?: boolean;
}

function roster(members: Row[]) {
  server.use(
    http.get('/api/trips/1/members', () =>
      HttpResponse.json({
        owner: { id: owner.id, username: owner.username, avatar_url: null },
        members,
        current_user_id: owner.id,
      })
    )
  );
}

function renderSheet(props: Partial<Parameters<typeof MTripSettingsSheet>[0]> = {}) {
  const onClose = vi.fn();
  const onMembersChanged = vi.fn();
  render(
    <MTripSettingsSheet
      open
      onClose={onClose}
      tripId={1}
      tripTitle="Japan 2026"
      onMembersChanged={onMembersChanged}
      {...props}
    />
  );
  return { onClose, onMembersChanged };
}

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { user: owner, isAuthenticated: true });
  seedStore(useTripStore, { trip: buildTrip({ id: 1, title: 'Japan 2026', user_id: owner.id }) });
  roster([]);
  server.use(
    http.get('/api/trips/1/share-link', () => HttpResponse.json({ token: null })),
    http.get('/api/trips/1/invite-link', () => HttpResponse.json({ token: null })),
    http.get('/api/auth/users', () => HttpResponse.json({ users: [alice] }))
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MTripSettingsSheet', () => {
  it('FE-MOB-TSET-001: names the trip in its header and the owner with their badges', async () => {
    renderSheet();
    const sheet = screen.getByRole('dialog', { name: 'Trip settings' });
    expect(within(sheet).getByText('Japan 2026')).toBeInTheDocument();
    expect(await within(sheet).findByText('owner')).toBeInTheDocument();
    expect(within(sheet).getByText('you')).toBeInTheDocument();
    expect(within(sheet).getByText('Owner')).toBeInTheDocument();
  });

  it('FE-MOB-TSET-002: asks in a sheet of its own before a member goes, and only then removes', async () => {
    const user = userEvent.setup();
    roster([{ id: alice.id, username: 'alice', avatar_url: null }]);
    let deletes = 0;
    server.use(
      http.delete('/api/trips/1/members/:userId', () => {
        deletes++;
        return HttpResponse.json({ success: true });
      })
    );
    const { onMembersChanged } = renderSheet();

    await user.click(await screen.findByRole('button', { name: 'Remove access' }));
    const question = await screen.findByRole('dialog', { name: 'Remove access' });
    expect(within(question).getByText('Remove access for this user?')).toBeInTheDocument();
    expect(deletes).toBe(0);

    await user.click(within(question).getByRole('button', { name: 'Remove access' }));
    await waitFor(() => expect(deletes).toBe(1));
    await waitFor(() => expect(onMembersChanged).toHaveBeenCalled());
  });

  it('FE-MOB-TSET-003: a question that is cancelled changes nothing', async () => {
    const user = userEvent.setup();
    roster([{ id: alice.id, username: 'alice', avatar_url: null }]);
    let transfers = 0;
    server.use(
      http.post('/api/trips/1/transfer', () => {
        transfers++;
        return HttpResponse.json({ success: true });
      })
    );
    renderSheet();

    await user.click(await screen.findByRole('button', { name: 'Make owner' }));
    const question = await screen.findByRole('dialog', { name: 'Make owner' });
    await user.click(within(question).getByRole('button', { name: 'Cancel' }));
    expect(transfers).toBe(0);
  });

  it('FE-MOB-TSET-004: a guest is added, renamed and removed', async () => {
    const user = userEvent.setup();
    roster([{ id: 3, username: 'Grandma', avatar_url: null, is_guest: true }]);
    let created: string | null = null;
    let renamed: string | null = null;
    let deleted = false;
    server.use(
      http.post('/api/trips/1/guests', async ({ request }) => {
        created = ((await request.json()) as { name: string }).name;
        return HttpResponse.json({ success: true });
      }),
      http.put('/api/trips/1/guests/:userId', async ({ request }) => {
        renamed = ((await request.json()) as { name: string }).name;
        return HttpResponse.json({ success: true });
      }),
      http.delete('/api/trips/1/guests/:userId', () => {
        deleted = true;
        return HttpResponse.json({ success: true });
      })
    );
    renderSheet();

    expect(await screen.findByText('Grandma')).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Guest name'), 'Grandpa');
    await user.click(screen.getByRole('button', { name: 'Add guest' }));
    await waitFor(() => expect(created).toBe('Grandpa'));

    await user.click(screen.getByRole('button', { name: 'Rename' }));
    const input = screen.getByDisplayValue('Grandma');
    await user.clear(input);
    await user.type(input, 'Granny{Enter}');
    await waitFor(() => expect(renamed).toBe('Granny'));

    const removeGuest = screen.getAllByRole('button', { name: 'Remove access' });
    await user.click(removeGuest[removeGuest.length - 1]);
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Remove access' })).getByRole('button', {
        name: 'Remove access',
      })
    );
    await waitFor(() => expect(deleted).toBe(true));
  });

  it('FE-MOB-TSET-005: the public link toggles say whether they are on (#2604)', async () => {
    seedStore(usePermissionsStore, { permissions: { share_manage: 'trip_owner' } });
    server.use(
      http.get('/api/trips/1/share-link', () =>
        HttpResponse.json({
          token: 'abc123',
          share_map: true,
          share_bookings: true,
          share_packing: false,
          share_budget: false,
          share_collab: false,
        })
      )
    );
    renderSheet();

    expect(await screen.findByRole('button', { name: 'Bookings' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Costs' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByDisplayValue(/\/shared\/abc123$/)).toBeInTheDocument();
  });

  it('FE-MOB-TSET-006: a public link is created with what it should show', async () => {
    const user = userEvent.setup();
    seedStore(usePermissionsStore, { permissions: { share_manage: 'trip_owner' } });
    let body: Record<string, boolean> | null = null;
    server.use(
      http.post('/api/trips/1/share-link', async ({ request }) => {
        body = (await request.json()) as Record<string, boolean>;
        return HttpResponse.json({ token: 'fresh' });
      })
    );
    renderSheet();

    await user.click(await screen.findByRole('button', { name: 'Packing' }));
    await user.click(screen.getByRole('button', { name: 'Create link' }));
    await waitFor(() => expect(body).toMatchObject({ share_map: true, share_packing: true }));
    expect(await screen.findByDisplayValue(/\/shared\/fresh$/)).toBeInTheDocument();
  });

  it('FE-MOB-TSET-007: the invite link is created and switched off again', async () => {
    const user = userEvent.setup();
    seedStore(usePermissionsStore, { permissions: { share_manage: 'trip_owner' } });
    let removed = false;
    server.use(
      http.post('/api/trips/1/invite-link', () => HttpResponse.json({ token: 'join1' })),
      http.delete('/api/trips/1/invite-link', () => {
        removed = true;
        return HttpResponse.json({ success: true });
      })
    );
    renderSheet();

    await user.click(await screen.findByRole('button', { name: 'Create invite link' }));
    expect(await screen.findByDisplayValue(/\/join\/join1$/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Disable' }));
    await waitFor(() => expect(removed).toBe(true));
  });

  it('FE-MOB-TSET-008: closes through its close button', async () => {
    const user = userEvent.setup();
    const { onClose } = renderSheet();
    await user.click(
      within(screen.getByRole('dialog', { name: 'Trip settings' })).getByRole('button', { name: 'Close' })
    );
    expect(onClose).toHaveBeenCalled();
  });
});
