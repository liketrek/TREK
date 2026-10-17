// FE-ADMMOD-001 to FE-ADMMOD-027
import { http, HttpResponse } from 'msw';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../tests/helpers/msw/server';
import { fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
import { buildAdminHook, buildAdminUser, type AdminHook } from '../../../tests/helpers/mobileAdmin';
import { resetAllStores } from '../../../tests/helpers/store';
import { useTranslation } from '../../i18n';
import type { UpdateInfo } from './adminModel';
import AdminUserModals from './AdminUserModals';

type Spy = ReturnType<typeof vi.fn>;
type Spies = Record<string, Spy> & { toast: Record<string, Spy> };

function Harness({ admin }: { admin: AdminHook }) {
  const { t } = useTranslation();
  return <AdminUserModals admin={admin} t={t} />;
}

function renderModals(overrides: Record<string, unknown> = {}) {
  const admin = buildAdminHook(overrides);
  render(<Harness admin={admin} />);
  return admin as unknown as Spies;
}

const alice = buildAdminUser({ id: 2, username: 'alice', email: 'alice@example.com', role: 'user' });

type UserForm = { username: string; email: string; role: string; password: string };

/**
 * The form inputs hand their setter an updater that reads e.target.value lazily,
 * so a spy call can no longer be replayed once React re-rendered the controlled
 * input. These harnesses keep the form in real state instead.
 */
function CreateFormHarness() {
  const { t } = useTranslation();
  const [createForm, setCreateForm] = React.useState({ username: '', email: '', password: '', role: 'user' });
  const admin = buildAdminHook({ showCreateUser: true, createForm, setCreateForm });
  return <AdminUserModals admin={admin} t={t} />;
}

function EditFormHarness() {
  const { t } = useTranslation();
  const [editForm, setEditForm] = React.useState<UserForm>({
    username: 'alice',
    email: 'alice@example.com',
    role: 'user',
    password: '',
  });
  const admin = buildAdminHook({ editingUser: alice, editForm, setEditForm });
  return <AdminUserModals admin={admin} t={t} />;
}

/** Answers the confirm dialog: its button repeats the label and sits last in the document. */
function confirmPasskeyReset() {
  expect(screen.getByText('Remove all passkeys for alice?')).toBeInTheDocument();
  const buttons = screen.getAllByRole('button', { name: /reset passkeys/i });
  fireEvent.click(buttons[buttons.length - 1]);
}

const editing = {
  editingUser: alice,
  editForm: { username: 'alice', email: 'alice@example.com', role: 'user', password: '' },
};

function buildUpdateInfo(overrides: Partial<UpdateInfo> = {}): UpdateInfo {
  return { update_available: true, latest: '3.5.0', current: '3.4.1', ...overrides };
}

beforeEach(() => {
  resetAllStores();
});

afterEach(() => {
  server.resetHandlers();
});

describe('AdminUserModals', () => {
  it('FE-ADMMOD-001: renders no modal content while everything is closed', () => {
    renderModals();

    expect(screen.queryByText('Create User')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit User')).not.toBeInTheDocument();
    expect(screen.queryByText(/docker pull/)).not.toBeInTheDocument();
    expect(screen.queryByText('Rotate JWT Secret')).not.toBeInTheDocument();
  });

  it('FE-ADMMOD-002: the create-user modal shows all four fields', () => {
    renderModals({ showCreateUser: true });

    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('FE-ADMMOD-003: create-user inputs write through setCreateForm', () => {
    render(<CreateFormHarness />);

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'bob' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'bob@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'hunter2hunter2' } });

    expect(screen.getByPlaceholderText('Username')).toHaveValue('bob');
    expect(screen.getByPlaceholderText('Email')).toHaveValue('bob@example.com');
    expect(screen.getByPlaceholderText('Password')).toHaveValue('hunter2hunter2');
  });

  it('FE-ADMMOD-004: the create-user password can be revealed', () => {
    renderModals({ showCreateUser: true });

    const pw = screen.getByPlaceholderText('Password');
    expect(pw).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: /show or hide password/i }));
    expect(pw).toHaveAttribute('type', 'text');
  });

  it('FE-ADMMOD-005: picking a role in the create modal stores it as a string', () => {
    const admin = renderModals({ showCreateUser: true });

    fireEvent.click(screen.getByRole('button', { name: 'User' }));
    fireEvent.click(screen.getByText('Administrator'));

    const base = { username: '', email: '', password: '', role: 'user' };
    const updater = admin.setCreateForm.mock.calls[0][0] as (f: typeof base) => typeof base;
    expect(updater(base).role).toBe('admin');
  });

  it('FE-ADMMOD-006: the create modal cancel and submit buttons are wired', () => {
    const admin = renderModals({ showCreateUser: true });

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(admin.setShowCreateUser).toHaveBeenCalledWith(false);

    const buttons = screen.getAllByRole('button', { name: /create user/i });
    fireEvent.click(buttons[buttons.length - 1]);
    expect(admin.handleCreateUser).toHaveBeenCalledTimes(1);
  });

  it('FE-ADMMOD-007: the edit modal pre-fills the form from editForm', () => {
    renderModals(editing);

    expect(screen.getByDisplayValue('alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('alice@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter new password…')).toHaveValue('');
  });

  it('FE-ADMMOD-008: edit-modal inputs write through setEditForm', () => {
    render(<EditFormHarness />);

    fireEvent.change(screen.getByDisplayValue('alice'), { target: { value: 'alice2' } });
    fireEvent.change(screen.getByDisplayValue('alice@example.com'), { target: { value: 'a2@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter new password…'), { target: { value: 'newpassword1' } });

    expect(screen.getByDisplayValue('alice2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('a2@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter new password…')).toHaveValue('newpassword1');
  });

  it('FE-ADMMOD-009: the edit-modal password can be revealed', () => {
    renderModals(editing);

    const pw = screen.getByPlaceholderText('Enter new password…');
    expect(pw).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: /show or hide password/i }));
    expect(pw).toHaveAttribute('type', 'text');
  });

  it('FE-ADMMOD-010: picking a role in the edit modal stores it as a string', () => {
    const admin = renderModals(editing);

    fireEvent.click(screen.getByRole('button', { name: 'User' }));
    fireEvent.click(screen.getByText('Administrator'));

    const base = { username: 'alice', email: 'alice@example.com', role: 'user', password: '' };
    const updater = admin.setEditForm.mock.calls[0][0] as (f: typeof base) => typeof base;
    expect(updater(base).role).toBe('admin');
  });

  it('FE-ADMMOD-011: the edit modal cancel and save buttons are wired', () => {
    const admin = renderModals(editing);

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(admin.setEditingUser).toHaveBeenCalledWith(null);

    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(admin.handleSaveUser).toHaveBeenCalledTimes(1);
  });

  it('FE-ADMMOD-012: resetting passkeys is skipped when the confirm is cancelled', async () => {
    let calls = 0;
    server.use(
      http.delete('/api/admin/users/:id/passkeys', () => {
        calls += 1;
        return HttpResponse.json({ deleted: 1 });
      })
    );
    const admin = renderModals(editing);

    fireEvent.click(screen.getByRole('button', { name: /reset passkeys/i }));
    expect(screen.getByText('Remove all passkeys for alice?')).toBeInTheDocument();

    // The edit dialog has its own Cancel; the question's Cancel is the last one.
    const cancels = screen.getAllByRole('button', { name: /^cancel$/i });
    fireEvent.click(cancels[cancels.length - 1]);

    expect(screen.queryByText('Remove all passkeys for alice?')).not.toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 20));
    expect(calls).toBe(0);
    expect(admin.toast.success).not.toHaveBeenCalled();
    expect(admin.setEditingUser).not.toHaveBeenCalled();
  });

  it('FE-ADMMOD-013: a confirmed passkey reset reports how many were removed', async () => {
    let deletedFor: string | undefined;
    server.use(
      http.delete('/api/admin/users/:id/passkeys', ({ params }) => {
        deletedFor = params.id as string;
        return HttpResponse.json({ deleted: 3 });
      })
    );
    const admin = renderModals(editing);

    fireEvent.click(screen.getByRole('button', { name: /reset passkeys/i }));
    confirmPasskeyReset();

    await waitFor(() => expect(admin.toast.success).toHaveBeenCalledWith('Removed 3 passkeys'));
    expect(deletedFor).toBe('2');
  });

  it('FE-ADMMOD-014: a failing passkey reset toasts the generic error', async () => {
    server.use(http.delete('/api/admin/users/:id/passkeys', () => HttpResponse.json({}, { status: 500 })));
    const admin = renderModals(editing);

    fireEvent.click(screen.getByRole('button', { name: /reset passkeys/i }));
    confirmPasskeyReset();

    await waitFor(() => expect(admin.toast.error).toHaveBeenCalledWith('Error'));
  });

  it('FE-ADMMOD-015: the update popup shows the docker recipe by default', () => {
    renderModals({ showUpdateModal: true, updateInfo: buildUpdateInfo() });

    expect(screen.getByText('How to Update')).toBeInTheDocument();
    expect(screen.getByText('v3.4.1 → v3.5.0')).toBeInTheDocument();
    expect(screen.getByText(/docker pull mauriceboe\/trek:latest/)).toBeInTheDocument();
  });

  it('FE-ADMMOD-016: a non-docker install links to the wiki instead', () => {
    renderModals({ showUpdateModal: true, updateInfo: buildUpdateInfo({ is_docker: false }) });

    expect(screen.queryByText(/docker pull/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open the update guide/i })).toHaveAttribute(
      'href',
      'https://github.com/liketrek/TREK/wiki/Updating'
    );
  });

  it('FE-ADMMOD-017: the release link only renders when a release_url is known', () => {
    const { unmount } = render(
      <Harness admin={buildAdminHook({ showUpdateModal: true, updateInfo: buildUpdateInfo() })} />
    );
    expect(screen.queryByRole('link', { name: /view on github/i })).not.toBeInTheDocument();
    unmount();

    render(
      <Harness
        admin={buildAdminHook({
          showUpdateModal: true,
          updateInfo: buildUpdateInfo({ release_url: 'https://example.test/rel' }),
        })}
      />
    );
    expect(screen.getByRole('link', { name: /view on github/i })).toHaveAttribute('href', 'https://example.test/rel');
  });

  it('FE-ADMMOD-018: the update popup closes from the Close button', () => {
    const admin = renderModals({ showUpdateModal: true, updateInfo: buildUpdateInfo() });

    // The head band's X and the footer's Close button both close it.
    const closeButtons = screen.getAllByRole('button', { name: /^close$/i });
    expect(closeButtons).toHaveLength(2);
    fireEvent.click(closeButtons[closeButtons.length - 1]);

    expect(admin.setShowUpdateModal).toHaveBeenCalledWith(false);
  });

  it('FE-ADMMOD-019: the update popup closes on backdrop click but not on inner click', () => {
    const admin = renderModals({ showUpdateModal: true, updateInfo: buildUpdateInfo() });

    const inner = screen.getByRole('dialog');
    fireEvent.mouseDown(inner);
    fireEvent.click(inner);
    expect(admin.setShowUpdateModal).not.toHaveBeenCalled();

    const backdrop = inner.parentElement!;
    fireEvent.mouseDown(backdrop);
    fireEvent.click(backdrop);
    expect(admin.setShowUpdateModal).toHaveBeenCalledWith(false);
  });

  it('FE-ADMMOD-020: the rotate-JWT modal explains the consequences', () => {
    renderModals({ showRotateJwtModal: true });

    expect(screen.getByText(/invalidate all sessions/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rotate .* log out/i })).toBeInTheDocument();
  });

  it('FE-ADMMOD-021: cancelling the rotate-JWT modal closes it', () => {
    const admin = renderModals({ showRotateJwtModal: true });

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

    expect(admin.setShowRotateJwtModal).toHaveBeenCalledWith(false);
  });

  it('FE-ADMMOD-022: confirming the rotation logs out and navigates to login', async () => {
    let rotated = false;
    server.use(
      http.post('/api/admin/rotate-jwt-secret', () => {
        rotated = true;
        return HttpResponse.json({ success: true });
      })
    );
    const admin = renderModals({ showRotateJwtModal: true });

    fireEvent.click(screen.getByRole('button', { name: /rotate .* log out/i }));

    expect(admin.setRotatingJwt).toHaveBeenCalledWith(true);
    await waitFor(() => expect(rotated).toBe(true));
    await waitFor(() => expect(admin.logout).toHaveBeenCalledTimes(1));
    expect(admin.navigate).toHaveBeenCalledWith('/login', { state: { noRedirect: true } });
    expect(admin.setShowRotateJwtModal).toHaveBeenCalledWith(false);
  });

  it('FE-ADMMOD-023: a failing rotation keeps the modal open and toasts', async () => {
    server.use(http.post('/api/admin/rotate-jwt-secret', () => HttpResponse.json({}, { status: 500 })));
    const admin = renderModals({ showRotateJwtModal: true });

    fireEvent.click(screen.getByRole('button', { name: /rotate .* log out/i }));

    await waitFor(() => expect(admin.toast.error).toHaveBeenCalledWith('Error'));
    expect(admin.logout).not.toHaveBeenCalled();
    expect(admin.setRotatingJwt).toHaveBeenLastCalledWith(false);
  });

  it('FE-ADMMOD-024: both rotate buttons are disabled while rotating', () => {
    renderModals({ showRotateJwtModal: true, rotatingJwt: true });

    expect(screen.getByRole('button', { name: /^cancel$/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /rotate .* log out/i })).toBeDisabled();
  });

  it('FE-ADMMOD-025: the modal X button closes the create-user modal', () => {
    const admin = renderModals({ showCreateUser: true });

    expect(screen.getByRole('heading', { name: 'Create User' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^close$/i }));

    expect(admin.setShowCreateUser).toHaveBeenCalledWith(false);
  });

  it('FE-ADMMOD-026: the modal X button closes the edit-user modal', () => {
    const admin = renderModals(editing);

    expect(screen.getByRole('heading', { name: 'Edit User' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^close$/i }));

    expect(admin.setEditingUser).toHaveBeenCalledWith(null);
  });

  it('FE-ADMMOD-027: the modal X button closes the rotate-JWT modal', () => {
    const admin = renderModals({ showRotateJwtModal: true });

    expect(screen.getByRole('heading', { name: 'Rotate JWT Secret' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^close$/i }));

    expect(admin.setShowRotateJwtModal).toHaveBeenCalledWith(false);
  });
});
