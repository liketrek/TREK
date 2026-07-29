// FE-MOB-AUSERS-001 to FE-MOB-AUSERS-016
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen } from '../../../helpers/render';
import { resetAllStores } from '../../../helpers/store';
import { buildAdminHook, buildAdminUser, type AdminHook } from '../../../helpers/mobileAdmin';
import { useTranslation } from '../../../../src/i18n';
import MAdminUsersSection from '../../../../src/mobile/screens/admin/MAdminUsersSection';

// The permissions matrix self-loads and has its own suite — stub it out here.
vi.mock('../../../../src/mobile/screens/admin/MAdminPermissionsPanel', () => ({
  default: () => <div data-testid="permissions-panel" />,
}));

function Harness({ admin }: { admin: AdminHook }) {
  const { t, locale } = useTranslation();
  return <MAdminUsersSection admin={admin} t={t} locale={locale} />;
}

function renderSection(overrides: Record<string, unknown> = {}) {
  const admin = buildAdminHook(overrides);
  render(<Harness admin={admin} />);
  return admin as unknown as Record<string, ReturnType<typeof vi.fn>>;
}

interface InviteForm {
  max_uses: number;
  expires_in_days: number | '';
  trip_id: number | '';
}

/**
 * The invite form controls read e.target.value inside the state updater, so the
 * spy fixture can't be inspected after the fact — the sheet needs real state to
 * show what a chip or the trip select actually writes.
 */
function InviteFormHarness({ overrides }: { overrides: Record<string, unknown> }) {
  const { t, locale } = useTranslation();
  const [inviteForm, setInviteForm] = React.useState<InviteForm>({
    max_uses: 1,
    expires_in_days: 7,
    trip_id: '',
  });
  const admin = buildAdminHook({ showCreateInvite: true, ...overrides, inviteForm, setInviteForm });
  return <MAdminUsersSection admin={admin} t={t} locale={locale} />;
}

function isActiveChip(el: HTMLElement): boolean {
  return el.className.includes('bg-m-act');
}

const ME = buildAdminUser({ id: 1, username: 'admin', email: 'admin@example.com', role: 'admin' });
const ALICE = buildAdminUser({ id: 2, username: 'alice', email: 'alice@example.com', role: 'user' });

