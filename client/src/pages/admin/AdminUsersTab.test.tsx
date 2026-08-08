// FE-ADMUSR-001 to FE-ADMUSR-024
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '../../../tests/helpers/render';
import { buildAdminHook, buildAdminUser, type AdminHook } from '../../../tests/helpers/mobileAdmin';
import { resetAllStores } from '../../../tests/helpers/store';
import { useTranslation } from '../../i18n';
import AdminUsersTab from './AdminUsersTab';

vi.mock('../../components/Admin/PermissionsPanel', () => ({
  default: () => <div data-testid="permissions-panel" />,
}));

type Spies = Record<string, ReturnType<typeof vi.fn>>;
type InviteForm = { max_uses: number; expires_in_days: number | ''; trip_id: number | '' };

function Harness({ admin }: { admin: AdminHook }) {
  const { t, locale } = useTranslation();
  return <AdminUsersTab admin={admin} t={t} locale={locale} />;
}

function renderTab(overrides: Record<string, unknown> = {}) {
  const admin = buildAdminHook(overrides);
  render(<Harness admin={admin} />);
  return admin as unknown as Spies;
}

/** Replays the functional updater a setInviteForm spy was called with. */
function replayInviteForm(spy: ReturnType<typeof vi.fn>, callIndex: number): InviteForm {
  const updater = spy.mock.calls[callIndex][0] as (f: InviteForm) => InviteForm;
  return updater({ max_uses: 1, expires_in_days: 7, trip_id: '' });
}

const alice = buildAdminUser({
  id: 2,
  username: 'alice',
  email: 'alice@example.com',
  role: 'user',
  created_at: '2025-03-04T00:00:00.000Z',
  last_login: '2025-06-01T10:30:00.000Z',
  online: true,
});

const me = buildAdminUser({ id: 1, username: 'admin', email: 'admin@example.com', role: 'admin' });

function buildInvite(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    token: 'abcdefghijkl-rest-of-token',
    max_uses: 3,
    used_count: 1,
    expires_at: null,
    trip_title: null,
    created_by_name: 'admin',
    ...overrides,
  };
}

beforeEach(() => {
  resetAllStores();
});

