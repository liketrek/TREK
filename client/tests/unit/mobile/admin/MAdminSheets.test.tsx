// FE-MOB-ASHEET-001 to FE-MOB-ASHEET-024
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { fireEvent, render, screen, waitFor } from '../../../helpers/render';
import { server } from '../../../helpers/msw/server';
import { resetAllStores } from '../../../helpers/store';
import { buildAdminHook, buildAdminUser, type AdminHook } from '../../../helpers/mobileAdmin';
import { useTranslation } from '../../../../src/i18n';
import MAdminSheets from '../../../../src/mobile/screens/admin/MAdminSheets';

function Harness({ admin }: { admin: AdminHook }) {
  const { t } = useTranslation();
  return <MAdminSheets admin={admin} t={t} />;
}

type Spy = ReturnType<typeof vi.fn>;
type Spies = Record<string, Spy> & { toast: Record<string, Spy> };

function renderSheets(overrides: Record<string, unknown> = {}) {
  const admin = buildAdminHook(overrides);
  render(<Harness admin={admin} />);
  return admin as unknown as Spies;
}

interface UserForm {
  username: string;
  email: string;
  role: string;
  password: string;
}

/**
 * The form inputs read e.target.value inside the state updater, so a spy setter
 * can't be inspected afterwards — React has already restored the controlled
 * value by then. These sheets therefore get real state.
 */
function StatefulSheets({
  initialForm,
  overrides,
}: {
  initialForm: UserForm;
  overrides: Record<string, unknown>;
}) {
  const { t } = useTranslation();
  const [form, setForm] = React.useState<UserForm>(initialForm);
  const admin = buildAdminHook({
    ...overrides,
    createForm: form,
    setCreateForm: setForm,
    editForm: form,
    setEditForm: setForm,
  });
  return <MAdminSheets admin={admin} t={t} />;
}

const ME = buildAdminUser({ id: 1, username: 'admin' });
const ALICE = buildAdminUser({ id: 2, username: 'alice', email: 'alice@example.com', role: 'user' });

beforeEach(() => {
  resetAllStores();
});

afterEach(() => {
  server.resetHandlers();
});

