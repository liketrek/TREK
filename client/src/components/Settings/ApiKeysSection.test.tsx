// FE-COMP-APIKEYS-001 to FE-COMP-APIKEYS-010
import { render, screen, waitFor } from '../../../tests/helpers/render';
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
  clipboardWriteText.mockClear();
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
    server.use(
      http.get('/api/auth/api-tokens', () =>
        HttpResponse.json({
          tokens: [
            {
              id: 7,
              name: 'Dawarich',
              token_prefix: 'trek_abcdefg',
              created_at: '2026-08-01T10:00:00Z',
              last_used_at: null,
            },
          ],
        }),
      ),
    );
    renderSection();
    expect(await screen.findByText('Dawarich')).toBeInTheDocument();
    expect(screen.getByText(/trek_abcdefg\.\.\./)).toBeInTheDocument();
  });

  it('FE-COMP-APIKEYS-004: shows the empty state when there is nothing to list', async () => {
    renderSection();
    expect(await screen.findByText(/No keys yet/)).toBeInTheDocument();
  });

  it('FE-COMP-APIKEYS-005: creates a key and shows it once, with the warning', async () => {
    server.use(
      http.post('/api/auth/api-tokens', () =>
        HttpResponse.json({
          token: {
            id: 1,
            name: 'Dawarich',
            raw_token: 'trek_thefullsecretvalue',
            token_prefix: 'trek_thefull',
            created_at: '2026-08-27T10:00:00Z',
          },
        }),
      ),
    );
    const user = userEvent.setup();
    renderSection();

    await user.click(await screen.findByRole('button', { name: /Create key/ }));
    await user.type(screen.getByPlaceholderText('e.g. Dawarich'), 'Dawarich');
    await user.click(screen.getByRole('button', { name: /^Create$/ }));

    expect(await screen.findByText('trek_thefullsecretvalue')).toBeInTheDocument();
    expect(screen.getByText(/shown once/)).toBeInTheDocument();
  });

  it('FE-COMP-APIKEYS-006: drops the raw key from the DOM once the modal is closed', async () => {
    server.use(
      http.post('/api/auth/api-tokens', () =>
        HttpResponse.json({
          token: {
            id: 1,
            name: 'Dawarich',
            raw_token: 'trek_thefullsecretvalue',
            token_prefix: 'trek_thefull',
            created_at: '2026-08-27T10:00:00Z',
          },
        }),
      ),
    );
    const user = userEvent.setup();
    renderSection();

    await user.click(await screen.findByRole('button', { name: /Create key/ }));
    await user.type(screen.getByPlaceholderText('e.g. Dawarich'), 'Dawarich');
    await user.click(screen.getByRole('button', { name: /^Create$/ }));
    await screen.findByText('trek_thefullsecretvalue');
    await user.click(screen.getByRole('button', { name: /Done/ }));

    await waitFor(() => expect(screen.queryByText('trek_thefullsecretvalue')).not.toBeInTheDocument());
    // The list keeps only the prefix, which is what the server stores alongside the hash.
    expect(screen.getByText(/trek_thefull\.\.\./)).toBeInTheDocument();
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
      http.get('/api/auth/api-tokens', () =>
        HttpResponse.json({
          tokens: [
            { id: 7, name: 'Dawarich', token_prefix: 'trek_abc', created_at: '2026-08-01T10:00:00Z', last_used_at: null },
          ],
        }),
      ),
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
    server.use(
      http.post('/api/auth/api-tokens', () =>
        HttpResponse.json({
          token: {
            id: 1,
            name: 'Dawarich',
            raw_token: 'trek_thefullsecretvalue',
            token_prefix: 'trek_thefull',
            created_at: '2026-08-27T10:00:00Z',
          },
        }),
      ),
    );
    const user = userEvent.setup();
    // userEvent.setup() installs its own clipboard stub, so the spy goes back on
    // afterwards — otherwise this asserts against a stub the component never reaches.
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: clipboardWriteText },
      configurable: true,
      writable: true,
    });
    renderSection();

    await user.click(await screen.findByRole('button', { name: /Create key/ }));
    await user.type(screen.getByPlaceholderText('e.g. Dawarich'), 'Dawarich');
    await user.click(screen.getByRole('button', { name: /^Create$/ }));
    await screen.findByText('trek_thefullsecretvalue');
    await user.click(screen.getByTitle('Copy'));

    expect(clipboardWriteText).toHaveBeenCalledWith('trek_thefullsecretvalue');
    // And the button confirms it to the reader, which is the only feedback there is.
    expect(await screen.findByTitle('Copy')).toBeInTheDocument();
  });
});
