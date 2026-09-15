// FE-COMP-APIKEYS-001 to FE-COMP-APIKEYS-020
import { render, screen, waitFor, within } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { useAuthStore } from '../../store/authStore';
import { useAddonStore } from '../../store/addonStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser } from '../../../tests/helpers/factories';
import { ToastContainer } from '../shared/Toast';
import ApiKeysSection from './ApiKeysSection';

const clipboardWriteText = vi.fn().mockResolvedValue(undefined);

beforeAll(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: clipboardWriteText },
    configurable: true,
    writable: true,
  });
});

beforeEach(() => {
  clipboardWriteText.mockReset();
  clipboardWriteText.mockResolvedValue(undefined);
  resetAllStores();
  vi.clearAllMocks();
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  seedStore(useAddonStore, { addons: [], loaded: true, loadAddons: vi.fn() });
  server.use(http.get('/api/auth/api-tokens', () => HttpResponse.json({ tokens: [] })));
});

function renderSection() {
  return render(
    <>
      <ApiKeysSection />
      <ToastContainer />
    </>,
  );
}

/** userEvent.setup() installs its own clipboard stub, so the spy goes back on afterwards. */
function restoreClipboardSpy() {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: clipboardWriteText },
    configurable: true,
    writable: true,
  });
}

function createdResponse(extra: Record<string, unknown> = {}) {
  return HttpResponse.json({
    token: {
      id: 1,
      name: 'Dawarich',
      raw_token: 'trek_thefullsecretvalue',
      token_prefix: 'trek_thefull',
      created_at: '2026-08-27T10:00:00Z',
      ...extra,
    },
  });
}

function keyRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 7,
    name: 'Dawarich',
    token_prefix: 'trek_abcdefg',
    created_at: '2026-08-01T10:00:00Z',
    last_used_at: null,
    ...overrides,
  };
}

