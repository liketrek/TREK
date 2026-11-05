// FE-ADMIN-CONTRIB-001 to FE-ADMIN-CONTRIB-013
import userEvent from '@testing-library/user-event';
import type { PlaceContribDecisionRequest, PlaceContribState } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '../../../tests/helpers/msw/server';
import { render, screen, waitFor, within } from '../../../tests/helpers/render';
import PlaceContribPanel from './PlaceContribPanel';

// The keys themselves, so a test fails on a missing or renamed key rather than on wording.
vi.mock('../../i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../i18n')>()),
  useTranslation: () => ({ t: (key: string) => key, locale: 'en-US' }),
}));

const ON = { website: true, phone: true, email: true, opening_hours: true, description: true, image: true };

const UNDECIDED: PlaceContribState = {
  termsVersion: 1,
  ceiling: 'admin',
  eligible: true,
  ineligibleReason: null,
  consent: { enabled: false, fields: ON, termsVersion: null, decision: null, decidedBy: null, decidedAt: null },
  showPrompt: true,
  snoozedUntil: null,
  active: false,
  counts: { accepted: 0, duplicate: 0, rejected: 0, withheld: 0, retracted: 0 },
  lastSuccessDay: null,
  queue: { size: 0, cap: 5000, full: false },
  pauseReason: null,
  registrationOpen: false,
};

const AGREED: PlaceContribState = {
  ...UNDECIDED,
  showPrompt: false,
  active: true,
  consent: {
    enabled: true,
    fields: ON,
    termsVersion: 1,
    decision: 'agreed',
    decidedBy: 1,
    decidedAt: '2026-10-30T10:00:00Z',
  },
  counts: { accepted: 42, duplicate: 3, rejected: 1, withheld: 5, retracted: 0 },
  lastSuccessDay: '2026-10-29',
  queue: { size: 7, cap: 5000, full: false },
};

/** Serves `state`, records every decision and answers it with `answer`. */
function serve(
  state: PlaceContribState,
  answer: (body: PlaceContribDecisionRequest) => PlaceContribState = () => state
) {
  const decisions: PlaceContribDecisionRequest[] = [];
  server.use(
    http.get('/api/admin/places-contribute', () => HttpResponse.json(state)),
    http.put('/api/admin/places-contribute/decision', async ({ request }) => {
      const body = (await request.json()) as PlaceContribDecisionRequest;
      decisions.push(body);
      return HttpResponse.json(answer(body));
    }),
    http.get('/api/admin/places-contribute/log', () =>
      HttpResponse.json({ entries: [], total: 0, page: 1, perPage: 20 })
    )
  );
  return decisions;
}

