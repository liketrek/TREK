// FE-MOB-MCPTOK-001 to FE-MOB-MCPTOK-014
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '../../../helpers/render';
import { server } from '../../../helpers/msw/server';
import { resetAllStores } from '../../../helpers/store';
import { ToastContainer } from '../../../../src/components/shared/Toast';
import MAdminMcpTokensPanel from '../../../../src/mobile/screens/admin/MAdminMcpTokensPanel';

const TOKEN_1 = {
  id: 1,
  name: 'CI Token',
  token_prefix: 'trek_abc',
  created_at: '2025-01-15T00:00:00Z',
  last_used_at: null,
  user_id: 10,
  username: 'alice',
};

const TOKEN_2 = {
  id: 2,
  name: 'Ops Token',
  token_prefix: 'trek_xyz',
  created_at: '2025-03-01T00:00:00Z',
  last_used_at: '2025-04-01T00:00:00Z',
  user_id: 11,
  username: 'bob',
};

function buildSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    client_id: 'cid',
    client_name: 'Claude Desktop',
    user_id: 10,
    username: 'alice',
    scopes: ['trips:read', 'budget:read'],
    access_token_expires_at: '2025-02-01T00:00:00Z',
    refresh_token_expires_at: '2025-03-01T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function renderPanel() {
  return render(
    <>
      <ToastContainer />
      <MAdminMcpTokensPanel />
    </>,
  );
}

// The trash icons carry title="Delete" too — the confirm sheet's button is the
// one without a title attribute.
function confirmButton(label: string): HTMLElement {
  const candidates = screen.getAllByRole('button', { name: label });
  const withoutTitle = candidates.find((b) => !b.getAttribute('title'));
  return withoutTitle ?? candidates[candidates.length - 1];
}

beforeEach(() => {
  resetAllStores();
});

afterEach(() => {
  server.resetHandlers();
});

