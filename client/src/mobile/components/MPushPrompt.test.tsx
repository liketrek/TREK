import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { useAuthStore } from '../../store/authStore';
import MPushPrompt, { PUSH_PROMPT_DELAY_MS, PUSH_PROMPT_KEY } from './MPushPrompt';

// FE-MOB-PUSHPROMPT-001 onwards: the app asks for notifications by itself, once.

const env = vi.hoisted(() => ({
  native: true,
  endpoint: null as string | null,
  offered: true,
  on: false,
  canSwitch: true,
  toggle: vi.fn(),
}));
vi.mock('../../native/push', () => ({
  nativePushActive: () => env.native,
  nativePushEndpoint: () => env.endpoint,
}));
vi.mock('../../push/webPush', () => ({ pushChannelOffered: () => Promise.resolve(env.offered) }));
vi.mock('../../hooks/useWebPush', () => ({
  useWebPush: () => ({ on: env.on, canSwitch: env.canSwitch, busy: false, toggle: env.toggle }),
}));

async function renderAndWait() {
  render(<MPushPrompt />);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(PUSH_PROMPT_DELAY_MS);
  });
}

describe('MPushPrompt', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.removeItem(PUSH_PROMPT_KEY);
    Object.assign(env, { native: true, endpoint: null, offered: true, on: false, canSwitch: true });
    env.toggle.mockClear();
    useAuthStore.setState({ isAuthenticated: true } as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('FE-MOB-PUSHPROMPT-001: a moment after signing in the app asks, and turning it on goes the settings card way', async () => {
    await renderAndWait();
    expect(screen.getByText('Turn on notifications?')).toBeInTheDocument();
    expect(window.localStorage.getItem(PUSH_PROMPT_KEY)).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Turn on' }));
    expect(env.toggle).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Turn on notifications?')).not.toBeInTheDocument();
  });

  it('FE-MOB-PUSHPROMPT-002: later closes it, and it is not asked again', async () => {
    await renderAndWait();
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(env.toggle).not.toHaveBeenCalled();
    expect(screen.queryByText('Turn on notifications?')).not.toBeInTheDocument();

    render(<MPushPrompt />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(PUSH_PROMPT_DELAY_MS);
    });
    expect(screen.queryByText('Turn on notifications?')).not.toBeInTheDocument();
  });

  it.each([
    ['in a browser', { native: false }],
    ['where the server offers no push', { offered: false }],
    ['on a device that is signed up already', { endpoint: 'https://push.liketrek.com/v1/apns/x' }],
  ])('FE-MOB-PUSHPROMPT-003: it does not ask %s', async (_case, over) => {
    Object.assign(env, over);
    await renderAndWait();
    expect(screen.queryByText('Turn on notifications?')).not.toBeInTheDocument();
    expect(window.localStorage.getItem(PUSH_PROMPT_KEY)).toBeNull();
  });

  it('FE-MOB-PUSHPROMPT-004: signed out, it waits', async () => {
    useAuthStore.setState({ isAuthenticated: false } as never);
    await renderAndWait();
    expect(screen.queryByText('Turn on notifications?')).not.toBeInTheDocument();
  });
});
