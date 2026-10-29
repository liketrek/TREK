// FE-ADMIN-SVCID-001 to FE-ADMIN-SVCID-008
import userEvent from '@testing-library/user-event';
import type { ServiceIdentityStatus } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '../../../tests/helpers/msw/server';
import { render, screen, waitFor } from '../../../tests/helpers/render';
import ServiceIdentityPanel from './ServiceIdentityPanel';

// The keys themselves, so a test fails on a missing or renamed key rather than on wording.
vi.mock('../../i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../i18n')>()),
  useTranslation: () => ({ t: (key: string) => key, locale: 'en-US' }),
}));

const CONNECTED: ServiceIdentityStatus = {
  state: 'connected',
  tier: 'std',
  keySource: 'registered',
  quota: { limit: 10_000, used: 2_500, remaining: 7_500, resetAt: '2026-10-30T00:00:00.000Z' },
  lastSeenAt: '2026-10-29T12:00:00.000Z',
};

function serve(status: ServiceIdentityStatus) {
  server.use(http.get('/api/admin/service-identity', () => HttpResponse.json(status)));
}

describe('ServiceIdentityPanel', () => {
  it('FE-ADMIN-SVCID-001: shows the state, the tier and today against the limit', async () => {
    serve(CONNECTED);
    render(<ServiceIdentityPanel />);
    expect(await screen.findByText('admin.trekApi.quota.state.connected')).toBeInTheDocument();
    expect(screen.getByText('admin.trekApi.quota.tier.std')).toBeInTheDocument();
    const bar = screen.getByRole('progressbar', { name: 'admin.trekApi.quota.title' });
    expect(bar).toHaveAttribute('aria-valuenow', '2500');
    expect(bar).toHaveAttribute('aria-valuemax', '10000');
    expect(screen.getByText('2,500 / 10,000')).toBeInTheDocument();
    expect(screen.getByText('7,500')).toBeInTheDocument();
    expect(screen.getByText('admin.trekApi.quota.resets')).toBeInTheDocument();
    expect(screen.queryByText(/admin\.trekApi\.quota\.hint\./)).toBeNull();
  });

  it('FE-ADMIN-SVCID-002: an installation without a key says so and offers a new identity', async () => {
    serve({ state: 'legacy', tier: 'legacy', keySource: null, quota: null, lastSeenAt: null });
    render(<ServiceIdentityPanel />);
    expect(await screen.findByText('admin.trekApi.quota.hint.legacy')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByRole('button', { name: 'admin.trekApi.quota.regenerate' })).toBeInTheDocument();
  });

  it('FE-ADMIN-SVCID-003: switched off, it shows why and offers nothing', async () => {
    serve({ state: 'off', tier: null, keySource: null, quota: null, lastSeenAt: null });
    render(<ServiceIdentityPanel />);
    expect(await screen.findByText('admin.trekApi.quota.hint.off')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'admin.trekApi.quota.regenerate' })).toBeNull();
  });

  it('FE-ADMIN-SVCID-004: a key from the environment is named, and only changed there', async () => {
    serve({ ...CONNECTED, keySource: 'env', tier: 'own' });
    render(<ServiceIdentityPanel />);
    expect(await screen.findByText('admin.trekApi.quota.envKey')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'admin.trekApi.quota.regenerate' })).toBeNull();
  });

  it('FE-ADMIN-SVCID-005: a connected key without an allowance to show says it cannot be read', async () => {
    serve({ ...CONNECTED, quota: null });
    render(<ServiceIdentityPanel />);
    expect(await screen.findByText('admin.trekApi.quota.unavailable')).toBeInTheDocument();
  });

  it('FE-ADMIN-SVCID-006: a failed read says so instead of showing nothing', async () => {
    server.use(http.get('/api/admin/service-identity', () => HttpResponse.json({ error: 'nope' }, { status: 500 })));
    render(<ServiceIdentityPanel />);
    expect(await screen.findByText('admin.trekApi.quota.unavailable')).toBeInTheDocument();
  });

  it('FE-ADMIN-SVCID-007: a revoked key asks before it starts over, then shows the new state', async () => {
    let regenerated = 0;
    serve({ state: 'revoked', tier: 'std', keySource: 'registered', quota: null, lastSeenAt: null });
    server.use(
      http.post('/api/admin/service-identity/regenerate', () => {
        regenerated += 1;
        return HttpResponse.json({
          state: 'registering',
          tier: 'legacy',
          keySource: null,
          quota: null,
          lastSeenAt: null,
        });
      })
    );
    const user = userEvent.setup();
    render(<ServiceIdentityPanel />);
    expect(await screen.findByText('admin.trekApi.quota.hint.revoked')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'admin.trekApi.quota.regenerate' }));
    expect(screen.getByText('admin.trekApi.quota.regenerateBody')).toBeInTheDocument();
    expect(regenerated).toBe(0);

    const confirm = screen.getAllByRole('button', { name: 'admin.trekApi.quota.regenerate' }).at(-1);
    if (!confirm) throw new Error('no confirm button');
    await user.click(confirm);
    await waitFor(() => expect(regenerated).toBe(1));
    expect(await screen.findByText('admin.trekApi.quota.hint.registering')).toBeInTheDocument();
  });

  it('FE-ADMIN-SVCID-008: a managed install leaves the identity to its operator', async () => {
    serve({ state: 'revoked', tier: 'std', keySource: 'registered', quota: null, lastSeenAt: null });
    render(<ServiceIdentityPanel managed />);
    expect(await screen.findByText('admin.trekApi.quota.hint.revoked')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'admin.trekApi.quota.regenerate' })).toBeNull();
  });
});
