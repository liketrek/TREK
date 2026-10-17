// FE-MOB-WEBPUSH-001 to FE-MOB-WEBPUSH-004: the phone device card.
//
// Markup only, like its desktop twin: useWebPush is mocked and has its own
// spec, so these cases pin what each hook state renders and that the buttons
// reach the hook.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '../../../helpers/render';
import type { WebPushCardState } from '../../../../src/hooks/useWebPush';
import MWebPushCard from '../../../../src/mobile/screens/settings/MWebPushCard';

const hookState = vi.hoisted(() => ({ current: null as unknown as WebPushCardState }));
vi.mock('../../../../src/hooks/useWebPush', () => ({ useWebPush: () => hookState.current }));

function state(over: Partial<WebPushCardState> = {}): WebPushCardState {
  return {
    state: 'off',
    stateText: null,
    canSwitch: true,
    on: false,
    switchLabel: 'Turn on for this device',
    busy: false,
    canTest: false,
    toggle: vi.fn(),
    sendTest: vi.fn(),
    ...over,
  };
}

beforeEach(() => {
  hookState.current = state();
});

describe('MWebPushCard', () => {
  it('FE-MOB-WEBPUSH-001: explains itself and offers to switch on', async () => {
    render(<MWebPushCard />);
    expect(screen.getByText('Push notifications on this device')).toBeInTheDocument();
    expect(screen.getByText(/Shows TREK notifications on this device/)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    const turnOn = screen.getByRole('button', { name: 'Turn on for this device' });
    expect(turnOn.className).toContain('bg-m-act');
    expect(screen.getByRole('button', { name: 'Send test' })).toBeDisabled();

    await userEvent.click(turnOn);
    expect(hookState.current.toggle).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-WEBPUSH-002: when on, says so, offers to switch off and to test', async () => {
    hookState.current = state({
      state: 'on',
      on: true,
      stateText: 'On for this device',
      switchLabel: 'Turn off for this device',
      canTest: true,
    });
    render(<MWebPushCard />);
    expect(screen.getByRole('status')).toHaveTextContent('On for this device');
    expect(screen.getByRole('button', { name: 'Turn off for this device' }).className).not.toContain('bg-m-act');

    await userEvent.click(screen.getByRole('button', { name: 'Send test' }));
    expect(hookState.current.sendTest).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-WEBPUSH-003: a state that cannot be switched shows its sentence and no buttons', () => {
    hookState.current = state({ state: 'denied', canSwitch: false, stateText: 'Notifications are blocked.' });
    render(<MWebPushCard />);
    expect(screen.getByRole('status')).toHaveTextContent('Notifications are blocked.');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('FE-MOB-WEBPUSH-004: the switch is disabled while busy', () => {
    hookState.current = state({ busy: true });
    render(<MWebPushCard />);
    expect(screen.getByRole('button', { name: 'Turn on for this device' })).toBeDisabled();
  });
});
