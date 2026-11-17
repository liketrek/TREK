// FE-MOB-WAND-001 to FE-MOB-WAND-004
import userEvent from '@testing-library/user-event';
import type { WandererConnection } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MWandererConnectionSection from '../../../../src/mobile/screens/settings/MWandererConnectionSection';
import { server } from '../../../helpers/msw/server';
import { render, screen, waitFor } from '../../../helpers/render';
import { resetAllStores } from '../../../helpers/store';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../../../../src/components/shared/Toast', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/components/shared/Toast')>()),
  useToast: () => toast,
}));

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

function settingsRoute(state: { current: WandererConnection }) {
  return http.get('/api/integrations/wanderer/settings', () => HttpResponse.json(state.current));
}

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
});

describe('MWandererConnectionSection', () => {
  it('FE-MOB-WAND-001: saves an address and a token and shows the connection', async () => {
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
    render(<MWandererConnectionSection />);

    expect(await screen.findByText('Not connected')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Instance URL'), 'https://wanderer.test');
    await userEvent.type(screen.getByLabelText('API token'), 'wanderer_key_abc');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(saved).toEqual([{ url: 'https://wanderer.test', token: 'wanderer_key_abc', allowInsecureTls: false }])
    );
    expect(await screen.findByText('Connected')).toBeInTheDocument();
  });

  it('FE-MOB-WAND-002: a token that is no wanderer API token is called out and not sent', async () => {
    server.use(settingsRoute({ current: disconnected }));
    render(<MWandererConnectionSection />);
    await userEvent.type(await screen.findByLabelText('Instance URL'), 'https://wanderer.test');
    await userEvent.type(screen.getByLabelText('API token'), 'my-password');

    expect(screen.getByLabelText('API token')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('FE-MOB-WAND-003: a test reports its result in the card', async () => {
    server.use(
      settingsRoute({ current: connected }),
      http.post('/api/integrations/wanderer/test', () => HttpResponse.json({ ok: true, trailCount: 5 }))
    );
    render(<MWandererConnectionSection />);
    await screen.findByText('Connected');
    await userEvent.click(screen.getByRole('button', { name: /Test connection|Test/ }));
    expect(await screen.findByRole('status')).toBeInTheDocument();
  });

  it('FE-MOB-WAND-004: a connected install can be disconnected', async () => {
    let deleted = false;
    server.use(
      settingsRoute({ current: connected }),
      http.delete('/api/integrations/wanderer/settings', () => {
        deleted = true;
        return HttpResponse.json({ success: true });
      })
    );
    render(<MWandererConnectionSection />);
    await screen.findByText('Connected');
    await userEvent.click(screen.getByRole('button', { name: /Disconnect/ }));
    await waitFor(() => expect(deleted).toBe(true));
  });
});
