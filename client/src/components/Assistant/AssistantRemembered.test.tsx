/**
 * FE-AI-REMEMBER-001 to FE-AI-REMEMBER-002
 *
 * A note the assistant kept on its own: a quiet line naming it, the trip
 * notes read again while the answer is written, and the notes a tap away.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';

import { useSettingsStore } from '../../store/settingsStore';
import AssistantRemembered from './AssistantRemembered';
import { type AssistantView, AssistantViewContext } from './assistantViewContext';

const SETTINGS = useSettingsStore.getState();

function renderLine(live: boolean) {
  const view: AssistantView = { tripId: 4, variant: 'window', density: 'compact' };
  return render(
    <AssistantViewContext.Provider value={view}>
      <AssistantRemembered note="We eat vegetarian" live={live} />
    </AssistantViewContext.Provider>
  );
}

afterEach(() => {
  useSettingsStore.setState(SETTINGS, true);
  vi.clearAllMocks();
});

describe('AssistantRemembered', () => {
  it('FE-AI-REMEMBER-001: names the note, and reads the notes again only while the answer is written', () => {
    const loadSettings = vi.fn(async () => {});
    useSettingsStore.setState({ loadSettings });
    const { unmount } = renderLine(false);
    expect(screen.getByText('We eat vegetarian')).toBeInTheDocument();
    expect(screen.getByText('Noted for this trip:')).toBeInTheDocument();
    expect(loadSettings).not.toHaveBeenCalled();
    unmount();
    renderLine(true);
    expect(loadSettings).toHaveBeenCalledTimes(1);
  });

  it('FE-AI-REMEMBER-002: the pencil opens the trip notes', () => {
    useSettingsStore.setState({ loadSettings: vi.fn(async () => {}) });
    renderLine(false);
    fireEvent.click(screen.getByRole('button', { name: 'Edit trip notes' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