describe('PlaceContribPanel', () => {
  it('FE-ADMIN-CONTRIB-001: an undecided admin gets the prompt with every field switched on', async () => {
    serve(UNDECIDED);
    render(<PlaceContribPanel />);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('admin.contribute.prompt.title')).toBeInTheDocument();
    for (const field of Object.keys(ON)) {
      expect(within(dialog).getByRole('button', { name: `admin.contribute.field.${field}` })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    }
    expect(within(dialog).getByText('admin.contribute.never.notes')).toBeInTheDocument();
    expect(within(dialog).getByText('admin.contribute.never.providers')).toBeInTheDocument();
  });

  it('FE-ADMIN-CONTRIB-002: nothing is decided until a button is pressed, and Agree sends the switches it shows', async () => {
    const decisions = serve(UNDECIDED, () => AGREED);
    render(<PlaceContribPanel />);
    const dialog = await screen.findByRole('dialog');
    expect(decisions).toHaveLength(0);
    await userEvent.click(within(dialog).getByRole('button', { name: 'admin.contribute.field.image' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'admin.contribute.prompt.agree' }));
    await waitFor(() => expect(decisions).toHaveLength(1));
    expect(decisions[0]).toEqual({ action: 'agree', termsVersion: 1, fields: { ...ON, image: false } });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByText('admin.contribute.status.active')).toBeInTheDocument();
  });

  it('FE-ADMIN-CONTRIB-003: Agree is unavailable with every field off', async () => {
    serve(UNDECIDED);
    render(<PlaceContribPanel />);
    const dialog = await screen.findByRole('dialog');
    for (const field of Object.keys(ON)) {
      await userEvent.click(within(dialog).getByRole('button', { name: `admin.contribute.field.${field}` }));
    }
    expect(within(dialog).getByRole('button', { name: 'admin.contribute.prompt.agree' })).toBeDisabled();
  });

  it('FE-ADMIN-CONTRIB-004: "not now" snoozes and "no" declines for the current terms', async () => {
    const decisions = serve(UNDECIDED, () => ({ ...UNDECIDED, showPrompt: false }));
    const { unmount } = render(<PlaceContribPanel />);
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'admin.contribute.prompt.snooze' })
    );
    await waitFor(() => expect(decisions).toEqual([{ action: 'snooze' }]));
    unmount();

    render(<PlaceContribPanel />);
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'admin.contribute.prompt.decline' })
    );
    await waitFor(() => expect(decisions[1]).toEqual({ action: 'decline', termsVersion: 1 }));
  });

  it('FE-ADMIN-CONTRIB-005: closing the prompt decides nothing', async () => {
    const decisions = serve(UNDECIDED);
    render(<PlaceContribPanel />);
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(decisions).toHaveLength(0);
  });

  it('FE-ADMIN-CONTRIB-006: an agreement shows its figures and a switch per field', async () => {
    serve(AGREED);
    render(<PlaceContribPanel />);
    expect(await screen.findByText('admin.contribute.status.active')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'admin.contribute.field.phone' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('FE-ADMIN-CONTRIB-007: switching a field off sends the new switches', async () => {
    const decisions = serve(AGREED);
    render(<PlaceContribPanel />);
    await userEvent.click(await screen.findByRole('button', { name: 'admin.contribute.field.description' }));
    await waitFor(() => expect(decisions).toEqual([{ action: 'fields', fields: { ...ON, description: false } }]));
  });

  it('FE-ADMIN-CONTRIB-008: the master switch asks before it stops sharing', async () => {
    const decisions = serve(AGREED, () => ({
      ...AGREED,
      active: false,
      consent: { ...AGREED.consent, enabled: false, decision: 'off' },
    }));
    render(<PlaceContribPanel />);
    await userEvent.click(await screen.findByRole('button', { name: 'admin.contribute.title' }));
    expect(decisions).toHaveLength(0);
    await userEvent.click(screen.getByRole('button', { name: 'admin.contribute.offConfirm' }));
    await waitFor(() => expect(decisions).toEqual([{ action: 'off' }]));
  });

  it('FE-ADMIN-CONTRIB-009: an installation that cannot share says why and has no prompt', async () => {
    serve({ ...UNDECIDED, eligible: false, ineligibleReason: 'custom_places_url', showPrompt: false });
    render(<PlaceContribPanel />);
    expect(await screen.findByText('admin.contribute.ineligible.custom_places_url')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'admin.contribute.title' })).toBeDisabled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('FE-ADMIN-CONTRIB-010: open registration is named in the prompt', async () => {
    serve({ ...UNDECIDED, registrationOpen: true });
    render(<PlaceContribPanel />);
    expect(
      await within(await screen.findByRole('dialog')).findByText('admin.contribute.prompt.openRegistration')
    ).toBeInTheDocument();
  });
  it('FE-ADMIN-CONTRIB-011: asks again while the key is still being fetched, and the prompt follows', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      let reads = 0;
      server.use(
        http.get('/api/admin/places-contribute', () => {
          reads += 1;
          return HttpResponse.json(
            reads === 1 ? { ...UNDECIDED, eligible: false, ineligibleReason: 'no_key', showPrompt: false } : UNDECIDED
          );
        })
      );
      render(<PlaceContribPanel />);
      expect(await screen.findByText('admin.contribute.ineligible.no_key')).toBeInTheDocument();
      await vi.advanceTimersByTimeAsync(3_000);
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(reads).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('FE-ADMIN-CONTRIB-012: standing alone, a card the operator switched off is not shown', async () => {
    const asked = vi.fn();
    server.use(
      http.get('/api/admin/places-contribute', () => {
        asked();
        return HttpResponse.json({ ...UNDECIDED, eligible: false, ineligibleReason: 'env_off', showPrompt: false });
      })
    );
    const { container } = render(<PlaceContribPanel hideWhenSwitchedOff />);
    await waitFor(() => expect(asked).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-ADMIN-CONTRIB-013: standing alone, any other reason is still explained', async () => {
    serve({ ...UNDECIDED, eligible: false, ineligibleReason: 'not_production', showPrompt: false });
    render(<PlaceContribPanel hideWhenSwitchedOff />);
    expect(await screen.findByText('admin.contribute.ineligible.not_production')).toBeInTheDocument();
  });
});