describe('MAdminSheets', () => {
  it('FE-MOB-ASHEET-001: nothing is rendered while every sheet is closed', () => {
    renderSheets();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('FE-MOB-ASHEET-002: the create sheet shows the four fields prefilled from createForm', () => {
    renderSheets({
      showCreateUser: true,
      createForm: { username: 'newbie', email: 'new@example.com', password: 'secret12', role: 'admin' },
    });

    expect(screen.getByRole('dialog', { name: 'Create User' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toHaveValue('newbie');
    expect(screen.getByPlaceholderText('Email')).toHaveValue('new@example.com');
    expect(screen.getByPlaceholderText('Password')).toHaveValue('secret12');
    expect(screen.getByRole('tab', { name: 'Administrator' })).toHaveAttribute('aria-selected', 'true');
  });

  it('FE-MOB-ASHEET-003: each create-form input writes through to its own field', async () => {
    const user = userEvent.setup();
    render(
      <StatefulSheets
        initialForm={{ username: '', email: '', role: 'user', password: '' }}
        overrides={{ showCreateUser: true }}
      />,
    );

    await user.type(screen.getByPlaceholderText('Username'), 'newbie');
    await user.type(screen.getByPlaceholderText('Email'), 'new@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'secret12');

    expect(screen.getByPlaceholderText('Username')).toHaveValue('newbie');
    expect(screen.getByPlaceholderText('Email')).toHaveValue('new@example.com');
    expect(screen.getByPlaceholderText('Password')).toHaveValue('secret12');
  });

  it('FE-MOB-ASHEET-003b: the password eye toggles the input type', async () => {
    const user = userEvent.setup();
    renderSheets({ showCreateUser: true });

    const input = screen.getByPlaceholderText('Password');
    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show or hide' }));
    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'text');
  });

  it('FE-MOB-ASHEET-004: the role segment writes the picked role', async () => {
    const user = userEvent.setup();
    const admin = renderSheets({ showCreateUser: true });

    await user.click(screen.getByRole('tab', { name: 'Administrator' }));
    const updater = admin.setCreateForm.mock.calls[0][0] as (f: Record<string, string>) => Record<string, string>;
    expect(updater({ username: 'a', email: 'b', password: 'c', role: 'user' }).role).toBe('admin');
  });

  it('FE-MOB-ASHEET-005: create sheet footer submits and cancels', async () => {
    const user = userEvent.setup();
    const admin = renderSheets({ showCreateUser: true });

    await user.click(screen.getByRole('button', { name: 'Create User' }));
    expect(admin.handleCreateUser).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(admin.setShowCreateUser).toHaveBeenCalledWith(false);
  });

  it('FE-MOB-ASHEET-006: the edit sheet only renders its body once a user is being edited', () => {
    renderSheets({
      editingUser: ALICE,
      editForm: { username: 'alice', email: 'alice@example.com', role: 'user', password: '' },
    });

    expect(screen.getByRole('dialog', { name: 'Edit User' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Reset passkeys')).toBeInTheDocument();
  });

  it('FE-MOB-ASHEET-007: the edit form writes username, email, password and role separately', async () => {
    const user = userEvent.setup();
    render(
      <StatefulSheets
        initialForm={{ username: 'alice', email: 'alice@example.com', role: 'user', password: '' }}
        overrides={{ editingUser: ALICE }}
      />,
    );

    await user.type(screen.getByDisplayValue('alice'), 'x');
    await user.type(screen.getByDisplayValue('alice@example.com'), '.uk');
    await user.type(screen.getByPlaceholderText('Enter new password…'), 'newsecret');
    await user.click(screen.getByRole('tab', { name: 'Administrator' }));

    expect(screen.getByDisplayValue('alicex')).toBeInTheDocument();
    expect(screen.getByDisplayValue('alice@example.com.uk')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter new password…')).toHaveValue('newsecret');
    expect(screen.getByRole('tab', { name: 'Administrator' })).toHaveAttribute('aria-selected', 'true');
  });

  it('FE-MOB-ASHEET-008: saving and cancelling the edit sheet call through', async () => {
    const user = userEvent.setup();
    const admin = renderSheets({ editingUser: ALICE });

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(admin.handleSaveUser).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(admin.setEditingUser).toHaveBeenCalledWith(null);
  });

  it('FE-MOB-ASHEET-009: deleting closes the sheet first and then deletes that user', async () => {
    const user = userEvent.setup();
    const admin = renderSheets({ editingUser: ALICE, currentUser: ME });

    const deleteBtn = screen.getByRole('button', { name: 'Delete user' });
    expect(deleteBtn).not.toBeDisabled();
    await user.click(deleteBtn);

    expect(admin.setEditingUser).toHaveBeenCalledWith(null);
    expect(admin.handleDeleteUser).toHaveBeenCalledWith(ALICE);
  });

  it('FE-MOB-ASHEET-010: the delete button is disabled for the signed-in admin', () => {
    renderSheets({ editingUser: ME, currentUser: ME });

    expect(screen.getByRole('button', { name: 'Delete user' })).toBeDisabled();
  });

  it('FE-MOB-ASHEET-011: resetting passkeys confirms, calls the API and reports the count', async () => {
    const user = userEvent.setup();
    let hitId = '';
    server.use(
      http.delete('/api/admin/users/:id/passkeys', ({ params }) => {
        hitId = String(params.id);
        return HttpResponse.json({ deleted: 3 });
      }),
    );
    const admin = renderSheets({ editingUser: ALICE });

    await user.click(screen.getByRole('button', { name: 'Reset passkeys' }));
    const confirm = screen.getByRole('dialog', { name: 'Reset passkeys' });
    expect(confirm).toBeInTheDocument();
    expect(screen.getByText('Remove all passkeys for alice?')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Reset passkeys' })[1]);

    await waitFor(() => expect(admin.toast.success).toHaveBeenCalledWith('Removed 3 passkey(s)'));
    expect(hitId).toBe('2');
  });

  it('FE-MOB-ASHEET-012: a failing passkey reset toasts the error and keeps the sheet open', async () => {
    const user = userEvent.setup();
    server.use(
      http.delete('/api/admin/users/:id/passkeys', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
    );
    const admin = renderSheets({ editingUser: ALICE });

    await user.click(screen.getByRole('button', { name: 'Reset passkeys' }));
    await user.click(screen.getAllByRole('button', { name: 'Reset passkeys' })[1]);

    await waitFor(() => expect(admin.toast.error).toHaveBeenCalledWith('Error'));
    expect(screen.getByRole('dialog', { name: 'Reset passkeys' })).toBeInTheDocument();
  });

  it('FE-MOB-ASHEET-013: the passkey confirm can be dismissed without calling the API', async () => {
    const user = userEvent.setup();
    let called = false;
    server.use(
      http.delete('/api/admin/users/:id/passkeys', () => {
        called = true;
        return HttpResponse.json({ deleted: 0 });
      }),
    );
    renderSheets({ editingUser: ALICE });

    await user.click(screen.getByRole('button', { name: 'Reset passkeys' }));
    await user.click(screen.getAllByRole('button', { name: 'Cancel' })[1]);

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Reset passkeys' })).not.toBeInTheDocument(),
    );
    expect(called).toBe(false);
  });

  it('FE-MOB-ASHEET-014: the update sheet shows the docker commands for a docker install', () => {
    renderSheets({
      showUpdateModal: true,
      updateInfo: { update_available: true, current: '3.4.0', latest: '3.5.0', is_docker: true },
    });

    expect(screen.getByRole('dialog', { name: 'How to Update' })).toBeInTheDocument();
    expect(screen.getByText('v3.4.0 → v3.5.0')).toBeInTheDocument();
    expect(screen.getByText(/docker pull mauriceboe\/trek:latest/)).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your TREK instance runs in Docker. To update to v3.5.0, run the following commands on your server:',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /update guide/ })).not.toBeInTheDocument();
  });

  it('FE-MOB-ASHEET-015: a non-docker install links the wiki guide instead', () => {
    renderSheets({
      showUpdateModal: true,
      updateInfo: {
        update_available: true,
        current: '3.4.0',
        latest: '3.5.0',
        is_docker: false,
        release_url: 'https://github.com/liketrek/TREK/releases/v3.5.0',
      },
    });

    expect(screen.getByRole('link', { name: 'Open the update guide' })).toHaveAttribute(
      'href',
      'https://github.com/liketrek/TREK/wiki/Updating',
    );
    expect(screen.queryByText(/docker pull/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/liketrek/TREK/releases/v3.5.0',
    );
  });

  it('FE-MOB-ASHEET-016: the update sheet closes from its footer', async () => {
    const user = userEvent.setup();
    const admin = renderSheets({
      showUpdateModal: true,
      updateInfo: { update_available: true, current: '3.4.0', latest: '3.5.0', is_docker: true },
    });

    // Header icon button and footer button both close the sheet
    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    expect(closeButtons).toHaveLength(2);
    await user.click(closeButtons[1]);
    expect(admin.setShowUpdateModal).toHaveBeenCalledWith(false);

    await user.click(closeButtons[0]);
    expect(admin.setShowUpdateModal).toHaveBeenCalledTimes(2);
  });

  it('FE-MOB-ASHEET-017: rotating the JWT secret logs the admin out and redirects', async () => {
    const user = userEvent.setup();
    let rotated = false;
    server.use(
      http.post('/api/admin/rotate-jwt-secret', () => {
        rotated = true;
        return HttpResponse.json({ success: true });
      }),
    );
    const admin = renderSheets({ showRotateJwtModal: true });

    expect(screen.getByRole('dialog', { name: 'Rotate JWT Secret' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Rotate & Log out' }));

    await waitFor(() => expect(admin.logout).toHaveBeenCalled());
    expect(rotated).toBe(true);
    expect(admin.setRotatingJwt).toHaveBeenCalledWith(true);
    expect(admin.setShowRotateJwtModal).toHaveBeenCalledWith(false);
    expect(admin.navigate).toHaveBeenCalledWith('/login', { state: { noRedirect: true } });
  });

  it('FE-MOB-ASHEET-018: a failing rotation toasts and leaves the session alone', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/admin/rotate-jwt-secret', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
    );
    const admin = renderSheets({ showRotateJwtModal: true });

    await user.click(screen.getByRole('button', { name: 'Rotate & Log out' }));

    await waitFor(() => expect(admin.toast.error).toHaveBeenCalledWith('Error'));
    expect(admin.logout).not.toHaveBeenCalled();
    expect(admin.setRotatingJwt).toHaveBeenLastCalledWith(false);
  });

  it('FE-MOB-ASHEET-019: Escape and the header X close the rotate sheet', async () => {
    const user = userEvent.setup();
    const admin = renderSheets({ showRotateJwtModal: true });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(admin.setShowRotateJwtModal).toHaveBeenCalledWith(false);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(admin.setShowRotateJwtModal).toHaveBeenCalledTimes(3);
  });

  it('FE-MOB-ASHEET-020: Escape and the header X close the create sheet', async () => {
    const user = userEvent.setup();
    const admin = renderSheets({ showCreateUser: true });

    fireEvent.keyDown(document, { key: 'Escape' });
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(admin.setShowCreateUser).toHaveBeenCalledTimes(2);
    expect(admin.setShowCreateUser).toHaveBeenCalledWith(false);
  });

  it('FE-MOB-ASHEET-021: Escape and the header X close the edit sheet', async () => {
    const user = userEvent.setup();
    const admin = renderSheets({ editingUser: ALICE });

    fireEvent.keyDown(document, { key: 'Escape' });
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(admin.setEditingUser).toHaveBeenCalledTimes(2);
    expect(admin.setEditingUser).toHaveBeenCalledWith(null);
  });

  it('FE-MOB-ASHEET-022: Escape closes the update sheet', () => {
    const admin = renderSheets({
      showUpdateModal: true,
      updateInfo: { update_available: true, current: '3.4.0', latest: '3.5.0', is_docker: true },
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(admin.setShowUpdateModal).toHaveBeenCalledWith(false);
  });

  it('FE-MOB-ASHEET-023: the passkey sheet closes from Escape and from its header X', async () => {
    const user = userEvent.setup();
    renderSheets({ editingUser: ALICE });

    await user.click(screen.getByRole('button', { name: 'Reset passkeys' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Reset passkeys' })).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: 'Reset passkeys' }));
    // Second dialog in the DOM is the confirm on top of the edit sheet
    await user.click(screen.getAllByRole('button', { name: 'Close' })[1]);
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Reset passkeys' })).not.toBeInTheDocument(),
    );
  });

  it('FE-MOB-ASHEET-024: confirming the passkey reset without an edited user does nothing', async () => {
    const user = userEvent.setup();
    let called = false;
    server.use(
      http.delete('/api/admin/users/:id/passkeys', () => {
        called = true;
        return HttpResponse.json({ deleted: 0 });
      }),
    );
    const admin = buildAdminHook({ editingUser: ALICE });
    const { rerender } = render(<Harness admin={admin} />);

    await user.click(screen.getByRole('button', { name: 'Reset passkeys' }));
    // The edit sheet closes underneath while the confirm stays open
    rerender(<Harness admin={buildAdminHook({ editingUser: null })} />);

    await user.click(screen.getByRole('button', { name: 'Reset passkeys' }));

    expect(called).toBe(false);
    expect(screen.getByRole('dialog', { name: 'Reset passkeys' })).toBeInTheDocument();
  });
});
