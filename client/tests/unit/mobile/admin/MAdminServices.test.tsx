// FE-MOB-ASVC-001 to FE-MOB-ASVC-009
import userEvent from '@testing-library/user-event';
import type { PlaceContribDecisionRequest, PlaceContribState, ServiceIdentityStatus } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import MAdminGoogleDailyLimit from '../../../../src/mobile/screens/admin/MAdminGoogleDailyLimit';
import MAdminPlaceContrib from '../../../../src/mobile/screens/admin/MAdminPlaceContrib';
import MAdminServiceQuota from '../../../../src/mobile/screens/admin/MAdminServiceQuota';
import { server } from '../../../helpers/msw/server';
import { render, screen, waitFor, within } from '../../../helpers/render';

// The keys themselves, so a test fails on a missing or renamed key rather than on wording.
vi.mock('../../../../src/i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/i18n')>()),
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
  ],
  lastSeenAt: '2026-10-29T12:00:00.000Z',
} as ServiceIdentityStatus;

const ON = { website: true, phone: true, email: true, opening_hours: true, description: true, image: true };
const AGREED: PlaceContribState = {
  termsVersion: 1,
  ceiling: 'admin',
  eligible: true,
  ineligibleReason: null,
  consent: {
    enabled: true,
    fields: ON,
    termsVersion: 1,
    decision: 'agreed',
    decidedBy: 1,
    decidedAt: '2026-10-30T10:00:00Z',
  },
  showPrompt: false,
  snoozedUntil: null,
  active: true,
  counts: { accepted: 42, duplicate: 0, rejected: 0, withheld: 0, retracted: 0 },
  lastSuccessDay: '2026-10-29',
  queue: { size: 7, cap: 5000, full: false },
  pauseReason: null,
  registrationOpen: false,
};

function serveContrib(state: PlaceContribState) {
  const decisions: PlaceContribDecisionRequest[] = [];
  server.use(
    http.get('/api/admin/places-contribute', () => HttpResponse.json(state)),
    http.put('/api/admin/places-contribute/decision', async ({ request }) => {
      decisions.push((await request.json()) as PlaceContribDecisionRequest);
      return HttpResponse.json(state);
    }),
    http.get('/api/admin/places-contribute/log', () =>
      HttpResponse.json({ entries: [], total: 0, page: 1, perPage: 20 })
    )
  );
  return decisions;
}

describe('MAdminServiceQuota', () => {
  it('FE-MOB-ASVC-001: shows the state, the day used against the limit and an unused service', async () => {
    server.use(http.get('/api/admin/service-identity', () => HttpResponse.json(CONNECTED)));
    render(<MAdminServiceQuota />);
    expect(await screen.findByText('admin.trekApi.quota.state.connected')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'admin.trekApi.quota.service.places' })).toHaveAttribute(
      'aria-valuenow',
      '2500'
    );
    expect(screen.getByText('admin.trekApi.quota.notInUse')).toBeInTheDocument();
  });

  it('FE-MOB-ASVC-002: a new key is asked for through a confirm sheet', async () => {
    const user = userEvent.setup();
    let regenerated = false;
    server.use(
      http.get('/api/admin/service-identity', () => HttpResponse.json(CONNECTED)),
      http.post('/api/admin/service-identity/regenerate', () => {
        regenerated = true;
        return HttpResponse.json(CONNECTED);
      })
    );
    render(<MAdminServiceQuota />);
    await user.click(await screen.findByRole('button', { name: /admin.trekApi.quota.regenerate/ }));
    const sheet = await screen.findByRole('dialog', { name: 'admin.trekApi.quota.regenerateTitle' });
    await user.click(within(sheet).getByRole('button', { name: 'admin.trekApi.quota.regenerate' }));
    await waitFor(() => expect(regenerated).toBe(true));
  });

  it('FE-MOB-ASVC-003: a managed install offers no new key', async () => {
    server.use(http.get('/api/admin/service-identity', () => HttpResponse.json(CONNECTED)));
    render(<MAdminServiceQuota managed />);
    await screen.findByText('admin.trekApi.quota.state.connected');
    expect(screen.queryByRole('button', { name: /admin.trekApi.quota.regenerate/ })).not.toBeInTheDocument();
  });
});

describe('MAdminGoogleDailyLimit', () => {
  it('FE-MOB-ASVC-004: shows today against the cap and saves a new cap', async () => {
    const user = userEvent.setup();
    let body: unknown = null;
    server.use(
      http.get('/api/admin/google-quota', () =>
        HttpResponse.json({ daily_limit: 500, used_today: 3, exhausted: false })
      ),
      http.put('/api/admin/google-quota', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ daily_limit: 800, used_today: 3, exhausted: false });
      })
    );
    render(<MAdminGoogleDailyLimit />);
    expect(await screen.findByText('admin.googleQuota.usedOfLimit')).toBeInTheDocument();
    const field = screen.getByRole('textbox', { name: 'admin.googleQuota.title' });
    await user.clear(field);
    await user.type(field, '800');
    await user.click(screen.getByRole('button', { name: /common.save/ }));
    await waitFor(() => expect(body).not.toBeNull());
  });

  it('FE-MOB-ASVC-005: a used-up day reads as reached', async () => {
    server.use(
      http.get('/api/admin/google-quota', () => HttpResponse.json({ daily_limit: 10, used_today: 10, exhausted: true }))
    );
    render(<MAdminGoogleDailyLimit />);
    expect(await screen.findByText('admin.googleQuota.reached')).toBeInTheDocument();
  });
});

describe('MAdminPlaceContrib', () => {
  it('FE-MOB-ASVC-006: on, it shows the figures and one switch per field', async () => {
    serveContrib(AGREED);
    render(<MAdminPlaceContrib />);
    expect(await screen.findByRole('switch', { name: 'admin.contribute.title' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByText(/admin.contribute.figure.accepted 42/)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'admin.contribute.field.website' })).toBeInTheDocument();
  });

  it('FE-MOB-ASVC-007: switching a field off sends the remaining fields', async () => {
    const user = userEvent.setup();
    const decisions = serveContrib(AGREED);
    render(<MAdminPlaceContrib />);
    await user.click(await screen.findByRole('switch', { name: 'admin.contribute.field.phone' }));
    await waitFor(() => expect(decisions).toHaveLength(1));
    expect(decisions[0]).toMatchObject({ action: 'fields', fields: { ...ON, phone: false } });
  });

  it('FE-MOB-ASVC-008: switching it off asks first, then sends off', async () => {
    const user = userEvent.setup();
    const decisions = serveContrib(AGREED);
    render(<MAdminPlaceContrib />);
    await user.click(await screen.findByRole('switch', { name: 'admin.contribute.title' }));
    const sheet = await screen.findByRole('dialog', { name: 'admin.contribute.offTitle' });
    await user.click(within(sheet).getByRole('button', { name: 'admin.contribute.offConfirm' }));
    await waitFor(() => expect(decisions).toEqual([{ action: 'off' }]));
  });

  it('FE-MOB-ASVC-009: standing alone, a switch the environment turned off hides the panel', async () => {
    serveContrib({ ...AGREED, eligible: false, ineligibleReason: 'env_off' });
    render(<MAdminPlaceContrib hideWhenSwitchedOff />);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });
});
