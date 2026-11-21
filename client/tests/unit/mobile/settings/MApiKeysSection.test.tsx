// FE-MOB-APIKEY-001 to FE-MOB-APIKEY-005
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MApiKeysSection from '../../../../src/mobile/screens/settings/MApiKeysSection';
import { server } from '../../../helpers/msw/server';
import { render, screen, waitFor, within } from '../../../helpers/render';
import { resetAllStores } from '../../../helpers/store';

const KEY = {
  id: 7,
  name: 'Dawarich',
  token_prefix: 'trek_abc',
  created_at: '2026-08-27 10:00:00',
  last_used_at: null,
  scope_mode: 'limited',
  scopes: ['trips', 'places'],
};

beforeEach(() => {
  resetAllStores();
  server.use(http.get('/api/auth/api-tokens', () => HttpResponse.json({ tokens: [] })));
});

describe('MApiKeysSection', () => {
  it('FE-MOB-APIKEY-001: no keys yet says so and offers the endpoint', async () => {
    render(<MApiKeysSection />);
    expect(await screen.findByText(/No keys yet/)).toBeInTheDocument();
    expect(screen.getByText(/\/api\/v1$/)).toBeInTheDocument();
  });

  it('FE-MOB-APIKEY-002: a key shows its name, prefix and the areas it may read', async () => {
    server.use(http.get('/api/auth/api-tokens', () => HttpResponse.json({ tokens: [KEY] })));
    render(<MApiKeysSection />);
    expect(await screen.findByText('Dawarich')).toBeInTheDocument();
    expect(screen.getByText('trek_abc…')).toBeInTheDocument();
    expect(screen.getByText('1/10')).toBeInTheDocument();
  });

  it('FE-MOB-APIKEY-003: creating a key sends its name and shows the key once', async () => {
    const user = userEvent.setup();
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/auth/api-tokens', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          token: {
            id: 1,
            name: 'Home',
            raw_token: 'trek_thefullsecret',
            token_prefix: 'trek_thefull',
            created_at: '2026-08-27T10:00:00Z',
          },
        });
      })
    );
    render(<MApiKeysSection />);
    await screen.findByText(/No keys yet/);

    await user.click(screen.getByRole('button', { name: /Create key/ }));
    const sheet = await screen.findByRole('dialog');
    await user.type(within(sheet).getByLabelText('Name'), 'Home');
    await user.click(within(sheet).getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('trek_thefullsecret')).toBeInTheDocument();
    // Every area selected means no narrowing: the server stores the key as reading everything.
    expect(body).toEqual({ name: 'Home' });
  });

  it('FE-MOB-APIKEY-004: switching an area off narrows the new key', async () => {
    const user = userEvent.setup();
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/auth/api-tokens', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          token: {
            id: 1,
            name: 'Home',
            raw_token: 'trek_x',
            token_prefix: 'trek_x',
            created_at: '2026-08-27T10:00:00Z',
          },
        });
      })
    );
    render(<MApiKeysSection />);
    await screen.findByText(/No keys yet/);
    await user.click(screen.getByRole('button', { name: /Create key/ }));
    const sheet = await screen.findByRole('dialog');
    await user.type(within(sheet).getByLabelText('Name'), 'Home');
    const pressed = within(sheet).getAllByRole('button', { pressed: true });
    await user.click(pressed[0]);
    await user.click(within(sheet).getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(body).not.toBeNull());
    expect(Array.isArray((body as unknown as { scopes: unknown }).scopes)).toBe(true);
  });

  it('FE-MOB-APIKEY-005: deleting a key asks first, then removes it', async () => {
    const user = userEvent.setup();
    let deleted = false;
    server.use(
      http.get('/api/auth/api-tokens', () => HttpResponse.json({ tokens: [KEY] })),
      http.delete('/api/auth/api-tokens/:id', () => {
        deleted = true;
        return HttpResponse.json({ success: true });
      })
    );
    render(<MApiKeysSection />);
    await screen.findByText('Dawarich');
    await user.click(screen.getByRole('button', { name: 'Delete key' }));
    const confirm = await screen.findByRole('dialog', { name: 'Delete key' });
    await user.click(within(confirm).getByRole('button', { name: 'Delete key' }));
    await waitFor(() => expect(deleted).toBe(true));
    await waitFor(() => expect(screen.queryByText('Dawarich')).not.toBeInTheDocument());
  });
});

vi.mock('../../../../src/components/shared/Toast', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/components/shared/Toast')>()),
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }),
}));