describe('ApiKeysSection', () => {
  it('FE-COMP-APIKEYS-001: renders without the MCP addon, because an API key does not need it', async () => {
    renderSection();
    expect(await screen.findByText('API Keys')).toBeInTheDocument();
  });

  it('FE-COMP-APIKEYS-002: reads its own endpoint, not the MCP token list', async () => {
    const seen: string[] = [];
    server.use(
      http.get('/api/auth/api-tokens', ({ request }) => {
        seen.push(new URL(request.url).pathname);
        return HttpResponse.json({ tokens: [] });
      }),
      http.get('/api/auth/mcp-tokens', ({ request }) => {
        seen.push(new URL(request.url).pathname);
        return HttpResponse.json({ tokens: [] });
      }),
    );
    renderSection();
    await waitFor(() => expect(seen).toContain('/api/auth/api-tokens'));
    expect(seen).not.toContain('/api/auth/mcp-tokens');
  });

  it('FE-COMP-APIKEYS-003: lists existing keys by prefix, never the key itself', async () => {
    server.use(http.get('/api/auth/api-tokens', () => HttpResponse.json({ tokens: [keyRow()] })));
    renderSection();
    expect(await screen.findByText('Dawarich')).toBeInTheDocument();
    expect(screen.getByText('trek_abcdefg…')).toBeInTheDocument();
  });

  it('FE-COMP-APIKEYS-004: shows the empty state when there is nothing to list', async () => {
    renderSection();
    expect(await screen.findByText(/No keys yet/)).toBeInTheDocument();
  });

  it('FE-COMP-APIKEYS-005: creates a key and shows it once, with the warning', async () => {
    server.use(http.post('/api/auth/api-tokens', () => createdResponse()));
    const user = userEvent.setup();
    renderSection();

    await user.click(await screen.findByRole('button', { name: /Create key/ }));
    await user.type(screen.getByPlaceholderText('e.g. Dawarich'), 'Dawarich');
    await user.click(screen.getByRole('button', { name: /^Create$/ }));

    expect(await screen.findByText('trek_thefullsecretvalue')).toBeInTheDocument();
    expect(screen.getByText(/shown once/)).toBeInTheDocument();
  });

  it('FE-COMP-APIKEYS-006: drops the raw key from the DOM once the modal is closed', async () => {
    server.use(http.post('/api/auth/api-tokens', () => createdResponse()));
    const user = userEvent.setup();
    renderSection();

    await user.click(await screen.findByRole('button', { name: /Create key/ }));
    await user.type(screen.getByPlaceholderText('e.g. Dawarich'), 'Dawarich');
    await user.click(screen.getByRole('button', { name: /^Create$/ }));
    await screen.findByText('trek_thefullsecretvalue');
    await user.click(screen.getByRole('button', { name: /Done/ }));

    await waitFor(() => expect(screen.queryByText('trek_thefullsecretvalue')).not.toBeInTheDocument());
    // The list keeps only the prefix, which is what the server stores alongside the hash.
    expect(screen.getByText('trek_thefull…')).toBeInTheDocument();
  });

  it('FE-COMP-APIKEYS-007: refuses to create a key without a name', async () => {
    const user = userEvent.setup();
    renderSection();
    await user.click(await screen.findByRole('button', { name: /Create key/ }));
    expect(screen.getByRole('button', { name: /^Create$/ })).toBeDisabled();
  });

  it('FE-COMP-APIKEYS-008: asks before deleting, and only deletes on confirm', async () => {
    let deleted = 0;
    server.use(
      http.get('/api/auth/api-tokens', () => HttpResponse.json({ tokens: [keyRow({ token_prefix: 'trek_abc' })] })),
      http.delete('/api/auth/api-tokens/7', () => {
        deleted += 1;
        return HttpResponse.json({ success: true });
      }),
    );
    const user = userEvent.setup();
    renderSection();

    await user.click(await screen.findByTitle('Delete key'));
    expect(deleted).toBe(0);
    expect(screen.getByText(/stops working immediately/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Cancel$/ }));
    expect(deleted).toBe(0);

    await user.click(await screen.findByTitle('Delete key'));
    const [, confirm] = screen.getAllByRole('button', { name: /Delete key/ });
    await user.click(confirm);
    await waitFor(() => expect(deleted).toBe(1));
    await waitFor(() => expect(screen.queryByText('Dawarich')).not.toBeInTheDocument());
  });

  it('FE-COMP-APIKEYS-009: reports a failed creation instead of pretending it worked', async () => {
    server.use(http.post('/api/auth/api-tokens', () => HttpResponse.json({ error: 'nope' }, { status: 500 })));
    const user = userEvent.setup();
    renderSection();

    await user.click(await screen.findByRole('button', { name: /Create key/ }));
    await user.type(screen.getByPlaceholderText('e.g. Dawarich'), 'Dawarich');
    await user.click(screen.getByRole('button', { name: /^Create$/ }));

    expect(await screen.findByText(/Could not create the key/)).toBeInTheDocument();
  });

  it('FE-COMP-APIKEYS-010: copies the new key to the clipboard on request', async () => {
    server.use(http.post('/api/auth/api-tokens', () => createdResponse()));
    const user = userEvent.setup();
    restoreClipboardSpy();
    renderSection();

    await user.click(await screen.findByRole('button', { name: /Create key/ }));
    await user.type(screen.getByPlaceholderText('e.g. Dawarich'), 'Dawarich');
    await user.click(screen.getByRole('button', { name: /^Create$/ }));
    const secret = await screen.findByText('trek_thefullsecretvalue');
    // The section's endpoint row has a copy button of its own; this one sits beside the key.
    await user.click(within(secret.parentElement!).getByTitle('Copy'));

    expect(clipboardWriteText).toHaveBeenCalledWith('trek_thefullsecretvalue');
    // And the button confirms it to the reader, which is the only feedback there is.
    expect(await within(secret.parentElement!).findByText('Copied')).toBeInTheDocument();
  });

  it('FE-COMP-APIKEYS-011: Enter with nothing selected does not mint a key that reads everything', async () => {
    const posts: unknown[] = [];
    server.use(
      http.post('/api/auth/api-tokens', async ({ request }) => {
        posts.push(await request.json());
        return createdResponse();
      }),
    );
    const user = userEvent.setup();
    renderSection();

    await user.click(await screen.findByRole('button', { name: /Create key/ }));
    await user.click(screen.getByRole('button', { name: 'Deselect all' }));
    expect(screen.getByText(/Pick at least one area/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Create$/ })).toBeDisabled();

    await user.type(screen.getByPlaceholderText('e.g. Dawarich'), 'Dawarich{Enter}');

    // An empty list would be dropped from the request, and the server stores
    // "no list" as a key with full access, so nothing may go out at all.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(posts).toEqual([]);
  });

  it('FE-COMP-APIKEYS-012: sends only the areas left switched on', async () => {
    const posts: Array<{ name?: string; scopes?: string[] }> = [];
    server.use(
      http.post('/api/auth/api-tokens', async ({ request }) => {
        posts.push((await request.json()) as { name?: string; scopes?: string[] });
        return createdResponse({ scope_mode: 'limited', scopes: ['trips', 'days'] });
      }),
    );
    const user = userEvent.setup();
    renderSection();

    await user.click(await screen.findByRole('button', { name: /Create key/ }));
    await user.click(screen.getByRole('button', { name: 'Deselect all' }));
    const trips = screen.getByRole('checkbox', { name: 'Trips' });
    expect(trips).toHaveAttribute('aria-checked', 'false');
    await user.click(trips);
    await user.click(screen.getByRole('checkbox', { name: 'Days' }));
    expect(trips).toHaveAttribute('aria-checked', 'true');

    await user.type(screen.getByPlaceholderText('e.g. Dawarich'), 'Dawarich');
    await user.click(screen.getByRole('button', { name: /^Create$/ }));

    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]).toEqual({ name: 'Dawarich', scopes: ['trips', 'days'] });
  });

  it('FE-COMP-APIKEYS-013: sends no list at all when every area stays on', async () => {
    const posts: Array<Record<string, unknown>> = [];
    server.use(
      http.post('/api/auth/api-tokens', async ({ request }) => {
        posts.push((await request.json()) as Record<string, unknown>);
        return createdResponse();
      }),
    );
    const user = userEvent.setup();
    renderSection();

    await user.click(await screen.findByRole('button', { name: /Create key/ }));
    // Off and back on again: the result is "everything", not a limited key that lists it all.
    await user.click(screen.getByRole('button', { name: 'Deselect all' }));
    await user.click(screen.getByRole('button', { name: 'Select all' }));
    await user.type(screen.getByPlaceholderText('e.g. Dawarich'), 'Dawarich');
    await user.click(screen.getByRole('button', { name: /^Create$/ }));

    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]).toEqual({ name: 'Dawarich' });
  });

  it('FE-COMP-APIKEYS-014: a failed load says so instead of claiming there are no keys', async () => {
    server.use(http.get('/api/auth/api-tokens', () => HttpResponse.json({ error: 'down' }, { status: 500 })));
    renderSection();

    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not load your keys/);
    expect(screen.queryByText(/No keys yet/)).not.toBeInTheDocument();
  });

  it('FE-COMP-APIKEYS-015: shows what a narrowed key may read, and that it was never used', async () => {
    server.use(
      http.get('/api/auth/api-tokens', () =>
        HttpResponse.json({ tokens: [keyRow({ scope_mode: 'limited', scopes: ['places', 'notes'] })] }),
      ),
    );
    renderSection();

    expect(await screen.findByText('Places')).toBeInTheDocument();
    expect(screen.getByText('Day notes')).toBeInTheDocument();
    expect(screen.queryByText('Everything')).not.toBeInTheDocument();
    expect(screen.getByText(/never used/)).toBeInTheDocument();
  });

  it('FE-COMP-APIKEYS-016: labels a key minted before scopes existed as reading everything', async () => {
    server.use(
      http.get('/api/auth/api-tokens', () =>
        HttpResponse.json({ tokens: [keyRow({ last_used_at: '2026-09-01 08:30:00' })] }),
      ),
    );
    renderSection();

    expect(await screen.findByText('Everything')).toBeInTheDocument();
    // SQLite's "YYYY-MM-DD HH:MM:SS" has to come out as a date, not "Invalid Date".
    expect(screen.getByText(/last used/)).not.toHaveTextContent(/Invalid Date/);
    expect(screen.getByText(/last used/)).toHaveTextContent(new Date('2026-09-01T08:30:00Z').toLocaleDateString('en'));
  });

  it('FE-COMP-APIKEYS-017: stops offering a new key once the account holds the most it can', async () => {
    const tokens = Array.from({ length: 10 }, (_, i) => keyRow({ id: i + 1, name: `Key ${i + 1}` }));
    server.use(http.get('/api/auth/api-tokens', () => HttpResponse.json({ tokens })));
    renderSection();

    expect(await screen.findByText('Key 10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create key/ })).toBeDisabled();
    expect(screen.getByText(/You have 10 keys/)).toBeInTheDocument();
  });

  it('FE-COMP-APIKEYS-018: copies the endpoint the key is meant for', async () => {
    const user = userEvent.setup();
    restoreClipboardSpy();
    renderSection();

    const endpoint = await screen.findByText(`${window.location.origin}/api/v1`);
    await user.click(within(endpoint.parentElement!).getByRole('button', { name: 'Copy' }));

    expect(clipboardWriteText).toHaveBeenCalledWith(`${window.location.origin}/api/v1`);
  });

  it('FE-COMP-APIKEYS-019: tells the reader when the clipboard refuses, instead of staying silent', async () => {
    clipboardWriteText.mockRejectedValue(new Error('denied'));
    const user = userEvent.setup();
    restoreClipboardSpy();
    renderSection();

    const endpoint = await screen.findByText(`${window.location.origin}/api/v1`);
    await user.click(within(endpoint.parentElement!).getByRole('button', { name: 'Copy' }));

    expect(await screen.findByText(/Could not copy/)).toBeInTheDocument();
  });

  it('FE-COMP-APIKEYS-020: keeps the new key on screen through Escape, so it cannot be lost by accident', async () => {
    server.use(http.post('/api/auth/api-tokens', () => createdResponse()));
    const user = userEvent.setup();
    renderSection();

    await user.click(await screen.findByRole('button', { name: /Create key/ }));
    await user.type(screen.getByPlaceholderText('e.g. Dawarich'), 'Dawarich');
    await user.click(screen.getByRole('button', { name: /^Create$/ }));
    await screen.findByText('trek_thefullsecretvalue');

    await user.keyboard('{Escape}');
    expect(screen.getByText('trek_thefullsecretvalue')).toBeInTheDocument();
  });
});
