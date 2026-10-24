import userEvent from '@testing-library/user-event';
import type { WandererConnection } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../tests/helpers/msw/server';
import { render, screen, waitFor } from '../../../tests/helpers/render';
import { resetAllStores } from '../../../tests/helpers/store';
import WandererConnectionSection from './WandererConnectionSection';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));

const disconnected: WandererConnection = {
  url: '',
  tokenMasked: '',
  allowInsecureTls: false,
  connected: false,
  lastCheckedAt: null,
  lastCheckOk: null,
  lastCheckError: null,
};
const connected: WandererConnection = {
  ...disconnected,
  url: 'https://wanderer.test',
  tokenMasked: '••••••••',
  connected: true,
};

function settingsRoute(state: { current: typeof disconnected }) {
  return http.get('/api/integrations/wanderer/settings', () => HttpResponse.json(state.current));
}

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
});

describe('WandererConnectionSection', () => {
  it('RS-03: saves an address and a token, and never fills the token back in', async () => {
    const state = { current: disconnected };
    const saved: unknown[] = [];
    server.use(
      settingsRoute(state),
      http.put('/api/integrations/wanderer/settings', async ({ request }) => {
        saved.push(await request.json());
        state.current = connected;
        return HttpResponse.json({ success: true });
      })
    );
    render(<WandererConnectionSection />);

    expect(await screen.findByText('Not connected')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Instance URL'), 'https://wanderer.test');
    await userEvent.type(screen.getByLabelText('API token'), 'wanderer_key_abc');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(saved).toEqual([{ url: 'https://wanderer.test', token: 'wanderer_key_abc', allowInsecureTls: false }])
    );
    expect(await screen.findByText('Connected')).toBeInTheDocument();
    expect(screen.getByLabelText('API token')).toHaveValue('');
    expect(toast.success).toHaveBeenCalled();
  });

  it('RS-03: says a token that is not a wanderer API token before sending it', async () => {
    server.use(settingsRoute({ current: disconnected }));
    render(<WandererConnectionSection />);
    await userEvent.type(await screen.findByLabelText('Instance URL'), 'https://wanderer.test');
    await userEvent.type(screen.getByLabelText('API token'), 'my-password');

    expect(screen.getByLabelText('API token')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('RS-03: a test names how many own trails there are, or why it failed', async () => {
    const answers = [
      { ok: true, trailCount: 5 },
      { ok: false, code: 'unauthorized' },
    ];
    server.use(
      settingsRoute({ current: connected }),
      http.post('/api/integrations/wanderer/test', () => HttpResponse.json(answers.shift()))
    );
    render(<WandererConnectionSection />);
    await screen.findByText('Connected');

    await userEvent.click(screen.getByRole('button', { name: 'Test connection' }));
    expect(await screen.findByText('Connected. You can import 5 of your trails.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Test connection' }));
    expect(await screen.findByRole('status')).not.toHaveTextContent('Connected. You can');
  });

  it('RS-03: shows what the last check said when it failed', async () => {
    server.use(
      settingsRoute({
        current: { ...connected, lastCheckedAt: '2026-10-15 10:00:00', lastCheckOk: false, lastCheckError: 'disabled' },
      })
    );
    render(<WandererConnectionSection />);
    expect(await screen.findByText('Your admin has not enabled wanderer for Tours.')).toBeInTheDocument();
  });

  it('RS-03: disconnecting forgets the connection', async () => {
    const state = { current: connected };
    server.use(
      settingsRoute(state),
      http.delete('/api/integrations/wanderer/settings', () => {
        state.current = disconnected;
        return HttpResponse.json({ success: true });
      })
    );
    render(<WandererConnectionSection />);
    await userEvent.click(await screen.findByRole('button', { name: 'Disconnect' }));
    expect(await screen.findByText('Not connected')).toBeInTheDocument();
  });

  it('RS-03: a refused save is said as its reason', async () => {
    server.use(
      settingsRoute({ current: disconnected }),
      http.put('/api/integrations/wanderer/settings', () =>
        HttpResponse.json({ error: 'x', code: 'blocked_address' }, { status: 400 })
      )
    );
    render(<WandererConnectionSection />);
    await userEvent.type(await screen.findByLabelText('Instance URL'), 'http://10.0.0.5');
    await userEvent.type(screen.getByLabelText('API token'), 'wanderer_key_abc');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});