describe('AdminUsersTab', () => {
  it('FE-ADMUSR-001: renders the spinner while loading instead of the table', () => {
    renderTab({ isLoading: true, users: [me] });

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText('admin')).not.toBeInTheDocument();
  });

  it('FE-ADMUSR-002: renders one row per user with email and role badge', () => {
    renderTab({ users: [me, alice], currentUser: me });

    const aliceRow = screen.getByText('alice').closest('tr')!;
    expect(within(aliceRow).getByText('alice@example.com')).toBeInTheDocument();
    expect(within(aliceRow).getByText('User')).toBeInTheDocument();

    const adminRow = screen.getByText('admin').closest('tr')!;
    expect(within(adminRow).getByText('Administrator')).toBeInTheDocument();
  });

  it('FE-ADMUSR-003: shows the user count in the card subtitle', () => {
    renderTab({ users: [me, alice] });

    expect(screen.getByText('2 Users')).toBeInTheDocument();
  });

  it('FE-ADMUSR-004: marks the current user with the "(You)" hint', () => {
    renderTab({ users: [me, alice], currentUser: me });

    const adminRow = screen.getByText('admin').closest('tr')!;
    expect(within(adminRow).getByText('(You)')).toBeInTheDocument();
  });

  it('FE-ADMUSR-005: renders the avatar image when avatar_url is set, initial otherwise', () => {
    renderTab({
      users: [buildAdminUser({ id: 3, username: 'bob', avatar_url: '/uploads/avatars/bob.jpg' }), alice],
    });

    expect(screen.getByRole('img', { name: 'bob' })).toHaveAttribute('src', '/uploads/avatars/bob.jpg');
    // alice has no avatar → first letter fallback
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('FE-ADMUSR-006: renders an em dash when the user never logged in', () => {
    renderTab({ users: [buildAdminUser({ id: 4, username: 'never', last_login: null })] });

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('FE-ADMUSR-007: opens the create-user modal from the header button', () => {
    const admin = renderTab({ users: [me] });

    fireEvent.click(screen.getByRole('button', { name: /create user/i }));

    expect(admin.setShowCreateUser).toHaveBeenCalledWith(true);
  });

  it('FE-ADMUSR-008: edit button forwards the row user to handleEditUser', () => {
    const admin = renderTab({ users: [me, alice], currentUser: me });

    const editButtons = screen.getAllByTitle('Edit User');
    fireEvent.click(editButtons[1]);

    expect(admin.handleEditUser).toHaveBeenCalledWith(alice);
  });

  it('FE-ADMUSR-009: delete button forwards the row user to handleDeleteUser', () => {
    const admin = renderTab({ users: [me, alice], currentUser: me });

    const deleteButtons = screen.getAllByTitle('Delete user');
    fireEvent.click(deleteButtons[1]);

    expect(admin.handleDeleteUser).toHaveBeenCalledWith(alice);
  });

  it('FE-ADMUSR-010: the delete button of the current user is disabled', () => {
    renderTab({ users: [me, alice], currentUser: me });

    const deleteButtons = screen.getAllByTitle('Delete user');
    expect(deleteButtons[0]).toBeDisabled();
    expect(deleteButtons[1]).not.toBeDisabled();
  });

  it('FE-ADMUSR-011: shows the invite empty state when there are no invites', () => {
    renderTab({ invites: [] });

    expect(screen.getByText('No invite links created yet')).toBeInTheDocument();
  });

  it('FE-ADMUSR-012: renders an active invite with truncated token and usage', () => {
    renderTab({ invites: [buildInvite()] });

    expect(screen.getByText('abcdefghijkl...')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText(/1\/3 used/)).toBeInTheDocument();
    expect(screen.getByText(/by admin/)).toBeInTheDocument();
  });

  it('FE-ADMUSR-013: renders unlimited uses as infinity', () => {
    renderTab({ invites: [buildInvite({ max_uses: 0, used_count: 4 })] });

    expect(screen.getByText(/4\/∞ used/)).toBeInTheDocument();
  });

  it('FE-ADMUSR-014: marks an invite past its expiry as expired and hides copy', () => {
    renderTab({ invites: [buildInvite({ expires_at: '2020-01-01T00:00:00.000Z' })] });

    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.queryByTitle('Copy link')).not.toBeInTheDocument();
  });

  it('FE-ADMUSR-015: marks an invite at its use limit as used up', () => {
    renderTab({ invites: [buildInvite({ max_uses: 2, used_count: 2 })] });

    expect(screen.getByText('Used up')).toBeInTheDocument();
  });

  it('FE-ADMUSR-016: shows the bound trip for a trip-scoped invite', () => {
    renderTab({ invites: [buildInvite({ trip_title: 'Iceland' })] });

    expect(screen.getByText(/adds to Iceland/)).toBeInTheDocument();
  });

  it('FE-ADMUSR-017: copy and delete buttons forward the invite token / id', () => {
    const admin = renderTab({ invites: [buildInvite()] });

    fireEvent.click(screen.getByTitle('Copy link'));
    expect(admin.copyInviteLink).toHaveBeenCalledWith('abcdefghijkl-rest-of-token');

    fireEvent.click(screen.getByTitle('Delete'));
    expect(admin.handleDeleteInvite).toHaveBeenCalledWith(10);
  });

  it('FE-ADMUSR-018: create-invite modal picks max uses and expiry', () => {
    const admin = renderTab({ showCreateInvite: true });

    fireEvent.click(screen.getByRole('button', { name: '5×' }));
    expect(replayInviteForm(admin.setInviteForm, 0).max_uses).toBe(5);

    fireEvent.click(screen.getByRole('button', { name: '14d' }));
    expect(replayInviteForm(admin.setInviteForm, 1).expires_in_days).toBe(14);
  });

  it('FE-ADMUSR-019: unlimited uses and never-expiring are selectable', () => {
    const admin = renderTab({ showCreateInvite: true });

    const infinityButtons = screen.getAllByRole('button', { name: '∞' });
    fireEvent.click(infinityButtons[0]); // max_uses = 0
    expect(replayInviteForm(admin.setInviteForm, 0).max_uses).toBe(0);

    fireEvent.click(infinityButtons[1]); // expires_in_days = ''
    expect(replayInviteForm(admin.setInviteForm, 1).expires_in_days).toBe('');
  });

  it('FE-ADMUSR-020: create-invite modal only offers the trip picker when trips exist', () => {
    renderTab({ showCreateInvite: true, inviteTrips: [] });
    expect(screen.queryByText('Add to trip (optional)')).not.toBeInTheDocument();

    renderTab({ showCreateInvite: true, inviteTrips: [{ id: 7, title: 'Iceland' }] });
    expect(screen.getByText('Add to trip (optional)')).toBeInTheDocument();
  });

  it('FE-ADMUSR-021: create-invite modal wires cancel and submit', () => {
    const admin = renderTab({ showCreateInvite: true });

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(admin.setShowCreateInvite).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByRole('button', { name: /create & copy/i }));
    expect(admin.handleCreateInvite).toHaveBeenCalledTimes(1);
  });

  it('FE-ADMUSR-022: selecting a trip in the picker stores its numeric id', () => {
    const admin = renderTab({ showCreateInvite: true, inviteTrips: [{ id: 7, title: 'Iceland' }] });

    fireEvent.click(screen.getByText('No trip'));
    fireEvent.click(screen.getByText('Iceland'));

    expect(replayInviteForm(admin.setInviteForm, 0).trip_id).toBe(7);
  });

  it('FE-ADMUSR-023: renders the permissions panel below the invite list', () => {
    renderTab({});

    expect(screen.getByTestId('permissions-panel')).toBeInTheDocument();
  });

  it('FE-ADMUSR-024: the invite modal X button closes it', () => {
    const admin = renderTab({ showCreateInvite: true });

    const header = screen
      .getByRole('heading', { name: 'Create Link' })
      .closest<HTMLElement>('div.flex.items-center.justify-between')!;
    fireEvent.click(within(header).getByRole('button'));

    expect(admin.setShowCreateInvite).toHaveBeenCalledWith(false);
  });
});
