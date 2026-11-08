import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { translator } from '../../src/lib/i18n';
import type { TrekAppState } from '../../src/lib/useTrekApp';
import { App } from '../../src/widgets/trip-list/App';

const openLink = vi.fn(async () => ({}));
const updateModelContext = vi.fn(async () => ({}));
let state: TrekAppState;

vi.mock('../../src/lib/useTrekApp', () => ({ useTrekApp: () => state }));

function withState(overrides: Partial<TrekAppState>) {
  state = {
    app: { openLink, updateModelContext } as unknown as TrekAppState['app'],
    result: null,
    input: null,
    error: null,
    locale: 'en-GB',
    t: translator('en'),
    ...overrides,
  };
}

afterEach(cleanup);

describe('trip-list App', () => {
  it('APPS-TRIPS-005: waits for the result, and says so when the host failed', () => {
    withState({});
    render(<App />);
    expect(screen.getByText('Loading…')).toBeTruthy();
    cleanup();
    withState({ error: new Error('no host') });
    render(<App />);
    expect(screen.getByText('Something went wrong. Try again.')).toBeTruthy();
  });

  it('APPS-TRIPS-006: asks the host to open the link and to note the picked trip', () => {
    const trip = { id: 3, user_id: 1, title: 'Lisbon', currency: 'EUR', is_archived: 0, reminder_days: 0 };
    withState({ result: { structuredContent: { trips: [trip] }, appUrl: 'https://trek.example' } });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Open in TREK' }));
    expect(openLink).toHaveBeenCalledWith({ url: 'https://trek.example/trips/3' });
    fireEvent.click(screen.getByRole('button', { name: 'Ask about this trip' }));
    // The trip by its id alone: its title is a traveller's text, not an instruction.
    expect(updateModelContext).toHaveBeenCalledWith({
      content: [{ type: 'text', text: 'The user picked the trip with tripId 3.' }],
      structuredContent: { tripId: 3 },
    });
  });
});
