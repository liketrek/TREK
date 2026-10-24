/**
 * FE-AI-ERR-001 to FE-AI-ERR-008
 *
 * The error line: one sentence, at most one thing to do, and that thing
 * does what it says.
 */
import type { AiStatusResponse, AssistantErrorCode } from '@trek/shared';
import { Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { setForcedOffline } from '../../sync/networkMode';
import AssistantError from './AssistantError';

const TRIP = 4;
const INITIAL = useAssistantStore.getState();

const STATUS: AiStatusResponse = {
  available: true,
  policy: 'instance_or_user',
  canConnectOwn: true,
  effective: { source: 'user', kind: 'anthropic', model: 'claude', host: 'api.anthropic.com', paidBy: 'user' },
  own: null,
  instance: null,
  quota: null,
  privacyAcked: true,
  retention: { mode: 'days', days: 90 },
  openrouterOAuth: true,
};

const retry = vi.fn(async () => {});
const continueHere = vi.fn(async () => {});
const send = vi.fn(async () => {});

function withError(error: AssistantErrorCode | null, status: AiStatusResponse = STATUS) {
  useAssistantStore.setState({
    status,
    retry,
    continueHere,
    send,
    byTrip: { [TRIP]: { ...chatOf(useAssistantStore.getState(), TRIP), error } },
  });
}

function renderLine() {
  return render(
    <Routes>
      <Route path="/trips/4" element={<AssistantError tripId={TRIP} />} />
      <Route path="/settings" element={<p>settings page</p>} />
    </Routes>,
    { initialEntries: ['/trips/4'] }
  );
}

beforeEach(() => setForcedOffline(false));
afterEach(() => {
  useAssistantStore.setState(INITIAL, true);
  setForcedOffline(false);
  vi.clearAllMocks();
});

describe('AssistantError', () => {
  it('FE-AI-ERR-001: shows nothing while all is well', () => {
    withError(null);
    const { container } = renderLine();
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-AI-ERR-002: names the provider and retries a provider that was down', () => {
    withError('provider_unavailable');
    renderLine();
    expect(screen.getByRole('status')).toHaveTextContent('Anthropic isn’t responding right now.');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledWith(TRIP);
  });

  it('FE-AI-ERR-003: a busy chat continues here, and a long run goes on with "Continue"', () => {
    withError('busy');
    const { unmount } = renderLine();
    fireEvent.click(screen.getByRole('button', { name: 'Continue here' }));
    expect(continueHere).toHaveBeenCalledWith(TRIP);
    unmount();

    withError('max_steps');
    renderLine();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(send).toHaveBeenCalledWith(TRIP, 'Continue');
  });

  it('FE-AI-ERR-004: an expired sign-in leads straight to the settings card', () => {
    withError('needs_reauth');
    renderLine();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in again' }));
    expect(screen.getByText('settings page')).toBeInTheDocument();
  });

  it('FE-AI-ERR-006: an own key that stopped working says so before anything is sent', () => {
    withError(null, {
      ...STATUS,
      own: {
        scope: 'user',
        kind: 'anthropic',
        model: 'claude',
        hint: '…a1b2',
        status: 'error',
        host: 'api.anthropic.com',
      },
    });
    renderLine();
    fireEvent.click(screen.getByRole('button', { name: 'Replace key' }));
    expect(screen.getByText('settings page')).toBeInTheDocument();
  });

  it('FE-AI-ERR-007: a provider limit names the provider, without guessing at its plan', () => {
    withError('rate_limited');
    renderLine();
    expect(screen.getByRole('status')).toHaveTextContent('Limit reached at Anthropic. Try again later.');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('FE-AI-ERR-008: waiting changes ask for a decision before a place can be suggested', () => {
    withError('decide_first');
    renderLine();
    expect(screen.getByRole('status')).toHaveTextContent('Decide on the open suggestions first.');
  });

  it('FE-AI-ERR-005: offline wins over any other error and offers nothing to press', () => {
    withError('provider_unavailable');
    setForcedOffline(true);
    renderLine();
    expect(screen.getByRole('status')).toHaveTextContent('Offline. The assistant needs internet.');
    expect(screen.queryByRole('button')).toBeNull();
  });
});