describe('MAdminMcpTokensPanel', () => {
  it('FE-MOB-MCPTOK-001: renders the section header and both sub-section titles', async () => {
    renderPanel();

    expect(screen.getByText('MCP Access')).toBeInTheDocument();
    expect(screen.getByText('Manage OAuth sessions and API tokens across all users')).toBeInTheDocument();
    expect(screen.getByText('OAuth Sessions')).toBeInTheDocument();
    expect(screen.getByText('API Tokens')).toBeInTheDocument();
    await screen.findByText('No MCP tokens have been created yet');
  });

  it('FE-MOB-MCPTOK-002: shows spinners while both requests are in flight', async () => {
    server.use(
      http.get('/api/admin/mcp-tokens', async () => {
        await new Promise(() => {});
        return HttpResponse.json({ tokens: [] });
      }),
      http.get('/api/admin/oauth-sessions', async () => {
        await new Promise(() => {});
        return HttpResponse.json({ sessions: [] });
      }),
    );
    renderPanel();

    expect(document.querySelectorAll('.animate-spin')).toHaveLength(2);
    expect(screen.queryByText('No MCP tokens have been created yet')).not.toBeInTheDocument();
  });

  it('FE-MOB-MCPTOK-003: renders both empty states when nothing is configured', async () => {
    renderPanel();

    await screen.findByText('No active OAuth sessions');
    expect(screen.getByText('No MCP tokens have been created yet')).toBeInTheDocument();
  });

  it('FE-MOB-MCPTOK-004: token rows show name, prefix, owner and last-used date', async () => {
    server.use(http.get('/api/admin/mcp-tokens', () => HttpResponse.json({ tokens: [TOKEN_1, TOKEN_2] })));
    renderPanel();

    await screen.findByText('CI Token');
    expect(screen.getByText('Ops Token')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByText(/trek_abc/)).toBeInTheDocument();
    expect(screen.getByText(/trek_xyz/)).toBeInTheDocument();
    // last_used_at null → "Never", otherwise the formatted date
    expect(screen.getByText('Never')).toBeInTheDocument();
    expect(screen.getByText('4/1/2025')).toBeInTheDocument();
  });

  it('FE-MOB-MCPTOK-005: session rows show client, user and scope chips', async () => {
    server.use(http.get('/api/admin/oauth-sessions', () => HttpResponse.json({ sessions: [buildSession()] })));
    renderPanel();

    await screen.findByText('Claude Desktop');
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('trips:read')).toBeInTheDocument();
    expect(screen.getByText('budget:read')).toBeInTheDocument();
    expect(screen.getByText('1/1/2025')).toBeInTheDocument();
  });

  it('FE-MOB-MCPTOK-006: scopes beyond the preview stay hidden until expanded', async () => {
    const user = userEvent.setup();
    const scopes = [
      'trips:read', 'trips:write', 'places:read', 'places:write',
      'budget:read', 'budget:write', 'packing:read',
    ];
    server.use(
      http.get('/api/admin/oauth-sessions', () => HttpResponse.json({ sessions: [buildSession({ scopes })] })),
    );
    renderPanel();

    await screen.findByText('Claude Desktop');
    expect(screen.queryByText('packing:read')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '+1 more' }));
    expect(screen.getByText('packing:read')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'show less' }));
    expect(screen.queryByText('packing:read')).not.toBeInTheDocument();
  });

  it('FE-MOB-MCPTOK-007: no expand button when scopes fit into the preview', async () => {
    server.use(
      http.get('/api/admin/oauth-sessions', () =>
        HttpResponse.json({ sessions: [buildSession({ scopes: ['trips:read'] })] }),
      ),
    );
    renderPanel();

    await screen.findByText('Claude Desktop');
    expect(screen.queryByText(/more$/)).not.toBeInTheDocument();
    expect(screen.queryByText('show less')).not.toBeInTheDocument();
  });

  it('FE-MOB-MCPTOK-008: token trash opens the delete confirm sheet', async () => {
    const user = userEvent.setup();
    server.use(http.get('/api/admin/mcp-tokens', () => HttpResponse.json({ tokens: [TOKEN_1] })));
    renderPanel();

    await screen.findByText('CI Token');
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByRole('dialog', { name: 'Delete Token' })).toBeInTheDocument();
    expect(
      screen.getByText('This will revoke the token immediately. The user will lose MCP access through this token.'),
    ).toBeInTheDocument();
  });

  it('FE-MOB-MCPTOK-009: cancelling the confirm sheet keeps the token', async () => {
    const user = userEvent.setup();
    server.use(http.get('/api/admin/mcp-tokens', () => HttpResponse.json({ tokens: [TOKEN_1] })));
    renderPanel();

    await screen.findByText('CI Token');
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText('CI Token')).toBeInTheDocument();
  });

  it('FE-MOB-MCPTOK-010: confirming removes the token and toasts', async () => {
    const user = userEvent.setup();
    let deletedId = '';
    server.use(
      http.get('/api/admin/mcp-tokens', () => HttpResponse.json({ tokens: [TOKEN_1, TOKEN_2] })),
      http.delete('/api/admin/mcp-tokens/:id', ({ params }) => {
        deletedId = String(params.id);
        return HttpResponse.json({ success: true });
      }),
    );
    renderPanel();

    await screen.findByText('CI Token');
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    await user.click(confirmButton('Delete'));

    await waitFor(() => expect(screen.queryByText('CI Token')).not.toBeInTheDocument());
    expect(deletedId).toBe('1');
    expect(screen.getByText('Ops Token')).toBeInTheDocument();
    await screen.findByText('Token deleted');
  });

  it('FE-MOB-MCPTOK-011: a failing delete keeps the token and shows the error toast', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/admin/mcp-tokens', () => HttpResponse.json({ tokens: [TOKEN_1] })),
      http.delete('/api/admin/mcp-tokens/:id', () => HttpResponse.json({ error: 'nope' }, { status: 403 })),
    );
    renderPanel();

    await screen.findByText('CI Token');
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    await user.click(confirmButton('Delete'));

    await screen.findByText('Failed to delete token');
    expect(screen.getByText('CI Token')).toBeInTheDocument();
  });

  it('FE-MOB-MCPTOK-012: revoking a session removes it and toasts', async () => {
    const user = userEvent.setup();
    let revokedId = '';
    server.use(
      http.get('/api/admin/oauth-sessions', () =>
        HttpResponse.json({ sessions: [buildSession({ id: 5, client_name: 'Revoke Me' })] }),
      ),
      http.delete('/api/admin/oauth-sessions/:id', ({ params }) => {
        revokedId = String(params.id);
        return HttpResponse.json({ success: true });
      }),
    );
    renderPanel();

    await screen.findByText('Revoke Me');
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    expect(screen.getByRole('dialog', { name: 'Revoke Session' })).toBeInTheDocument();

    // Cancelling leaves the session untouched; reopening still works.
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(revokedId).toBe('');

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    await user.click(confirmButton('Delete'));

    await waitFor(() => expect(screen.queryByText('Revoke Me')).not.toBeInTheDocument());
    expect(revokedId).toBe('5');
    await screen.findByText('Session revoked');
  });

  it('FE-MOB-MCPTOK-013: a failing revoke keeps the session and shows the error toast', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/admin/oauth-sessions', () =>
        HttpResponse.json({ sessions: [buildSession({ id: 6, client_name: 'Error Session' })] }),
      ),
      http.delete('/api/admin/oauth-sessions/:id', () => HttpResponse.json({ error: 'nope' }, { status: 403 })),
    );
    renderPanel();

    await screen.findByText('Error Session');
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    await user.click(confirmButton('Delete'));

    await screen.findByText('Failed to revoke session');
    expect(screen.getByText('Error Session')).toBeInTheDocument();
  });

  it('FE-MOB-MCPTOK-014: both load failures toast and fall back to the empty states', async () => {
    server.use(
      http.get('/api/admin/mcp-tokens', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
      http.get('/api/admin/oauth-sessions', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
    );
    renderPanel();

    await screen.findByText('Failed to load tokens');
    expect(screen.getByText('Failed to load OAuth sessions')).toBeInTheDocument();
    expect(screen.getByText('No MCP tokens have been created yet')).toBeInTheDocument();
    expect(screen.getByText('No active OAuth sessions')).toBeInTheDocument();
  });
});
