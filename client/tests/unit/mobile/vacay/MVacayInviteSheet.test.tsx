// FE-MOB-MVACINV-001 to FE-MOB-MVACINV-010
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, fireEvent, waitFor, within } from '../../../helpers/render';
import { server } from '../../../helpers/msw/server';
import { resetAllStores } from '../../../helpers/store';
import { useVacayStore } from '../../../../src/store/vacayStore';
import MVacayInviteSheet from '../../../../src/mobile/screens/vacay/MVacayInviteSheet';

const toasts: { type: string; message: string }[] = [];

function availableUsers(users: { id: number; username: string; color: string | null }[]) {
  server.use(http.get('/api/addons/vacay/available-users', () => HttpResponse.json({ users })));
}

beforeEach(() => {
  resetAllStores();
  toasts.length = 0;
  window.__addToast = ((message: string, type?: string) => {
    toasts.push({ type: type ?? 'info', message });
    return 1;
  }) as Window['__addToast'];
  availableUsers([
    { id: 2, username: 'bob', color: '#ec4899' },
    { id: 3, username: 'carol', color: '#f59e0b' },
  ]);
});

afterEach(() => {
  delete window.__addToast;
});

function renderSheet(onClose = vi.fn(() => undefined)) {
  const view = render(<MVacayInviteSheet open onClose={onClose} />);
  return { ...view, onClose };
}

describe('MVacayInviteSheet', () => {
  it('FE-MOB-MVACINV-001: renders nothing while closed', () => {
    render(<MVacayInviteSheet open={false} onClose={() => {}} />);

    expect(screen.queryByRole('dialog', { name: 'Invite User' })).not.toBeInTheDocument();
  });

  it('FE-MOB-MVACINV-002: loads the invitable users and shows the picker placeholder', async () => {
    renderSheet();

    expect(await screen.findByRole('button', { name: 'Select user' })).toBeInTheDocument();
    expect(screen.getByText('Invite another TREK user to share a combined vacation calendar.')).toBeInTheDocument();
    expect(screen.queryByText('No users available')).not.toBeInTheDocument();
  });

  it('FE-MOB-MVACINV-003: falls back to the empty state when the lookup fails', async () => {
    server.use(http.get('/api/addons/vacay/available-users', () => HttpResponse.json({ error: 'nope' }, { status: 500 })));
    renderSheet();

    expect(await screen.findByText('No users available')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Select user' })).not.toBeInTheDocument();
  });

  it('FE-MOB-MVACINV-004: the picker opens, selects a user and collapses again', async () => {
    renderSheet();
    fireEvent.click(await screen.findByRole('button', { name: 'Select user' }));

    fireEvent.click(screen.getByRole('button', { name: 'carol' }));
    expect(await screen.findByRole('button', { name: 'carol' })).toBeInTheDocument();
    // Only the trigger keeps the name once the list collapsed.
    expect(screen.getAllByRole('button', { name: 'carol' })).toHaveLength(1);
  });

  it('FE-MOB-MVACINV-005: the send button stays disabled until someone is picked', async () => {
    renderSheet();
    const send = await screen.findByRole('button', { name: 'Send Invite' });
    expect(send).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Select user' }));
    fireEvent.click(screen.getByRole('button', { name: 'bob' }));
    expect(screen.getByRole('button', { name: 'Send Invite' })).toBeEnabled();
  });

  it('FE-MOB-MVACINV-006: sending posts the picked user, toasts and closes', async () => {
    let invitedId: number | undefined;
    server.use(http.post('/api/addons/vacay/invite', async ({ request }) => {
      invitedId = ((await request.json()) as { user_id: number }).user_id;
      return HttpResponse.json({ success: true });
    }));
    const { onClose } = renderSheet();

    fireEvent.click(await screen.findByRole('button', { name: 'Select user' }));
    fireEvent.click(screen.getByRole('button', { name: 'bob' }));
    fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }));

    await waitFor(() => expect(invitedId).toBe(2));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(toasts).toEqual([{ type: 'success', message: 'Invite sent' }]);
  });

  it('FE-MOB-MVACINV-007: a rejected invite surfaces the server error and keeps the sheet open', async () => {
    server.use(http.post('/api/addons/vacay/invite', () =>
      HttpResponse.json({ error: 'Already fused' }, { status: 409 })));
    const { onClose } = renderSheet();

    fireEvent.click(await screen.findByRole('button', { name: 'Select user' }));
    fireEvent.click(screen.getByRole('button', { name: 'bob' }));
    fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }));

    await waitFor(() => expect(toasts).toEqual([{ type: 'error', message: 'Already fused' }]));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('FE-MOB-MVACINV-008: pending invites are listed and can be withdrawn', async () => {
    const cancelInvite = vi.fn(async (_userId: number) => {});
    useVacayStore.setState({
      pendingInvites: [{ user_id: 9, username: 'dan' }],
      cancelInvite,
    });
    renderSheet();

    const row = (await screen.findByText('dan')).closest('div') as HTMLElement;
    expect(within(row).getByText('(pending)')).toBeInTheDocument();

    fireEvent.click(within(row).getByRole('button', { name: 'Cancel' }));
    expect(cancelInvite).toHaveBeenCalledWith(9);
  });

  it('FE-MOB-MVACINV-009: the close icon and the cancel button both dismiss the sheet', async () => {
    const { onClose } = renderSheet();

    fireEvent.click(await screen.findByRole('button', { name: 'Close' }));
    const dialog = screen.getByRole('dialog', { name: 'Invite User' });
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Cancel' })[0]);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('FE-MOB-MVACINV-010: reopening resets the previous selection', async () => {
    const { rerender } = render(<MVacayInviteSheet open onClose={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Select user' }));
    fireEvent.click(screen.getByRole('button', { name: 'bob' }));
    expect(screen.getByRole('button', { name: 'bob' })).toBeInTheDocument();

    rerender(<MVacayInviteSheet open={false} onClose={() => {}} />);
    rerender(<MVacayInviteSheet open onClose={() => {}} />);

    expect(await screen.findByRole('button', { name: 'Select user' })).toBeInTheDocument();
  });
});
