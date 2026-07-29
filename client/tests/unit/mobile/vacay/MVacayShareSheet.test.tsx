// FE-MOB-MVACSHR-001 to FE-MOB-MVACSHR-011
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, fireEvent, waitFor, within } from '../../../helpers/render';
import { server } from '../../../helpers/msw/server';
import { resetAllStores } from '../../../helpers/store';
import { useVacayStore } from '../../../../src/store/vacayStore';
import MVacayShareSheet from '../../../../src/mobile/screens/vacay/MVacayShareSheet';

const toasts: { type: string; message: string }[] = [];

function shareCandidates(users: { id: number; username: string }[]) {
  server.use(http.get('/api/addons/vacay/shares/available-users', () => HttpResponse.json({ users })));
}

beforeEach(() => {
  resetAllStores();
  toasts.length = 0;
  window.__addToast = ((message: string, type?: string) => {
    toasts.push({ type: type ?? 'info', message });
    return 1;
  }) as Window['__addToast'];
  shareCandidates([{ id: 2, username: 'bob' }, { id: 3, username: 'carol' }]);
});

afterEach(() => {
  delete window.__addToast;
});

function renderSheet(onClose = vi.fn(() => undefined)) {
  const view = render(<MVacayShareSheet open onClose={onClose} />);
  return { ...view, onClose };
}

describe('MVacayShareSheet', () => {
  it('FE-MOB-MVACSHR-001: renders nothing while closed', () => {
    render(<MVacayShareSheet open={false} onClose={() => {}} />);

    expect(screen.queryByRole('dialog', { name: 'Shared Calendars' })).not.toBeInTheDocument();
  });

  it('FE-MOB-MVACSHR-002: loads the share candidates and explains what sharing does', async () => {
    renderSheet();

    expect(await screen.findByRole('button', { name: 'Select user' })).toBeInTheDocument();
    expect(screen.getByText(/View only — no merge, no editing\./)).toBeInTheDocument();
  });

  it('FE-MOB-MVACSHR-003: shows the empty state when nobody is left to share with', async () => {
    shareCandidates([]);
    renderSheet();

    expect(await screen.findByText('No users available')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument();
  });

  it('FE-MOB-MVACSHR-004: keeps the empty state when the lookup fails', async () => {
    server.use(http.get('/api/addons/vacay/shares/available-users', () =>
      HttpResponse.json({ error: 'nope' }, { status: 500 })));
    renderSheet();

    expect(await screen.findByText('No users available')).toBeInTheDocument();
  });

  it('FE-MOB-MVACSHR-005: the share button unlocks once a user is picked', async () => {
    renderSheet();
    expect(await screen.findByRole('button', { name: 'Share' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Select user' }));
    fireEvent.click(screen.getByRole('button', { name: 'carol' }));
    expect(screen.getByRole('button', { name: 'Share' })).toBeEnabled();
  });

  it('FE-MOB-MVACSHR-006: sharing posts the user, toasts and clears the selection', async () => {
    let sharedWith: number | undefined;
    server.use(http.post('/api/addons/vacay/shares', async ({ request }) => {
      sharedWith = ((await request.json()) as { user_id: number }).user_id;
      return HttpResponse.json({ success: true });
    }));
    renderSheet();

    fireEvent.click(await screen.findByRole('button', { name: 'Select user' }));
    fireEvent.click(screen.getByRole('button', { name: 'carol' }));
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    await waitFor(() => expect(sharedWith).toBe(3));
    await waitFor(() => expect(toasts).toEqual([{ type: 'success', message: 'Calendar shared' }]));
    expect(await screen.findByRole('button', { name: 'Select user' })).toBeInTheDocument();
  });

  it('FE-MOB-MVACSHR-007: a rejected share surfaces the server error', async () => {
    server.use(http.post('/api/addons/vacay/shares', () =>
      HttpResponse.json({ error: 'Already shared' }, { status: 409 })));
    renderSheet();

    fireEvent.click(await screen.findByRole('button', { name: 'Select user' }));
    fireEvent.click(screen.getByRole('button', { name: 'bob' }));
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    await waitFor(() => expect(toasts).toEqual([{ type: 'error', message: 'Already shared' }]));
  });

  it('FE-MOB-MVACSHR-008: incoming shares toggle their overlay through the eye button', async () => {
    const setShareHidden = vi.fn(async (_shareId: number, _hidden: boolean) => {});
    useVacayStore.setState({
      incomingShares: [
        { id: 5, owner_id: 3, username: 'carol', color: '#f59e0b', hidden: false },
        { id: 6, owner_id: 4, username: 'dan', color: '#10b981', hidden: true },
      ],
      setShareHidden,
    });
    renderSheet();

    expect(await screen.findByText('Shared with you')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hide from calendar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Show in calendar' }));

    expect(setShareHidden).toHaveBeenNthCalledWith(1, 5, true);
    expect(setShareHidden).toHaveBeenNthCalledWith(2, 6, false);
  });

  it('FE-MOB-MVACSHR-009: a failing hide toggle reports the error', async () => {
    const setShareHidden = vi.fn(async (_shareId: number, _hidden: boolean) => {
      throw { response: { data: { error: 'Share vanished' } }, message: 'nope' };
    });
    useVacayStore.setState({
      incomingShares: [{ id: 5, owner_id: 3, username: 'carol', color: '#f59e0b', hidden: false }],
      setShareHidden,
    });
    renderSheet();

    fireEvent.click(await screen.findByRole('button', { name: 'Hide from calendar' }));
    await waitFor(() => expect(toasts).toEqual([{ type: 'error', message: 'Share vanished' }]));
  });

  it('FE-MOB-MVACSHR-010: both share directions can be revoked', async () => {
    const removeShare = vi.fn(async (_shareId: number) => {});
    useVacayStore.setState({
      incomingShares: [{ id: 5, owner_id: 3, username: 'carol', color: '#f59e0b', hidden: false }],
      outgoingShares: [{ id: 11, user_id: 8, username: 'erin' }],
      removeShare,
    });
    renderSheet();

    expect(await screen.findByText('You share with')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stop sharing' }));

    expect(removeShare).toHaveBeenNthCalledWith(1, 5);
    expect(removeShare).toHaveBeenNthCalledWith(2, 11);
  });

  it('FE-MOB-MVACSHR-011: a failing revoke reports the fallback message', async () => {
    // No `response` and not an Error — getApiErrorMessage falls through to the label.
    const removeShare = vi.fn(async (_shareId: number) => { throw { status: 500 }; });
    useVacayStore.setState({
      outgoingShares: [{ id: 11, user_id: 8, username: 'erin' }],
      removeShare,
    });
    renderSheet();

    fireEvent.click(await screen.findByRole('button', { name: 'Stop sharing' }));
    await waitFor(() => expect(toasts).toEqual([{ type: 'error', message: 'Could not share calendar' }]));
  });

  it('FE-MOB-MVACSHR-012: the close icon dismisses the sheet', async () => {
    const { onClose } = renderSheet();

    const dialog = await screen.findByRole('dialog', { name: 'Shared Calendars' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
