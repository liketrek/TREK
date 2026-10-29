// FE-ADMIN-SVCID-001 to FE-ADMIN-SVCID-010
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

const QUOTA = { limit: 10_000, used: 2_500, remaining: 7_500, resetAt: '2026-10-30T00:00:00.000Z' };
const CONNECTED: ServiceIdentityStatus = {
  state: 'connected',
  tier: 'std',
  keySource: 'registered',
  services: [
    { service: 'places', inUse: true, quota: QUOTA },
    { service: 'photon', inUse: false, quota: null },
    { service: 'valhalla', inUse: false, quota: null },
  ],
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
    const bar = screen.getByRole('progressbar', { name: 'admin.trekApi.quota.service.places' });
    expect(bar).toHaveAttribute('aria-valuenow', '2500');
    expect(bar).toHaveAttribute('aria-valuemax', '10000');
    expect(screen.getByText('2,500 / 10,000')).toBeInTheDocument();
    expect(screen.getByText('7,500')).toBeInTheDocument();
    expect(screen.getByText('admin.trekApi.quota.resets')).toBeInTheDocument();
    expect(screen.queryByText(/admin\.trekApi\.quota\.hint\./)).toBeNull();
  });

  it('FE-ADMIN-SVCID-002: an installation without a key says so and offers a new identity', async () => {
    serve({ state: 'legacy', tier: 'legacy', keySource: null, services: [], lastSeenAt: null });
    render(<ServiceIdentityPanel />);
    expect(await screen.findByText('admin.trekApi.quota.hint.legacy')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByRole('button', { name: 'admin.trekApi.quota.regenerate' })).toBeInTheDocument();
  });

  it('FE-ADMIN-SVCID-003: switched off, it shows why and offers nothing', async () => {
    serve({ state: 'off', tier: null, keySource: null, services: [], lastSeenAt: null });
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

  it('FE-ADMIN-SVCID-005: a service in use without an allowance to show says it cannot be read', async () => {
    serve({ ...CONNECTED, services: [{ service: 'places', inUse: true, quota: null }] });
    render(<ServiceIdentityPanel />);
    expect(await screen.findByText('admin.trekApi.quota.unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('FE-ADMIN-SVCID-009: lists place search, address search and routing, each with its own allowance', async () => {
    serve({
      ...CONNECTED,
      services: [
        { service: 'places', inUse: true, quota: QUOTA },
        { service: 'photon', inUse: true, quota: { ...QUOTA, used: 40, remaining: 9_960 } },
        { service: 'valhalla', inUse: true, quota: { ...QUOTA, used: 9_500, remaining: 500 } },
      ],
    });
    render(<ServiceIdentityPanel />);
    const list = await screen.findByRole('list', { name: 'admin.trekApi.quota.title' });
    expect(list.querySelectorAll('li')).toHaveLength(3);
    const value = (name: string) => screen.getByRole('progressbar', { name }).getAttribute('aria-valuenow');
    expect(value('admin.trekApi.quota.service.places')).toBe('2500');
    expect(value('admin.trekApi.quota.service.photon')).toBe('40');
    expect(value('admin.trekApi.quota.service.valhalla')).toBe('9500');
    expect(screen.queryByText('admin.trekApi.quota.notInUse')).toBeNull();
  });

  it('FE-ADMIN-SVCID-010: a service this instance does not ask is named as not in use, its allowance still shown', async () => {
    serve({
      ...CONNECTED,
      services: [
        { service: 'places', inUse: true, quota: QUOTA },
        { service: 'photon', inUse: false, quota: null },
        { service: 'valhalla', inUse: false, quota: QUOTA },
      ],
    });
    render(<ServiceIdentityPanel />);
    expect(await screen.findAllByText('admin.trekApi.quota.notInUse')).toHaveLength(2);
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
    expect(screen.queryByText('admin.trekApi.quota.unavailable')).toBeNull();
  });

  it('FE-ADMIN-SVCID-006: a failed read says so instead of showing nothing', async () => {
    server.use(http.get('/api/admin/service-identity', () => HttpResponse.json({ error: 'nope' }, { status: 500 })));
    render(<ServiceIdentityPanel />);
    expect(await screen.findByText('admin.trekApi.quota.unavailable')).toBeInTheDocument();
  });

  it('FE-ADMIN-SVCID-007: a revoked key asks before it starts over, then shows the new state', async () => {
    let regenerated = 0;
    serve({ state: 'revoked', tier: 'std', keySource: 'registered', services: [], lastSeenAt: null });
    server.use(
      http.post('/api/admin/service-identity/regenerate', () => {
        regenerated += 1;
        return HttpResponse.json({
          state: 'registering',
          tier: 'legacy',
          keySource: null,
          services: [],
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

    const regenerateButtons = screen.getAllByRole('button', { name: 'admin.trekApi.quota.regenerate' });
    const confirm = regenerateButtons[regenerateButtons.length - 1];
    if (!confirm) throw new Error('no confirm button');
    await user.click(confirm);
    await waitFor(() => expect(regenerated).toBe(1));
    expect(await screen.findByText('admin.trekApi.quota.hint.registering')).toBeInTheDocument();
  });

  it('FE-ADMIN-SVCID-008: a managed install leaves the identity to its operator', async () => {
    serve({ state: 'revoked', tier: 'std', keySource: 'registered', services: [], lastSeenAt: null });
    render(<ServiceIdentityPanel managed />);
    expect(await screen.findByText('admin.trekApi.quota.hint.revoked')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'admin.trekApi.quota.regenerate' })).toBeNull();
  });
});