function buildInvite(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    token: 'abcdefghijklmnop',
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

describe('MAdminUsersSection', () => {
  it('FE-MOB-AUSERS-001: lists users with role badges, the "you" marker and the count', () => {
    renderSection({ users: [ME, ALICE], currentUser: ME });

    expect(screen.getByText('2 users')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('(You)')).toBeInTheDocument();
  });

  it('FE-MOB-AUSERS-002: users without an avatar get an initial, users with one get the image', () => {
    renderSection({ users: [ALICE, buildAdminUser({ id: 3, username: 'bob', avatar_url: '/uploads/bob.png' })] });

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByRole('presentation')).toHaveAttribute('src', '/uploads/bob.png');
  });

  it('FE-MOB-AUSERS-003: the spinner replaces the list while users are loading', () => {
    renderSection({ users: [ALICE], isLoading: true });

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('alice')).not.toBeInTheDocument();
  });

  it('FE-MOB-AUSERS-004: tapping a row opens the edit sheet for that user', async () => {
    const user = userEvent.setup();
    const admin = renderSection({ users: [ME, ALICE], currentUser: ME });

    await user.click(screen.getByText('alice'));

    expect(admin.handleEditUser).toHaveBeenCalledWith(ALICE);
  });

  it('FE-MOB-AUSERS-005: the New user button opens the create sheet', async () => {
    const user = userEvent.setup();
    const admin = renderSection();

    await user.click(screen.getByRole('button', { name: 'New user' }));

    expect(admin.setShowCreateUser).toHaveBeenCalledWith(true);
  });

  it('FE-MOB-AUSERS-006: the invite card shows its empty state without invites', () => {
    renderSection();

    expect(screen.getByText('Invite Links')).toBeInTheDocument();
    expect(screen.getByText('No invite links created yet')).toBeInTheDocument();
  });

  it('FE-MOB-AUSERS-007: an active invite shows the truncated token, usage and copy action', () => {
    renderSection({ invites: [buildInvite()] });

    expect(screen.getByText('abcdefghijkl…')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText(/1\/3 used/)).toBeInTheDocument();
    expect(screen.getByText(/by admin/)).toBeInTheDocument();
    expect(screen.getByTitle('Copy link')).toBeInTheDocument();
  });

  it('FE-MOB-AUSERS-008: unlimited uses render as ∞ and an expiry/trip line is appended', () => {
    renderSection({
      invites: [
        buildInvite({ max_uses: 0, used_count: 4, expires_at: '2099-01-02T00:00:00Z', trip_title: 'Japan' }),
      ],
    });

    expect(screen.getByText(/4\/∞ used/)).toBeInTheDocument();
    expect(screen.getByText(/expires 1\/2\/2099/)).toBeInTheDocument();
    expect(screen.getByText(/adds to Japan/)).toBeInTheDocument();
  });

  it('FE-MOB-AUSERS-009: expired and used-up invites lose the copy action', () => {
    renderSection({
      invites: [
        buildInvite({ id: 1, token: 'expired-token-xx', expires_at: '2020-01-01T00:00:00Z' }),
        buildInvite({ id: 2, token: 'usedup-token-xxx', max_uses: 2, used_count: 2 }),
      ],
    });

    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.getByText('Used up')).toBeInTheDocument();
    expect(screen.queryByTitle('Copy link')).not.toBeInTheDocument();
    expect(screen.getAllByTitle('Delete')).toHaveLength(2);
  });

  it('FE-MOB-AUSERS-010: copy and delete hit the handlers with token and id', async () => {
    const user = userEvent.setup();
    const admin = renderSection({ invites: [buildInvite({ id: 7, token: 'abcdefghijklmnop' })] });

    await user.click(screen.getByTitle('Copy link'));
    expect(admin.copyInviteLink).toHaveBeenCalledWith('abcdefghijklmnop');

    await user.click(screen.getByTitle('Delete'));
    expect(admin.handleDeleteInvite).toHaveBeenCalledWith(7);
  });

  it('FE-MOB-AUSERS-011: the create-invite sheet is closed until showCreateInvite flips', async () => {
    const user = userEvent.setup();
    const admin = renderSection();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create Link' }));
    expect(admin.setShowCreateInvite).toHaveBeenCalledWith(true);
  });

  it('FE-MOB-AUSERS-012: the open sheet marks the active max-uses and expiry chips', () => {
    renderSection({ showCreateInvite: true, inviteForm: { max_uses: 3, expires_in_days: '', trip_id: '' } });

    expect(screen.getByRole('dialog', { name: 'Create Link' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3×' }).className).toContain('bg-m-act');
    expect(screen.getByRole('button', { name: '1×' }).className).not.toContain('bg-m-act');
    // Both chip rows end in ∞ — max uses (unlimited) and expiry (never)
    const [unlimitedUses, neverExpires] = screen.getAllByRole('button', { name: '∞' });
    expect(unlimitedUses.className).not.toContain('bg-m-act');
    expect(neverExpires.className).toContain('bg-m-act');
  });

  it('FE-MOB-AUSERS-013: chips patch only their own field of the invite form', async () => {
    const user = userEvent.setup();
    render(<InviteFormHarness overrides={{}} />);

    await user.click(screen.getByRole('button', { name: '5×' }));
    expect(isActiveChip(screen.getByRole('button', { name: '5×' }))).toBe(true);
    expect(isActiveChip(screen.getByRole('button', { name: '1×' }))).toBe(false);
    // The expiry row is untouched: 7d is still the active chip
    expect(isActiveChip(screen.getByRole('button', { name: '7d' }))).toBe(true);

    await user.click(screen.getByRole('button', { name: '14d' }));
    expect(isActiveChip(screen.getByRole('button', { name: '14d' }))).toBe(true);
    expect(isActiveChip(screen.getByRole('button', { name: '7d' }))).toBe(false);
    expect(isActiveChip(screen.getByRole('button', { name: '5×' }))).toBe(true);
  });

  it('FE-MOB-AUSERS-014: the trip select is hidden without trips', () => {
    renderSection({ showCreateInvite: true });

    expect(screen.getByRole('dialog', { name: 'Create Link' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByText('Add to trip (optional)')).not.toBeInTheDocument();
  });

  it('FE-MOB-AUSERS-015: the trip select stores the numeric id and maps "No trip" back to ""', async () => {
    const user = userEvent.setup();
    const handleCreateInvite = vi.fn();
    render(
      <InviteFormHarness
        overrides={{ inviteTrips: [{ id: 4, title: 'Japan 2026' }], handleCreateInvite }}
      />,
    );

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(screen.getByRole('option', { name: 'No trip' })).toBeInTheDocument();
    expect(select.value).toBe('');

    fireEvent.change(select, { target: { value: '4' } });
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('4');

    fireEvent.change(select, { target: { value: '' } });
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('');

    await user.click(screen.getByRole('button', { name: 'Create & Copy' }));
    expect(handleCreateInvite).toHaveBeenCalled();
  });

  it('FE-MOB-AUSERS-016: cancel, close and Escape all dismiss the sheet', async () => {
    const user = userEvent.setup();
    const admin = renderSection({ showCreateInvite: true });

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(admin.setShowCreateInvite).toHaveBeenCalledWith(false);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(admin.setShowCreateInvite).toHaveBeenCalledTimes(3);
  });
});
